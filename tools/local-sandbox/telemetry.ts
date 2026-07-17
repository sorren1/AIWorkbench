import {
  ROOT_CONTEXT,
  SpanStatusCode,
  trace,
  type AttributeValue,
  type Attributes,
  type Span,
  type TimeInput,
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

import type { BudgetEvent } from "./budgets";
import { sha256Bytes } from "./security";

export const TRACE_SCHEMA_VERSION = 1 as const;
export const TRACE_FORMAT = "OTEL_COMPATIBLE_NORMALIZED_JSON" as const;
export const OTEL_PACKAGE_VERSIONS = {
  api: "1.9.1",
  sdkTraceBase: "2.9.0",
  semanticConventions: "1.43.0",
} as const;

const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
const scalarAttributeSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.array(z.number()),
  z.array(z.boolean()),
]);

export const normalizedTraceArtifactSchema = z.object({
  schemaVersion: z.literal(TRACE_SCHEMA_VERSION),
  format: z.literal(TRACE_FORMAT),
  classification: z.literal("RECORDED_SYNTHETIC_PUBLIC_TRACE_EVIDENCE"),
  disclosure: z.string().min(1),
  generatedAt: z.iso.datetime(),
  traceId: z.string().regex(/^[a-f0-9]{32}$/),
  resource: z.object({
    serviceName: z.literal("ai-delivery-workbench.local-sandbox"),
    serviceVersion: z.string().min(1),
    telemetrySdk: z.object({
      apiVersion: z.string().min(1),
      sdkVersion: z.string().min(1),
      semanticConventionsVersion: z.string().min(1),
    }),
  }),
  bindings: z.object({
    runId: z.string().min(1),
    issueId: z.literal("TOY-101"),
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
    sourceTreeDigest: hashSchema,
    testedRepositoryTreeDigest: hashSchema.nullable(),
    contextPackDigest: hashSchema,
    agentCardHash: hashSchema,
    approvalPolicyHash: hashSchema,
    budgetPolicyHash: hashSchema,
  }),
  spans: z
    .array(
      z.object({
        traceId: z.string().regex(/^[a-f0-9]{32}$/),
        spanId: z.string().regex(/^[a-f0-9]{16}$/),
        parentSpanId: z
          .string()
          .regex(/^[a-f0-9]{16}$/)
          .nullable(),
        name: z.enum([
          "delivery.run",
          "delivery.stage",
          "agent.invoke",
          "model.call",
          "tool.call",
          "approval.wait",
          "sandbox.execute",
          "validation.command",
          "evidence.finalize",
        ]),
        kind: z.literal("INTERNAL"),
        startedAt: z.iso.datetime(),
        durationMs: z.number().nonnegative(),
        status: z.enum(["UNSET", "OK", "ERROR"]),
        statusDescription: z.string().nullable(),
        attributes: z.record(z.string(), scalarAttributeSchema),
        events: z.array(
          z.object({
            name: z.enum(["budget.approaching", "budget.exceeded", "operation.failed"]),
            timestamp: z.iso.datetime(),
            attributes: z.record(z.string(), scalarAttributeSchema),
          }),
        ),
      }),
    )
    .min(1),
  summary: z.object({
    totalDurationMs: z.number().nonnegative(),
    spanCount: z.number().int().positive(),
    failedSpanCount: z.number().int().nonnegative(),
    modelCallCount: z.number().int().nonnegative(),
    toolCallCount: z.number().int().nonnegative(),
    repairAttempts: z.number().int().nonnegative(),
    approvalWaitMs: z.number().nonnegative(),
    validationCommandCount: z.number().int().nonnegative(),
  }),
  relatedArtifacts: z.array(
    z.object({
      name: z.enum(["spec.md", "plan.md", "change-targets.json", "context-pack.json"]),
      route: z.literal("artifacts"),
    }),
  ),
});

export type NormalizedTraceArtifact = z.infer<typeof normalizedTraceArtifactSchema>;

export type DeliverySpanName = NormalizedTraceArtifact["spans"][number]["name"];
export type SafeSpanAttributes = Readonly<Record<string, AttributeValue | undefined>>;

const SENSITIVE_VALUE =
  /(?:E2B_API_KEY\s*=|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:sk|e2b)_[a-z0-9_-]{12,}|bearer\s+[a-z0-9._-]{12,})/i;

function safeValue(value: AttributeValue): AttributeValue {
  if (typeof value === "string") {
    if (value.includes("\n") || value.includes("\r") || SENSITIVE_VALUE.test(value)) {
      return "[REDACTED]";
    }
    return value.slice(0, 256);
  }
  if (Array.isArray(value)) {
    const items = value.slice(0, 32);
    if (items.every((item) => typeof item === "string" || item == null)) {
      return items
        .filter((item): item is string => typeof item === "string")
        .map((item) => safeValue(item) as string);
    }
    if (items.every((item) => typeof item === "number" || item == null)) {
      return items.filter((item): item is number => typeof item === "number");
    }
    return items.filter((item): item is boolean => typeof item === "boolean");
  }
  return value;
}

