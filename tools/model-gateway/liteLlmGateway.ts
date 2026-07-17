import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { z } from "zod";

import {
  modelCatalogSnapshotSchema,
  ModelGatewayRequestError,
  scopedCredentialAlias,
  type CredentialCleanupResult,
  type ModelCallReceipt,
  type ModelCallRequest,
  type ModelCatalogEntry,
  type ModelCatalogSnapshot,
  type ModelGateway,
  type ScopedCredentialLease,
  type ScopedCredentialRequest,
} from "./contracts";

const leaseStateSchema = z.object({
  schemaVersion: z.literal(1),
  lease: z.object({
    leaseId: z.uuid(),
    alias: z.string().min(1),
    gatewayKind: z.literal("LITELLM_LOCAL"),
    runId: z.string().min(1),
    agentId: z.string().min(1),
    allowedModelIds: z.array(z.string().min(1)).min(1),
    maximumCostUsd: z.number().nonnegative(),
    createdAt: z.iso.datetime(),
    expiresAt: z.iso.datetime(),
  }),
  rawKey: z.string().min(1),
});

type LeaseState = z.infer<typeof leaseStateSchema>;

export type LiteLlmGatewayOptions = {
  readonly baseUrl: string;
  readonly masterKey: string;
  readonly stateRoot: string;
  readonly fetchImplementation?: typeof fetch;
  readonly now?: () => Date;
};

function localGatewayUrl(value: string): string {
  const url = new URL(value);
  const isLoopback = ["localhost", "127.0.0.1", "[::1]", "::1"].includes(url.hostname);
  if (url.protocol !== "http:" || !isLoopback || url.username || url.password) {
    throw new Error("The LiteLLM profile accepts only an unauthenticated loopback HTTP URL.");
  }
  return url.toString().replace(/\/$/, "");
}

