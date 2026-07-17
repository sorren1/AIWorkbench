import { describe, expect, it } from "vitest";

import {
  createExecutionBudget,
  BudgetStopError,
  ExecutionBudgetTracker,
  ProviderNeutralUsageAccountant,
} from "../tools/local-sandbox/budgets";
import {
  canonicalNormalizedTraceJson,
  sanitizeTraceAttributes,
  type NormalizedTraceArtifact,
} from "../tools/local-sandbox/telemetry";

describe("execution budgets", () => {
  it("emits approaching and exceeded warnings without relabeling measurements", () => {
    const events: string[] = [];
    const tracker = new ExecutionBudgetTracker(
      createExecutionBudget({ maximumToolCalls: 1, actionOnThreshold: "WARN" }),
      () => 0,
      (event) => events.push(`${event.type}:${event.dimension}`),
    );
    tracker.beforeToolCall();
    tracker.beforeToolCall();
    const result = tracker.snapshot();
    expect(events).toEqual(["APPROACHING:TOOL_CALLS", "EXCEEDED:TOOL_CALLS"]);
    expect(result.outcome).toBe("WARNING");
    expect(result.dimensions.find((item) => item.dimension === "TOOL_CALLS")).toMatchObject({
      observed: 2,
      limit: 1,
      measurement: "EXACT",
      status: "EXCEEDED",
    });
  });

  it("stops a repair loop before an attempt beyond the explicit maximum", () => {
    const tracker = new ExecutionBudgetTracker(
      createExecutionBudget({ maximumRepairAttempts: 1, actionOnThreshold: "STOP_STAGE" }),
      () => 0,
    );
    tracker.beforeRepairAttempt();
    expect(() => tracker.beforeRepairAttempt()).toThrow(BudgetStopError);
    expect(tracker.snapshot("REPAIR_ATTEMPTS")).toMatchObject({
      outcome: "STOPPED",
      stopReason: "REPAIR_ATTEMPTS",
    });
  });

  it("enforces measured duration independently at run and stage boundaries", () => {
    let now = 0;
    const tracker = new ExecutionBudgetTracker(
      createExecutionBudget({
        maximumWallClockDurationMs: 100,
        maximumStageDurationMs: 50,
        actionOnThreshold: "STOP_RUN",
      }),
      () => now,
    );
    now = 51;
    expect(() => tracker.checkTime()).toThrow(/STAGE_DURATION/);
  });
});

describe("provider-neutral token and cost accounting", () => {
  it("reports exact zero when the deterministic path makes no model call", () => {
    expect(new ProviderNeutralUsageAccountant().snapshot().total).toEqual({
      modelCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      tokenMeasurement: "EXACT_ZERO_NO_MODEL",
      costMeasurement: "EXACT_ZERO_NO_MODEL",
    });
  });

  it("keeps provider-returned and estimated usage labels distinct", () => {
    const accountant = new ProviderNeutralUsageAccountant();
    accountant.record({
      stage: "implement",
      modelPolicyId: "model.policy.fixture",
      modelIdentifier: "provider-neutral-fixture",
      inputTokens: 100,
      outputTokens: 20,
      costUsd: 0.001,
      tokenMeasurement: "ACTUAL_PROVIDER_REPORTED",
      costMeasurement: "ACTUAL_PROVIDER_REPORTED",
      pricingSource: { id: "provider-receipt", version: "1", effectiveAt: null },
    });
    accountant.record({
      stage: "implement",
      modelPolicyId: "model.policy.fixture",
      modelIdentifier: "provider-neutral-fixture",
      inputTokens: 50,
      outputTokens: 10,
      costUsd: 0.0005,
      tokenMeasurement: "ESTIMATED",
      costMeasurement: "ESTIMATED",
      pricingSource: {
        id: "synthetic-pricing-fixture",
        version: "2026-07-public-fixture",
        effectiveAt: "2026-07-01T00:00:00.000Z",
      },
    });
    expect(accountant.snapshot().total).toMatchObject({
      modelCalls: 2,
      inputTokens: 150,
      outputTokens: 30,
      costUsd: 0.0015,
      tokenMeasurement: "ESTIMATED",
      costMeasurement: "ESTIMATED",
    });
  });
});

