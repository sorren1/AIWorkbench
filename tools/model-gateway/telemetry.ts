import {
  ROOT_CONTEXT,
  SpanStatusCode,
  trace,
  type Attributes,
  type Span,
} from "@opentelemetry/api";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
  type ReadableSpan,
} from "@opentelemetry/sdk-trace-base";
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from "@opentelemetry/semantic-conventions";
import { z } from "zod";

import type { BudgetEvent } from "../local-sandbox/budgets";
import { sha256Bytes } from "../local-sandbox/security";
import { sanitizeTraceAttributes, type SafeSpanAttributes } from "../local-sandbox/telemetry";

const spanNameSchema = z.enum([
  "delivery.run",
  "delivery.stage",
  "agent.invoke",
  "model.call",
  "evidence.finalize",
]);
const eventNameSchema = z.enum([
  "budget.approaching",
  "budget.exceeded",
  "model.fallback",
  "operation.failed",
]);
const attributeSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.array(z.number()),
  z.array(z.boolean()),
]);

export const gatewayTraceArtifactSchema = z.object({
  schemaVersion: z.literal(1),
  format: z.literal("OTEL_COMPATIBLE_NORMALIZED_JSON"),
  classification: z.literal("LOCAL_GATEWAY_TRACE_EVIDENCE"),
  disclosure: z.string().min(1),
  generatedAt: z.iso.datetime(),
  traceId: z.string().regex(/^[a-f0-9]{32}$/),
  resource: z.object({
    serviceName: z.literal("ai-delivery-workbench.model-gateway"),
    serviceVersion: z.string().min(1),
  }),
  bindings: z.object({
    runId: z.string().min(1),
    issueId: z.literal("TOY-101"),
    agentId: z.string().min(1),
    agentVersion: z.string().min(1),
    agentHash: z.string().regex(/^[a-f0-9]{64}$/),
    modelPolicyId: z.string().min(1),
    modelPolicyVersion: z.string().min(1),
    modelPolicyHash: z.string().regex(/^[a-f0-9]{64}$/),
    credentialAlias: z.string().min(1),
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
  }),
  spans: z.array(
    z.object({
      traceId: z.string().regex(/^[a-f0-9]{32}$/),
      spanId: z.string().regex(/^[a-f0-9]{16}$/),
      parentSpanId: z
        .string()
        .regex(/^[a-f0-9]{16}$/)
        .nullable(),
      name: spanNameSchema,
      startedAt: z.iso.datetime(),
      durationMs: z.number().nonnegative(),
      status: z.enum(["UNSET", "OK", "ERROR"]),
      attributes: z.record(z.string(), attributeSchema),
      events: z.array(
        z.object({
          name: eventNameSchema,
          timestamp: z.iso.datetime(),
          attributes: z.record(z.string(), attributeSchema),
        }),
      ),
    }),
  ),
});

export type GatewayTraceArtifact = z.infer<typeof gatewayTraceArtifactSchema>;
export type GatewaySpanName = z.infer<typeof spanNameSchema>;

function hrTimeToMs(value: readonly [number, number]): number {
  return value[0] * 1000 + value[1] / 1_000_000;
}

function status(code: SpanStatusCode): "UNSET" | "OK" | "ERROR" {
  if (code === SpanStatusCode.OK) return "OK";
  if (code === SpanStatusCode.ERROR) return "ERROR";
  return "UNSET";
}

function normalizedAttributes(
  attributes: Attributes,
): Record<string, z.infer<typeof attributeSchema>> {
  return Object.fromEntries(
    Object.entries(sanitizeTraceAttributes(attributes)).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  ) as Record<string, z.infer<typeof attributeSchema>>;
}

function normalizedSpan(span: ReadableSpan): GatewayTraceArtifact["spans"][number] {
  return {
    traceId: span.spanContext().traceId,
    spanId: span.spanContext().spanId,
    parentSpanId: span.parentSpanContext?.spanId ?? null,
    name: spanNameSchema.parse(span.name),
    startedAt: new Date(hrTimeToMs(span.startTime)).toISOString(),
    durationMs: Number(hrTimeToMs(span.duration).toFixed(3)),
    status: status(span.status.code),
    attributes: normalizedAttributes(span.attributes),
    events: span.events.map((event) => ({
      name: eventNameSchema.parse(event.name),
      timestamp: new Date(hrTimeToMs(event.time)).toISOString(),
      attributes: normalizedAttributes(event.attributes ?? {}),
    })),
  };
}

