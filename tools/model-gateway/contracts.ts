import { createHash } from "node:crypto";

import { z } from "zod";

import type { ModelPolicy, ModelTask } from "../../src/demo/control-plane/registry/contracts";
import type { StageId } from "../../src/demo/data/types";

export const MODEL_GATEWAY_IMPLEMENTATION_LABEL =
  "gateway implemented; live provider path not validated" as const;
export const MODEL_GATEWAY_VALIDATED_LABEL = "validated local gateway integration" as const;

export type ModelGatewayKind = "OFFLINE_MOCK" | "LITELLM_LOCAL";
export type ModelGatewayProfile = "offline" | "live";

export const modelCatalogEntrySchema = z.object({
  providerId: z.string().min(1),
  modelId: z.string().min(1),
  maximumInputTokens: z.number().int().positive().nullable(),
  maximumOutputTokens: z.number().int().positive().nullable(),
  inputCostPerTokenUsd: z.number().nonnegative().nullable(),
  outputCostPerTokenUsd: z.number().nonnegative().nullable(),
});

export type ModelCatalogEntry = z.infer<typeof modelCatalogEntrySchema>;

export const modelCatalogSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
  classification: z.literal("SANITIZED_LOCAL_GATEWAY_CATALOG"),
  gatewayKind: z.enum(["OFFLINE_MOCK", "LITELLM_LOCAL"]),
  retrievedAt: z.iso.datetime(),
  entries: z.array(modelCatalogEntrySchema),
});

export type ModelCatalogSnapshot = z.infer<typeof modelCatalogSnapshotSchema>;

export type ScopedCredentialRequest = {
  readonly projectId: "ai-delivery-workbench";
  readonly agentId: string;
  readonly runId: string;
  readonly allowedModelIds: readonly string[];
  readonly maximumCostUsd: number;
  readonly durationSeconds: number;
};

export type ScopedCredentialLease = {
  readonly leaseId: string;
  readonly alias: string;
  readonly gatewayKind: ModelGatewayKind;
  readonly runId: string;
  readonly agentId: string;
  readonly allowedModelIds: readonly string[];
  readonly maximumCostUsd: number;
  readonly createdAt: string;
  readonly expiresAt: string;
};

export type ModelCallRequest = {
  readonly lease: ScopedCredentialLease;
  readonly modelId: string;
  readonly stageId: Exclude<StageId, "seed">;
  readonly task: ModelTask;
  readonly systemInstruction: string;
  readonly requestText: string;
  readonly maximumOutputTokens: number;
  readonly temperature: number | null;
  readonly timeoutMs: number;
};

export type ModelCallReceipt = {
  readonly providerId: string;
  readonly requestedModelId: string;
  readonly responseModelId: string;
  readonly latencyMs: number;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly tokenMeasurement: "ACTUAL_PROVIDER_REPORTED" | "ESTIMATED";
  readonly costUsd: number;
  readonly costMeasurement: "ACTUAL_PROVIDER_REPORTED" | "ESTIMATED";
  readonly pricingSource: {
    readonly id: string;
    readonly version: string;
    readonly effectiveAt: string | null;
  };
  readonly outputSha256: string;
  readonly outputCharacterCount: number;
};

export type CredentialCleanupResult = {
  readonly aliases: readonly string[];
  readonly attempted: number;
  readonly revoked: number;
  readonly failed: number;
};

export type ModelGateway = {
  readonly kind: ModelGatewayKind;
  fetchCatalog(): Promise<ModelCatalogSnapshot>;
  reconcileScopedCredential(request: ScopedCredentialRequest): Promise<ScopedCredentialLease>;
  callModel(request: ModelCallRequest): Promise<ModelCallReceipt>;
  revokeScopedCredential(lease: ScopedCredentialLease): Promise<void>;
  cleanupInterruptedRuns(runId?: string): Promise<CredentialCleanupResult>;
};

export class ModelGatewayRequestError extends Error {
  constructor(
    readonly operation: "CATALOG" | "VEND" | "INVOKE" | "REVOKE",
    readonly status: number | null,
    readonly retryable: boolean,
  ) {
    super(`Local model gateway ${operation.toLocaleLowerCase()} request failed.`);
    this.name = "ModelGatewayRequestError";
  }
}

function aliasPart(value: string): string {
  const normalized = value
    .toLocaleLowerCase()
    .replaceAll(/[^a-z0-9-]+/g, "-")
    .replaceAll(/^-+|-+$/g, "")
    .slice(0, 36);
  if (normalized.length === 0) throw new Error("Credential identity cannot be empty.");
  return normalized;
}

export function scopedCredentialAlias(request: ScopedCredentialRequest): string {
  const identity = `${request.projectId}--${request.agentId}--${request.runId}`;
  const digest = createHash("sha256").update(identity).digest("hex").slice(0, 12);
  return `${aliasPart(request.projectId)}--${aliasPart(request.agentId)}--${aliasPart(request.runId)}--${digest}`;
}

export function assertRunnableModelPolicy(
  policy: ModelPolicy,
  stageId: Exclude<StageId, "seed">,
  task: ModelTask,
  profile: ModelGatewayProfile,
): void {
  if (policy.status !== "APPROVED") throw new Error("Model policy is not approved.");
  if (!policy.allowedStages.includes(stageId)) throw new Error("Model policy denies this stage.");
  if (!policy.allowedTasks.includes(task)) throw new Error("Model policy denies this task.");
  if (!policy.allowedModelIds.includes(policy.preferredModelId)) {
    throw new Error("Preferred model is outside the model policy allow list.");
  }
  if (policy.fallbackOrder.some((modelId) => !policy.allowedModelIds.includes(modelId))) {
    throw new Error("Fallback model is outside the model policy allow list.");
  }
  if (profile === "live" && policy.executionMode !== "EXPLICIT_LOCAL_PROFILE") {
    throw new Error("Live profile requires an explicit local-profile model policy.");
  }
  if (profile === "offline" && policy.executionMode !== "OFFLINE_ONLY") {
    throw new Error("Offline profile requires an offline-only model policy.");
  }
}
