import { createHash, randomUUID } from "node:crypto";

import type {
  CredentialCleanupResult,
  ModelCallReceipt,
  ModelCallRequest,
  ModelCatalogSnapshot,
  ModelGateway,
  ScopedCredentialLease,
  ScopedCredentialRequest,
} from "./contracts";
import { scopedCredentialAlias } from "./contracts";

const OFFLINE_RETRIEVED_AT = "2026-07-17T21:00:00.000Z";

export class OfflineModelGateway implements ModelGateway {
  readonly kind = "OFFLINE_MOCK" as const;
  private readonly leases = new Map<string, ScopedCredentialLease>();

  async fetchCatalog(signal?: AbortSignal): Promise<ModelCatalogSnapshot> {
    signal?.throwIfAborted();
    return Promise.resolve({
      schemaVersion: 1,
      classification: "SANITIZED_LOCAL_GATEWAY_CATALOG",
      gatewayKind: this.kind,
      retrievedAt: OFFLINE_RETRIEVED_AT,
      entries: [
        {
          providerId: "offline-mock",
          modelId: "offline/delivery-balanced",
          maximumInputTokens: 8000,
          maximumOutputTokens: 4000,
          inputCostPerTokenUsd: 0,
          outputCostPerTokenUsd: 0,
        },
        {
          providerId: "offline-mock",
          modelId: "offline/delivery-low",
          maximumInputTokens: 8000,
          maximumOutputTokens: 2000,
          inputCostPerTokenUsd: 0,
          outputCostPerTokenUsd: 0,
        },
      ],
    });
  }

  async reconcileScopedCredential(
    request: ScopedCredentialRequest,
    signal?: AbortSignal,
  ): Promise<ScopedCredentialLease> {
    signal?.throwIfAborted();
    const alias = scopedCredentialAlias(request);
    for (const [leaseId, lease] of this.leases) {
      if (lease.alias === alias) this.leases.delete(leaseId);
    }
    const createdAt = new Date().toISOString();
    const lease: ScopedCredentialLease = {
      leaseId: randomUUID(),
      alias,
      gatewayKind: this.kind,
      runId: request.runId,
      agentId: request.agentId,
      allowedModelIds: [...request.allowedModelIds],
      maximumCostUsd: request.maximumCostUsd,
      createdAt,
      expiresAt: new Date(Date.parse(createdAt) + request.durationSeconds * 1000).toISOString(),
    };
    this.leases.set(lease.leaseId, lease);
    if (signal?.aborted) {
      this.leases.delete(lease.leaseId);
      signal.throwIfAborted();
    }
    return Promise.resolve(lease);
  }

  async callModel(request: ModelCallRequest): Promise<ModelCallReceipt> {
    request.signal?.throwIfAborted();
    if (!this.leases.has(request.lease.leaseId)) throw new Error("Credential lease is inactive.");
    if (!request.lease.allowedModelIds.includes(request.modelId)) {
      throw new Error("Credential lease denies the requested model.");
    }
    const output = `offline deterministic receipt:${request.stageId}:${request.task}:${request.modelId}`;
    return Promise.resolve({
      providerId: "offline-mock",
      requestedModelId: request.modelId,
      responseModelId: request.modelId,
      latencyMs: 0,
      inputTokens: 0,
      outputTokens: 0,
      tokenMeasurement: "ESTIMATED",
      costUsd: 0,
      costMeasurement: "ESTIMATED",
      pricingSource: { id: "offline-zero-cost-fixture", version: "1", effectiveAt: null },
      outputSha256: createHash("sha256").update(output).digest("hex"),
      outputCharacterCount: output.length,
    });
  }

  async revokeScopedCredential(lease: ScopedCredentialLease, signal?: AbortSignal): Promise<void> {
    signal?.throwIfAborted();
    this.leases.delete(lease.leaseId);
    return Promise.resolve();
  }

  async cleanupInterruptedRuns(
    runId?: string,
    signal?: AbortSignal,
  ): Promise<CredentialCleanupResult> {
    signal?.throwIfAborted();
    const matching = [...this.leases.values()].filter((lease) => !runId || lease.runId === runId);
    for (const lease of matching) this.leases.delete(lease.leaseId);
    return Promise.resolve({
      aliases: matching.map((lease) => lease.alias).sort(),
      attempted: matching.length,
      revoked: matching.length,
      failed: 0,
    });
  }
}