function orderSpans(
  spans: readonly GatewayTraceArtifact["spans"][number][],
): GatewayTraceArtifact["spans"] {
  const output: GatewayTraceArtifact["spans"] = [];
  const children = new Map<string | null, GatewayTraceArtifact["spans"]>();
  for (const span of spans)
    children.set(span.parentSpanId, [...(children.get(span.parentSpanId) ?? []), span]);
  for (const siblings of children.values())
    siblings.sort((left, right) => left.startedAt.localeCompare(right.startedAt));
  const visit = (span: GatewayTraceArtifact["spans"][number]): void => {
    output.push(span);
    for (const child of children.get(span.spanId) ?? []) visit(child);
  };
  for (const root of children.get(null) ?? []) visit(root);
  return output;
}

export class ModelGatewayTelemetry {
  private readonly exporter = new InMemorySpanExporter();
  private readonly provider: BasicTracerProvider;
  private readonly tracer;

  constructor(private readonly serviceVersion = "1.0.0") {
    this.provider = new BasicTracerProvider({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: "ai-delivery-workbench.model-gateway",
        [ATTR_SERVICE_VERSION]: serviceVersion,
      }),
      spanProcessors: [new SimpleSpanProcessor(this.exporter)],
      generalLimits: { attributeValueLengthLimit: 256, attributeCountLimit: 64 },
    });
    this.tracer = this.provider.getTracer("ai-delivery-workbench.model-gateway", serviceVersion);
  }

  startSpan(name: GatewaySpanName, parent: Span | null, attributes: SafeSpanAttributes): Span {
    const context = parent ? trace.setSpan(ROOT_CONTEXT, parent) : ROOT_CONTEXT;
    return this.tracer.startSpan(
      name,
      { attributes: sanitizeTraceAttributes(attributes) },
      context,
    );
  }

  succeed(span: Span, attributes: SafeSpanAttributes = {}): void {
    span.setAttributes(sanitizeTraceAttributes(attributes));
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();
  }

  fail(span: Span, errorType: string): void {
    span.setAttribute("error.type", errorType.slice(0, 128));
    span.addEvent("operation.failed", { "error.type": errorType.slice(0, 128) });
    span.setStatus({ code: SpanStatusCode.ERROR });
    span.end();
  }

  fallback(span: Span, fromModelId: string, toModelId: string, attempt: number): void {
    span.addEvent(
      "model.fallback",
      sanitizeTraceAttributes({
        "delivery.model.fallback.from": fromModelId,
        "delivery.model.fallback.to": toModelId,
        "delivery.model.fallback.attempt": attempt,
      }),
    );
  }

  budgetEvent(span: Span, event: BudgetEvent): void {
    span.addEvent(event.type === "APPROACHING" ? "budget.approaching" : "budget.exceeded", {
      "delivery.budget.dimension": event.dimension,
      "delivery.budget.observed": event.observed,
      "delivery.budget.limit": event.limit,
      "delivery.budget.action": event.action,
    });
  }

  async artifact(
    generatedAt: string,
    bindings: GatewayTraceArtifact["bindings"],
    expectedTraceId: string,
  ): Promise<{
    readonly artifact: GatewayTraceArtifact;
    readonly json: string;
    readonly sha256: string;
  }> {
    await this.provider.forceFlush();
    const spans = orderSpans(
      this.exporter
        .getFinishedSpans()
        .map(normalizedSpan)
        .filter((span) => span.traceId === expectedTraceId),
    );
    const artifact = gatewayTraceArtifactSchema.parse({
      schemaVersion: 1,
      format: "OTEL_COMPATIBLE_NORMALIZED_JSON",
      classification: "LOCAL_GATEWAY_TRACE_EVIDENCE",
      disclosure:
        "Developer-invoked local gateway trace. It records safe routing metadata and digests; prompts, responses, source code, credentials, and secrets are excluded.",
      generatedAt,
      traceId: expectedTraceId,
      resource: {
        serviceName: "ai-delivery-workbench.model-gateway",
        serviceVersion: this.serviceVersion,
      },
      bindings,
      spans,
    });
    const json = `${JSON.stringify(artifact, null, 2)}\n`;
    return { artifact, json, sha256: sha256Bytes(json) };
  }
}
