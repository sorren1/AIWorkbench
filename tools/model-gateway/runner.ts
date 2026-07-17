import type { Span } from "@opentelemetry/api";

import type { ModelPolicy, ModelTask } from "../../src/demo/control-plane/registry/contracts";
import type { AgentCard } from "../../src/demo/control-plane/registry/contracts";
import {
  accountingBudgetUsage,
  BudgetStopError,
  createExecutionBudget,
  ExecutionBudgetTracker,
  ProviderNeutralUsageAccountant,
  type BudgetResult,
} from "../local-sandbox/budgets";
import {
  assertRunnableModelPolicy,
  MODEL_GATEWAY_VALIDATED_LABEL,
  ModelGatewayRequestError,
  scopedCredentialAlias,
  type ModelCallReceipt,
  type ModelCatalogSnapshot,
  type ModelGateway,
  type ModelGatewayProfile,
  type ScopedCredentialLease,
  type ScopedCredentialRequest,
} from "./contracts";
import type { ModelGatewayEvidence } from "./evidence";
import { ModelGatewayTelemetry } from "./telemetry";

export type GatewayRunOptions = {
  readonly gateway: ModelGateway;
  readonly profile: ModelGatewayProfile;
  readonly policy: ModelPolicy;
  readonly agent: AgentCard;
  readonly runId: string;
  readonly sourceCommit: string;
  readonly generatedAt?: string;
  readonly telemetry?: ModelGatewayTelemetry;
};

export type GatewayRunResult = {
  readonly evidence: ModelGatewayEvidence | null;
  readonly trace: Awaited<ReturnType<ModelGatewayTelemetry["artifact"]>>;
  readonly catalog: ModelCatalogSnapshot;
  readonly calls: readonly ModelCallReceipt[];
  readonly budget: BudgetResult;
  readonly credentialAlias: string;
  readonly credentialRevoked: true;
  readonly independentReview: "NOT_REQUIRED" | "EXERCISED";
};

type RoutedCall = {
  readonly receipt: ModelCallReceipt;
  readonly attempt: number;
  readonly fallback: boolean;
};

function errorType(error: unknown): string {
  if (error instanceof BudgetStopError) return `BudgetStopError.${error.dimension}`;
  if (error instanceof ModelGatewayRequestError)
    return `ModelGatewayRequestError.${error.operation}`;
  return error instanceof Error ? error.name : "UnknownError";
}

function safeRunId(value: string): string {
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(value)) throw new Error("Unsafe run ID.");
  return value;
}

function ensureCatalogAllowsPolicy(catalog: ModelCatalogSnapshot, policy: ModelPolicy): void {
  const available = new Set(catalog.entries.map((entry) => entry.modelId));
  const missing = policy.allowedModelIds.filter((modelId) => !available.has(modelId));
  if (missing.length > 0) throw new Error(`Gateway catalog is missing ${missing.join(", ")}.`);
}

async function routedCall(input: {
  readonly gateway: ModelGateway;
  readonly lease: ScopedCredentialLease;
  readonly policy: ModelPolicy;
  readonly task: ModelTask;
  readonly candidates: readonly string[];
  readonly parent: Span;
  readonly telemetry: ModelGatewayTelemetry;
  readonly budget: ExecutionBudgetTracker;
  readonly accountant: ProviderNeutralUsageAccountant;
}): Promise<RoutedCall> {
  let lastError: unknown = new Error("No model candidate was configured.");
  for (const [index, modelId] of input.candidates.entries()) {
    input.budget.beforeToolCall();
    const span = input.telemetry.startSpan("model.call", input.parent, {
      "delivery.model.policy.id": input.policy.id,
      "delivery.model.requested.id": modelId,
      "delivery.model.attempt": index + 1,
      "delivery.model.fallback": index > 0,
      "delivery.credential.alias": input.lease.alias,
      "delivery.stage.id": "implement",
      "delivery.task": input.task,
    });
    try {
      const receipt = await input.gateway.callModel({
        lease: input.lease,
        modelId,
        stageId: "implement",
        task: input.task,
        systemInstruction:
          "You are evaluating a repository-owned synthetic coding fixture. Return one concise risk classification. Do not request credentials or external access.",
        requestText:
          "Synthetic issue TOY-101 changes one allow-listed arithmetic helper and is validated by fixed repository tests.",
        maximumOutputTokens: input.policy.maximumOutputTokens,
        temperature: input.policy.temperature,
        timeoutMs: input.policy.maximumLatencyMs,
      });
      input.accountant.record({
        stage: "implement",
        modelPolicyId: input.policy.id,
        modelIdentifier: receipt.responseModelId,
        inputTokens: receipt.inputTokens,
        outputTokens: receipt.outputTokens,
        costUsd: receipt.costUsd,
        tokenMeasurement: receipt.tokenMeasurement,
        costMeasurement: receipt.costMeasurement,
        pricingSource: receipt.pricingSource,
      });
      input.budget.setUsage(accountingBudgetUsage(input.accountant.snapshot()));
      input.telemetry.succeed(span, {
        "delivery.model.provider.id": receipt.providerId,
        "delivery.model.response.id": receipt.responseModelId,
        "delivery.model.usage.input_tokens": receipt.inputTokens,
        "delivery.model.usage.output_tokens": receipt.outputTokens,
        "delivery.model.usage.token_measurement": receipt.tokenMeasurement,
        "delivery.model.cost.usd": receipt.costUsd,
        "delivery.model.cost.measurement": receipt.costMeasurement,
        "delivery.model.latency_ms": receipt.latencyMs,
        "delivery.model.output.sha256": receipt.outputSha256,
      });
      return { receipt, attempt: index + 1, fallback: index > 0 };
    } catch (error) {
      lastError = error;
      input.telemetry.fail(span, errorType(error));
      const next = input.candidates[index + 1];
      if (!(error instanceof ModelGatewayRequestError) || !error.retryable || !next) throw error;
      input.telemetry.fallback(input.parent, modelId, next, index + 1);
    }
  }
  throw lastError;
}