describe("trace safety and deterministic normalization", () => {
  it("drops unknown keys and redacts credential-shaped and multiline values", () => {
    const attributes = sanitizeTraceAttributes({
      "delivery.run.id": "sandbox-safe",
      "delivery.unsafe": "E2B_API_KEY=secret-value-that-must-not-appear",
      "delivery.multiline": "source\nbody",
      "prompt.body": "never retained",
    });
    const serialized = JSON.stringify(attributes);
    expect(attributes["delivery.run.id"]).toBe("sandbox-safe");
    expect(attributes["delivery.unsafe"]).toBe("[REDACTED]");
    expect(attributes["delivery.multiline"]).toBe("[REDACTED]");
    expect(attributes["prompt.body"]).toBeUndefined();
    expect(serialized).not.toContain("secret-value");
    expect(serialized).not.toContain("source\\nbody");
  });

  it("orders parents before same-millisecond children and stabilizes local snapshots", () => {
    const span = (spanId: string, startedAt: string): NormalizedTraceArtifact["spans"][number] => ({
      traceId: "a".repeat(32),
      spanId,
      parentSpanId: spanId === "1".repeat(16) ? null : "1".repeat(16),
      name: spanId === "1".repeat(16) ? "delivery.run" : "delivery.stage",
      kind: "INTERNAL",
      startedAt,
      durationMs: 1,
      status: "OK",
      statusDescription: null,
      attributes: {},
      events: [],
    });
    const artifact: NormalizedTraceArtifact = {
      schemaVersion: 1,
      format: "OTEL_COMPATIBLE_NORMALIZED_JSON",
      classification: "RECORDED_SYNTHETIC_PUBLIC_TRACE_EVIDENCE",
      disclosure: "Synthetic public trace fixture.",
      generatedAt: "2026-07-17T16:00:00.000Z",
      traceId: "a".repeat(32),
      resource: {
        serviceName: "ai-delivery-workbench.local-sandbox",
        serviceVersion: "1.0.0",
        telemetrySdk: {
          apiVersion: "1.9.1",
          sdkVersion: "2.9.0",
          semanticConventionsVersion: "1.43.0",
        },
      },
      bindings: {
        runId: "sandbox-fixture",
        issueId: "TOY-101",
        sourceCommit: "b".repeat(40),
        sourceTreeDigest: "c".repeat(64),
        testedRepositoryTreeDigest: "d".repeat(64),
        contextPackDigest: "e".repeat(64),
        agentCardHash: "f".repeat(64),
        approvalPolicyHash: "1".repeat(64),
        budgetPolicyHash: "2".repeat(64),
      },
      spans: [
        span("2".repeat(16), "2026-07-17T16:00:00.000Z"),
        span("1".repeat(16), "2026-07-17T16:00:00.000Z"),
      ],
      summary: {
        totalDurationMs: 2,
        spanCount: 2,
        failedSpanCount: 0,
        modelCallCount: 0,
        toolCallCount: 0,
        repairAttempts: 0,
        approvalWaitMs: 0,
        validationCommandCount: 0,
      },
      relatedArtifacts: [
        { name: "spec.md", route: "artifacts" },
        { name: "plan.md", route: "artifacts" },
      ],
    };
    const canonical = JSON.parse(canonicalNormalizedTraceJson(artifact)) as NormalizedTraceArtifact;
    expect(canonical.spans.map((item) => item.spanId)).toEqual(["1".repeat(16), "2".repeat(16)]);
    const reversed = {
      ...artifact,
      spans: [...artifact.spans].reverse(),
      relatedArtifacts: [...artifact.relatedArtifacts].reverse(),
    };
    expect(canonicalNormalizedTraceJson(artifact)).toBe(canonicalNormalizedTraceJson(reversed));
  });
});