export function sanitizeTraceAttributes(input: SafeSpanAttributes): Attributes {
  const output: Attributes = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    if (key !== "error.type" && !key.startsWith("delivery.")) continue;
    output[key] = safeValue(value);
  }
  return output;
}

function hrTimeToMilliseconds(value: readonly [number, number]): number {
  return value[0] * 1000 + value[1] / 1_000_000;
}

function timeToIso(value: readonly [number, number]): string {
  return new Date(hrTimeToMilliseconds(value)).toISOString();
}

function statusName(code: SpanStatusCode): "UNSET" | "OK" | "ERROR" {
  if (code === SpanStatusCode.OK) return "OK";
  if (code === SpanStatusCode.ERROR) return "ERROR";
  return "UNSET";
}

function normalizedAttributes(
  attributes: Attributes,
): Record<string, z.infer<typeof scalarAttributeSchema>> {
  return Object.fromEntries(
    Object.entries(sanitizeTraceAttributes(attributes)).sort(([left], [right]) =>
      left.localeCompare(right),
    ),
  ) as Record<string, z.infer<typeof scalarAttributeSchema>>;
}

function normalizeSpan(span: ReadableSpan): NormalizedTraceArtifact["spans"][number] {
  return {
    traceId: span.spanContext().traceId,
    spanId: span.spanContext().spanId,
    parentSpanId: span.parentSpanContext?.spanId ?? null,
    name: span.name as DeliverySpanName,
    kind: "INTERNAL",
    startedAt: timeToIso(span.startTime),
    durationMs: Number(hrTimeToMilliseconds(span.duration).toFixed(3)),
    status: statusName(span.status.code),
    statusDescription: span.status.message || null,
    attributes: normalizedAttributes(span.attributes),
    events: span.events
      .map((event) => ({
        name: event.name as NormalizedTraceArtifact["spans"][number]["events"][number]["name"],
        timestamp: timeToIso(event.time),
        attributes: normalizedAttributes(event.attributes ?? {}),
      }))
      .sort((left, right) =>
        left.timestamp === right.timestamp
          ? left.name.localeCompare(right.name)
          : left.timestamp.localeCompare(right.timestamp),
      ),
  };
}

function compareSpans(
  left: NormalizedTraceArtifact["spans"][number],
  right: NormalizedTraceArtifact["spans"][number],
): number {
  if (left.startedAt !== right.startedAt) return left.startedAt.localeCompare(right.startedAt);
  if (left.name !== right.name) return left.name.localeCompare(right.name);
  return left.spanId.localeCompare(right.spanId);
}

export function orderTraceSpansByHierarchy(
  spans: readonly NormalizedTraceArtifact["spans"][number][],
): NormalizedTraceArtifact["spans"] {
  const children = new Map<string | null, NormalizedTraceArtifact["spans"]>();
  for (const span of spans) {
    const siblings = children.get(span.parentSpanId) ?? [];
    siblings.push(span);
    children.set(span.parentSpanId, siblings);
  }
  for (const siblings of children.values()) siblings.sort(compareSpans);

  const ordered: NormalizedTraceArtifact["spans"] = [];
  const visited = new Set<string>();
  const visit = (span: NormalizedTraceArtifact["spans"][number]): void => {
    if (visited.has(span.spanId)) return;
    visited.add(span.spanId);
    ordered.push(span);
    for (const child of children.get(span.spanId) ?? []) visit(child);
  };
  for (const root of children.get(null) ?? []) visit(root);
  for (const span of [...spans].sort(compareSpans)) visit(span);
  return ordered;
}

export type TraceBindings = NormalizedTraceArtifact["bindings"];

export type TraceArtifactOutput = {
  readonly artifact: NormalizedTraceArtifact;
  readonly json: string;
  readonly sha256: string;
};

export class DeliveryTelemetry {
  private readonly exporter = new InMemorySpanExporter();
  private readonly provider: BasicTracerProvider;
  private readonly tracer;