function object(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function string(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function positiveInteger(value: unknown): number | null {
  const parsed = number(value);
  return parsed !== null && Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function catalogEntry(value: unknown): ModelCatalogEntry | null {
  const root = object(value);
  if (!root) return null;
  const modelInfo = object(root.model_info) ?? {};
  const params = object(root.litellm_params) ?? {};
  const modelId = string(root.model_name) ?? string(root.id);
  if (!modelId) return null;
  const routedModel = string(params.model);
  const providerId =
    string(modelInfo.litellm_provider) ??
    string(params.custom_llm_provider) ??
    routedModel?.split("/")[0] ??
    "gateway-routed";
  return {
    providerId,
    modelId,
    maximumInputTokens:
      positiveInteger(modelInfo.max_input_tokens) ?? positiveInteger(modelInfo.max_tokens),
    maximumOutputTokens: positiveInteger(modelInfo.max_output_tokens),
    inputCostPerTokenUsd: number(modelInfo.input_cost_per_token),
    outputCostPerTokenUsd: number(modelInfo.output_cost_per_token),
  };
}

export class LiteLlmModelGateway implements ModelGateway {
  readonly kind = "LITELLM_LOCAL" as const;
  private readonly baseUrl: string;
  private readonly masterKey: string;
  private readonly stateRoot: string;
  private readonly fetchImplementation: typeof fetch;
  private readonly now: () => Date;
  private lastCatalog: ModelCatalogSnapshot | null = null;

  constructor(options: LiteLlmGatewayOptions) {
    if (options.masterKey.length < 16)
      throw new Error("LITELLM_MASTER_KEY is missing or too short.");
    this.baseUrl = localGatewayUrl(options.baseUrl);
    this.masterKey = options.masterKey;
    this.stateRoot = resolve(options.stateRoot);
    this.fetchImplementation = options.fetchImplementation ?? fetch;
    this.now = options.now ?? (() => new Date());
  }

  static fromEnvironment(root: string): LiteLlmModelGateway {
    const masterKey = process.env.LITELLM_MASTER_KEY;
    if (!masterKey)
      throw new Error("LITELLM_MASTER_KEY is required for the explicit live profile.");
    return new LiteLlmModelGateway({
      baseUrl: process.env.MODEL_GATEWAY_BASE_URL ?? "http://127.0.0.1:4000",
      masterKey,
      stateRoot: resolve(root, ".workbench/model-gateway/leases"),
    });
  }

  private statePath(alias: string): string {
    if (!/^[a-z0-9-]+$/.test(alias)) throw new Error("Unsafe credential alias.");
    return resolve(this.stateRoot, `${alias}.json`);
  }

  private async stateForAlias(alias: string): Promise<LeaseState | null> {
    const value = await readFile(this.statePath(alias), "utf8").catch(() => null);
    if (!value) return null;
    return leaseStateSchema.parse(JSON.parse(value) as unknown);
  }

  private async writeState(state: LeaseState): Promise<void> {
    await mkdir(this.stateRoot, { recursive: true });
    await writeFile(this.statePath(state.lease.alias), `${JSON.stringify(state)}\n`, {
      encoding: "utf8",
      mode: 0o600,
    });
  }

  private async request(
    operation: ModelGatewayRequestError["operation"],
    path: string,
    authorization: string,
    init: Omit<RequestInit, "headers" | "signal">,
    timeoutMs = 15_000,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await this.fetchImplementation(`${this.baseUrl}${path}`, {
        ...init,
        headers: {
          authorization: `Bearer ${authorization}`,
          "content-type": "application/json",
        },
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new ModelGatewayRequestError(
          operation,
          response.status,
          response.status === 408 || response.status === 429 || response.status >= 500,
        );
      }
      return response;
    } catch (error) {
      if (error instanceof ModelGatewayRequestError) throw error;
      throw new ModelGatewayRequestError(operation, null, true);
    } finally {
      clearTimeout(timer);
    }
  }

  async fetchCatalog(): Promise<ModelCatalogSnapshot> {
    const response = await this.request("CATALOG", "/v1/model/info", this.masterKey, {
      method: "GET",
    });
    const body = object((await response.json()) as unknown);
    const rawEntries = Array.isArray(body?.data) ? body.data : [];
    const entries = rawEntries
      .map(catalogEntry)
      .filter((entry): entry is ModelCatalogEntry => entry !== null)
      .sort((left, right) => left.modelId.localeCompare(right.modelId));
    const catalog = modelCatalogSnapshotSchema.parse({
      schemaVersion: 1,
      classification: "SANITIZED_LOCAL_GATEWAY_CATALOG",
      gatewayKind: this.kind,
      retrievedAt: this.now().toISOString(),
      entries,
    });
    this.lastCatalog = catalog;
    return catalog;
  }

  private async blockRawKey(rawKey: string): Promise<void> {
    await this.request("REVOKE", "/key/block", this.masterKey, {
      method: "POST",
      body: JSON.stringify({ key: rawKey }),
    });
  }

  async reconcileScopedCredential(
    request: ScopedCredentialRequest,
  ): Promise<ScopedCredentialLease> {
    const alias = scopedCredentialAlias(request);
    const existing = await this.stateForAlias(alias);
    if (existing) {
      await this.blockRawKey(existing.rawKey);
      await rm(this.statePath(alias), { force: true });
    }
    const response = await this.request("VEND", "/key/generate", this.masterKey, {
      method: "POST",
      body: JSON.stringify({
        key_alias: alias,
        models: request.allowedModelIds,
        max_budget: request.maximumCostUsd,
        duration: `${request.durationSeconds}s`,
        metadata: {
          project_id: request.projectId,
          agent_id: request.agentId,
          run_id: request.runId,
        },
      }),
    });
    const body = object((await response.json()) as unknown);
    const rawKey = string(body?.key);
    if (!rawKey) throw new ModelGatewayRequestError("VEND", response.status, false);
    const createdAt = this.now();
    const lease: ScopedCredentialLease = {
      leaseId: randomUUID(),
      alias,
      gatewayKind: this.kind,
      runId: request.runId,
      agentId: request.agentId,
      allowedModelIds: [...request.allowedModelIds],
      maximumCostUsd: request.maximumCostUsd,
      createdAt: createdAt.toISOString(),
      expiresAt: new Date(createdAt.getTime() + request.durationSeconds * 1000).toISOString(),
    };
    try {
      await this.writeState({
        schemaVersion: 1,
        lease: {
          ...lease,
          gatewayKind: "LITELLM_LOCAL",
          allowedModelIds: [...lease.allowedModelIds],
        },
        rawKey,
      });
    } catch (error) {
      await this.blockRawKey(rawKey);
      throw error;
    }
    return lease;
  }

  async callModel(request: ModelCallRequest): Promise<ModelCallReceipt> {
    if (!request.lease.allowedModelIds.includes(request.modelId)) {
      throw new Error("Credential lease denies the requested model.");
    }
    const state = await this.stateForAlias(request.lease.alias);
    if (!state || state.lease.leaseId !== request.lease.leaseId) {
      throw new Error("Credential lease is inactive.");
    }
    const startedAt = performance.now();
    const response = await this.request(
      "INVOKE",
      "/v1/chat/completions",
      state.rawKey,
      {
        method: "POST",
        body: JSON.stringify({
          model: request.modelId,
          messages: [
            { role: "system", content: request.systemInstruction },
            { role: "user", content: request.requestText },
          ],
          max_tokens: request.maximumOutputTokens,
          ...(request.temperature === null ? {} : { temperature: request.temperature }),
        }),
      },
      request.timeoutMs,
    );
    const latencyMs = Math.max(0, Math.round(performance.now() - startedAt));
    const body = object((await response.json()) as unknown);
    const choices = Array.isArray(body?.choices) ? body.choices : [];
    const firstChoice = object(choices[0]);
    const message = object(firstChoice?.message);
    const output = string(message?.content) ?? "";
    const usage = object(body?.usage);
    const inputTokens = positiveInteger(usage?.prompt_tokens);
    const outputTokens = positiveInteger(usage?.completion_tokens);
    const catalogEntry = this.lastCatalog?.entries.find(
      (entry) => entry.modelId === request.modelId,
    );
    const estimatedInput = Math.max(1, Math.ceil(request.requestText.length / 4));
    const estimatedOutput = Math.ceil(output.length / 4);
    const recordedInput = inputTokens ?? estimatedInput;
    const recordedOutput = outputTokens ?? estimatedOutput;
    const providerCostHeader = Number(response.headers.get("x-litellm-response-cost"));
    const providerCost =
      Number.isFinite(providerCostHeader) && providerCostHeader >= 0 ? providerCostHeader : null;
    const estimatedCost =
      recordedInput * (catalogEntry?.inputCostPerTokenUsd ?? 0) +
      recordedOutput * (catalogEntry?.outputCostPerTokenUsd ?? 0);
    return {
      providerId: catalogEntry?.providerId ?? "gateway-routed",
      requestedModelId: request.modelId,
      responseModelId: string(body?.model) ?? request.modelId,
      latencyMs,
      inputTokens: recordedInput,
      outputTokens: recordedOutput,
      tokenMeasurement:
        inputTokens !== null && outputTokens !== null ? "ACTUAL_PROVIDER_REPORTED" : "ESTIMATED",
      costUsd: providerCost ?? Number(estimatedCost.toFixed(8)),
      costMeasurement: providerCost === null ? "ESTIMATED" : "ACTUAL_PROVIDER_REPORTED",
      pricingSource: {
        id: providerCost === null ? "litellm-sanitized-model-catalog" : "litellm-response-header",
        version: "v1.92.0",
        effectiveAt: this.lastCatalog?.retrievedAt ?? null,
      },
      outputSha256: createHash("sha256").update(output).digest("hex"),
      outputCharacterCount: output.length,
    };
  }

  async revokeScopedCredential(lease: ScopedCredentialLease): Promise<void> {
    const state = await this.stateForAlias(lease.alias);
    if (!state || state.lease.leaseId !== lease.leaseId) return;
    await this.blockRawKey(state.rawKey);
    await rm(this.statePath(lease.alias), { force: true });
  }

  async cleanupInterruptedRuns(runId?: string): Promise<CredentialCleanupResult> {
    const names = await readdir(this.stateRoot).catch(() => []);
    const candidates = await Promise.all(
      names
        .filter((name) => name.endsWith(".json"))
        .map(async (name) => {
          const raw = await readFile(resolve(this.stateRoot, name), "utf8").catch(() => null);
          if (!raw) return { name, state: null };
          try {
            const parsed = leaseStateSchema.safeParse(JSON.parse(raw) as unknown);
            return { name, state: parsed.success ? parsed.data : null };
          } catch {
            return { name, state: null };
          }
        }),
    );
    const invalidNames = candidates
      .filter((candidate) => candidate.state === null)
      .map((candidate) => `invalid:${candidate.name.replace(/\.json$/, "")}`);
    const states = candidates
      .map((candidate) => candidate.state)
      .filter(
        (state): state is LeaseState => state !== null && (!runId || state.lease.runId === runId),
      );
    let revoked = 0;
    for (const state of states) {
      try {
        await this.blockRawKey(state.rawKey);
        await rm(this.statePath(state.lease.alias), { force: true });
        revoked += 1;
      } catch {
        // Retain failed lease files so a later cleanup can retry without exposing the key.
      }
    }
    return {
      aliases: [...states.map((state) => state.lease.alias), ...invalidNames].sort(),
      attempted: states.length + invalidNames.length,
      revoked,
      failed: states.length - revoked + invalidNames.length,
    };
  }
}