export async function runModelGateway(options: GatewayRunOptions): Promise<GatewayRunResult> {
  const runId = safeRunId(options.runId);
  const generatedAt = options.generatedAt ?? new Date().toISOString();
  assertRunnableModelPolicy(options.policy, "implement", "CODE_CHANGE", options.profile);
  const credentialRequest: ScopedCredentialRequest = {
    projectId: "ai-delivery-workbench",
    agentId: options.agent.id,
    runId,
    allowedModelIds: options.policy.allowedModelIds,
    maximumCostUsd: options.policy.maximumCostUsd,
    durationSeconds: 900,
  };
  const credentialAlias = scopedCredentialAlias(credentialRequest);
  const telemetry = options.telemetry ?? new ModelGatewayTelemetry();
  const runSpan = telemetry.startSpan("delivery.run", null, {
    "delivery.run.id": runId,
    "delivery.issue.id": "TOY-101",
    "delivery.agent.id": options.agent.id,
    "delivery.agent.version": options.agent.version,
    "delivery.agent.hash": options.agent.contentHash,
    "delivery.model.policy.id": options.policy.id,
    "delivery.model.policy.version": options.policy.version,
    "delivery.model.policy.hash": options.policy.contentHash,
    "delivery.credential.alias": credentialAlias,
    "delivery.gateway.kind": options.gateway.kind,
    "delivery.gateway.profile": options.profile,
  });
  const budgetPolicy = createExecutionBudget({
    id: "budget.local-model-gateway",
    version: "1.0.0",
    maximumWallClockDurationMs:
      options.policy.maximumLatencyMs * (1 + options.policy.fallbackOrder.length) + 10_000,
    maximumStageDurationMs:
      options.policy.maximumLatencyMs * (1 + options.policy.fallbackOrder.length) + 5_000,
    maximumToolCalls:
      1 + options.policy.fallbackOrder.length + (options.policy.independentReview.required ? 1 : 0),
    maximumRepairAttempts: 0,
    maximumInputTokens: options.policy.maximumInputTokens,
    maximumOutputTokens: options.policy.maximumOutputTokens,
    maximumCostUsd: options.policy.maximumCostUsd,
    actionOnThreshold: "STOP_RUN",
  });
  const budget = new ExecutionBudgetTracker(budgetPolicy, undefined, (event) =>
    telemetry.budgetEvent(runSpan, event),
  );
  const accountant = new ProviderNeutralUsageAccountant();
  let lease: ScopedCredentialLease | null = null;
  let revoked = false;
  let stageSpan: Span | null = null;
  let agentSpan: Span | null = null;
  try {
    const catalog = await options.gateway.fetchCatalog();
    ensureCatalogAllowsPolicy(catalog, options.policy);
    lease = await options.gateway.reconcileScopedCredential(credentialRequest);
    stageSpan = telemetry.startSpan("delivery.stage", runSpan, {
      "delivery.run.id": runId,
      "delivery.stage.id": "implement",
    });
    agentSpan = telemetry.startSpan("agent.invoke", stageSpan, {
      "delivery.agent.id": options.agent.id,
      "delivery.agent.version": options.agent.version,
      "delivery.model.policy.id": options.policy.id,
      "delivery.credential.alias": lease.alias,
    });
    const primary = await routedCall({
      gateway: options.gateway,
      lease,
      policy: options.policy,
      task: "CODE_CHANGE",
      candidates: [options.policy.preferredModelId, ...options.policy.fallbackOrder],
      parent: agentSpan,
      telemetry,
      budget,
      accountant,
    });
    const calls: RoutedCall[] = [primary];
    let independentReview: GatewayRunResult["independentReview"] = "NOT_REQUIRED";
    if (options.policy.independentReview.required) {
      const reviewModel = options.policy.independentReview.modelId;
      if (!reviewModel || reviewModel === primary.receipt.responseModelId) {
        throw new Error("Independent review requires a distinct allowed model.");
      }
      assertRunnableModelPolicy(options.policy, "implement", "INDEPENDENT_REVIEW", options.profile);
      calls.push(
        await routedCall({
          gateway: options.gateway,
          lease,
          policy: options.policy,
          task: "INDEPENDENT_REVIEW",
          candidates: [reviewModel],
          parent: agentSpan,
          telemetry,
          budget,
          accountant,
        }),
      );
      independentReview = "EXERCISED";
    }
    await options.gateway.revokeScopedCredential(lease);
    revoked = true;
    const finalizeSpan = telemetry.startSpan("evidence.finalize", agentSpan, {
      "delivery.evidence.classification": "LOCAL_SYNTHETIC_MODEL_GATEWAY_EVIDENCE",
      "delivery.credential.revoked": true,
    });
    telemetry.succeed(finalizeSpan);
    telemetry.succeed(agentSpan, { "delivery.model.call_count": calls.length });
    telemetry.succeed(stageSpan);
    telemetry.succeed(runSpan);
    const trace = await telemetry.artifact(
      generatedAt,
      {
        runId,
        issueId: "TOY-101",
        agentId: options.agent.id,
        agentVersion: options.agent.version,
        agentHash: options.agent.contentHash,
        modelPolicyId: options.policy.id,
        modelPolicyVersion: options.policy.version,
        modelPolicyHash: options.policy.contentHash,
        credentialAlias,
        sourceCommit: options.sourceCommit,
      },
      runSpan.spanContext().traceId,
    );
    const budgetResult = budget.snapshot();
    const evidence =
      options.profile === "live"
        ? ({
            schemaVersion: 1,
            classification: "LOCAL_SYNTHETIC_MODEL_GATEWAY_EVIDENCE",
            validationLabel: MODEL_GATEWAY_VALIDATED_LABEL,
            generatedAt,
            sourceCommit: options.sourceCommit,
            runId,
            issueId: "TOY-101",
            gateway: {
              kind: "LITELLM_LOCAL",
              implementation: "LiteLLM",
              implementationVersion: "1.92.0",
              credentialAlias,
              credentialRevoked: true,
            },
            policy: {
              id: options.policy.id,
              version: options.policy.version,
              contentHash: options.policy.contentHash,
              preferredModelId: options.policy.preferredModelId,
              fallbackOrder: [...options.policy.fallbackOrder],
              independentReview: {
                required: options.policy.independentReview.required,
                exercised: independentReview === "EXERCISED",
              },
            },
            catalog,
            calls: calls.map((call) => ({
              attempt: call.attempt,
              providerId: call.receipt.providerId,
              requestedModelId: call.receipt.requestedModelId,
              responseModelId: call.receipt.responseModelId,
              latencyMs: call.receipt.latencyMs,
              inputTokens: call.receipt.inputTokens,
              outputTokens: call.receipt.outputTokens,
              tokenMeasurement: call.receipt.tokenMeasurement,
              costUsd: call.receipt.costUsd,
              costMeasurement: call.receipt.costMeasurement,
              pricingSource: call.receipt.pricingSource,
              outputSha256: call.receipt.outputSha256,
              outputCharacterCount: call.receipt.outputCharacterCount,
              fallback: call.fallback,
            })),
            budget: {
              policy: budgetPolicy,
              result: { outcome: budgetResult.outcome, stopReason: budgetResult.stopReason },
            },
            trace: { traceId: trace.artifact.traceId, artifactSha256: trace.sha256 },
          } satisfies ModelGatewayEvidence)
        : null;
    return {
      evidence,
      trace,
      catalog,
      calls: calls.map((call) => call.receipt),
      budget: budgetResult,
      credentialAlias,
      credentialRevoked: true,
      independentReview,
    };
  } catch (error) {
    if (agentSpan) telemetry.fail(agentSpan, errorType(error));
    if (stageSpan) telemetry.fail(stageSpan, errorType(error));
    telemetry.fail(runSpan, errorType(error));
    throw error;
  } finally {
    if (lease && !revoked) await options.gateway.revokeScopedCredential(lease);
  }
}