  constructor(serviceVersion: string) {
    this.provider = new BasicTracerProvider({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: "ai-delivery-workbench.local-sandbox",
        [ATTR_SERVICE_VERSION]: serviceVersion,
      }),
      spanProcessors: [new SimpleSpanProcessor(this.exporter)],
      generalLimits: { attributeValueLengthLimit: 256, attributeCountLimit: 64 },
    });
    this.tracer = this.provider.getTracer("ai-delivery-workbench.delivery", serviceVersion);
  }

  startSpan(
    name: DeliverySpanName,
    parent: Span | null,
    attributes: SafeSpanAttributes,
    startTime?: TimeInput,
  ): Span {
    const parentContext = parent ? trace.setSpan(ROOT_CONTEXT, parent) : ROOT_CONTEXT;
    return this.tracer.startSpan(
      name,
      { attributes: sanitizeTraceAttributes(attributes), ...(startTime ? { startTime } : {}) },
      parentContext,
    );
  }

  succeed(span: Span, attributes: SafeSpanAttributes = {}, endTime?: TimeInput): void {
    span.setAttributes(sanitizeTraceAttributes(attributes));
    span.setStatus({ code: SpanStatusCode.OK });
    span.end(endTime);
  }

  fail(span: Span, errorType: string, endTime?: TimeInput): void {
    span.setAttribute("error.type", safeValue(errorType));
    span.addEvent("operation.failed", { "error.type": safeValue(errorType) });
    span.setStatus({ code: SpanStatusCode.ERROR, message: "Operation failed; inspect evidence." });
    span.end(endTime);
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
    bindings: TraceBindings,
    expectedTraceId: string,
  ): Promise<TraceArtifactOutput> {
    await this.provider.forceFlush();
    const spans = orderTraceSpansByHierarchy(this.exporter.getFinishedSpans().map(normalizeSpan));
    const root = spans.find((span) => span.parentSpanId === null);
    if (!root || root.traceId !== expectedTraceId) {
      throw new Error("Normalized trace is missing the expected delivery.run root span.");
    }
    const traceSpans = spans.filter((span) => span.traceId === expectedTraceId);
    const artifact = normalizedTraceArtifactSchema.parse({
      schemaVersion: TRACE_SCHEMA_VERSION,
      format: TRACE_FORMAT,
      classification: "RECORDED_SYNTHETIC_PUBLIC_TRACE_EVIDENCE",
      disclosure:
        "Recorded OpenTelemetry-compatible trace from a developer-invoked run over repository-owned synthetic fixtures. Attributes exclude prompts, source code, command input, credentials, secrets, and personal data.",
      generatedAt,
      traceId: expectedTraceId,
      resource: {
        serviceName: "ai-delivery-workbench.local-sandbox",
        serviceVersion: "1.0.0",
        telemetrySdk: {
          apiVersion: OTEL_PACKAGE_VERSIONS.api,
          sdkVersion: OTEL_PACKAGE_VERSIONS.sdkTraceBase,
          semanticConventionsVersion: OTEL_PACKAGE_VERSIONS.semanticConventions,
        },
      },
      bindings,
      spans: traceSpans,
      summary: {
        totalDurationMs: root.durationMs,
        spanCount: traceSpans.length,
        failedSpanCount: traceSpans.filter((span) => span.status === "ERROR").length,
        modelCallCount: traceSpans.filter((span) => span.name === "model.call").length,
        toolCallCount: traceSpans.filter((span) => span.name === "tool.call").length,
        repairAttempts: Math.max(
          0,
          ...traceSpans.map((span) => {
            const value = span.attributes["delivery.repair.attempt"];
            return typeof value === "number" ? value : 0;
          }),
        ),
        approvalWaitMs: traceSpans
          .filter((span) => span.name === "approval.wait")
          .reduce((total, span) => total + span.durationMs, 0),
        validationCommandCount: traceSpans.filter((span) => span.name === "validation.command")
          .length,
      },
      relatedArtifacts: [
        { name: "spec.md", route: "artifacts" },
        { name: "plan.md", route: "artifacts" },
        { name: "change-targets.json", route: "artifacts" },
        { name: "context-pack.json", route: "artifacts" },
      ],
    });
    const json = `${JSON.stringify(artifact, null, 2)}\n`;
    return { artifact, json, sha256: sha256Bytes(json) };
  }
}

export function validateNormalizedTraceArtifact(
  value: unknown,
):
  | { readonly valid: true; readonly value: NormalizedTraceArtifact }
  | { readonly valid: false; readonly errors: readonly string[] } {
  const parsed = normalizedTraceArtifactSchema.safeParse(value);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }
  const trace = parsed.data;
  const errors: string[] = [];
  const ids = new Set(trace.spans.map((span) => span.spanId));
  const roots = trace.spans.filter((span) => span.parentSpanId === null);
  if (roots.length !== 1 || roots[0]?.name !== "delivery.run") {
    errors.push("Trace must contain exactly one delivery.run root span.");
  }
  for (const span of trace.spans) {
    if (span.traceId !== trace.traceId) errors.push(`Trace ID mismatch: ${span.spanId}`);
    if (span.parentSpanId && !ids.has(span.parentSpanId)) {
      errors.push(`Missing parent span: ${span.spanId}`);
    }
  }
  return errors.length === 0 ? { valid: true, value: trace } : { valid: false, errors };
}

export function canonicalNormalizedTraceJson(value: NormalizedTraceArtifact): string {
  const parsed = normalizedTraceArtifactSchema.parse(value);
  return JSON.stringify({
    ...parsed,
    spans: orderTraceSpansByHierarchy(parsed.spans),
    relatedArtifacts: [...parsed.relatedArtifacts].sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
  });
}
