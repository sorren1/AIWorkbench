import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type { ModelPolicy } from "../src/demo/control-plane/registry/contracts";
import { registrySnapshot } from "../src/demo/control-plane/registry/generated";
import { BudgetStopError } from "../tools/local-sandbox/budgets";
import {
  ModelGatewayRequestError,
  scopedCredentialAlias,
  type CredentialCleanupResult,
  type ModelCallReceipt,
  type ModelCallRequest,
  type ModelCatalogSnapshot,
  type ModelGateway,
  type ScopedCredentialLease,
  type ScopedCredentialRequest,
} from "../tools/model-gateway/contracts";
import { LiteLlmModelGateway } from "../tools/model-gateway/liteLlmGateway";
import { OfflineModelGateway } from "../tools/model-gateway/offlineGateway";
import { runModelGateway } from "../tools/model-gateway/runner";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true })));
});

function policy(id: string): ModelPolicy {
  const result = registrySnapshot.modelPolicies.find((candidate) => candidate.id === id);
  if (!result) throw new Error(`Missing test policy: ${id}`);
  return result;
}

function agent() {
  const result = registrySnapshot.agents.find(
    (candidate) => candidate.id === "agent.implementation",
  );
  if (!result) throw new Error("Missing implementation agent.");
  return result;
}

const LIVE_POLICY = policy("model.policy.local-gateway-opt-in");

function catalog(kind: "OFFLINE_MOCK" | "LITELLM_LOCAL" = "LITELLM_LOCAL"): ModelCatalogSnapshot {
  return {
    schemaVersion: 1,
    classification: "SANITIZED_LOCAL_GATEWAY_CATALOG",
    gatewayKind: kind,
    retrievedAt: "2026-07-17T21:00:00.000Z",
    entries: LIVE_POLICY.allowedModelIds.map((modelId) => ({
      providerId: "synthetic-test-provider",
      modelId,
      maximumInputTokens: 8192,
      maximumOutputTokens: 2048,
      inputCostPerTokenUsd: 0.000001,
      outputCostPerTokenUsd: 0.000002,
    })),
  };
}

function receipt(modelId: string, costUsd = 0.001): ModelCallReceipt {
  return {
    providerId: "synthetic-test-provider",
    requestedModelId: modelId,
    responseModelId: modelId,
    latencyMs: 12,
    inputTokens: 24,
    outputTokens: 8,
    tokenMeasurement: "ACTUAL_PROVIDER_REPORTED",
    costUsd,
    costMeasurement: "ACTUAL_PROVIDER_REPORTED",
    pricingSource: { id: "synthetic-test-receipt", version: "1", effectiveAt: null },
    outputSha256: "a".repeat(64),
    outputCharacterCount: 20,
  };
}

class FakeGateway implements ModelGateway {
  readonly kind = "LITELLM_LOCAL" as const;
  calls = 0;
  revoked = false;
  failPreferred = false;
  costUsd = 0.001;

  fetchCatalog(): Promise<ModelCatalogSnapshot> {
    return Promise.resolve(catalog());
  }

  reconcileScopedCredential(request: ScopedCredentialRequest): Promise<ScopedCredentialLease> {
    return Promise.resolve({
      leaseId: "fixture-lease",
      alias: scopedCredentialAlias(request),
      gatewayKind: this.kind,
      runId: request.runId,
      agentId: request.agentId,
      allowedModelIds: [...request.allowedModelIds],
      maximumCostUsd: request.maximumCostUsd,
      createdAt: "2026-07-17T21:00:00.000Z",
      expiresAt: "2026-07-17T21:15:00.000Z",
    });
  }

  callModel(request: ModelCallRequest): Promise<ModelCallReceipt> {
    this.calls += 1;
    if (this.failPreferred && this.calls === 1) {
      return Promise.reject(new ModelGatewayRequestError("INVOKE", 503, true));
    }
    return Promise.resolve(receipt(request.modelId, this.costUsd));
  }

  revokeScopedCredential(): Promise<void> {
    this.revoked = true;
    return Promise.resolve();
  }

  cleanupInterruptedRuns(): Promise<CredentialCleanupResult> {
    return Promise.resolve({ aliases: [], attempted: 0, revoked: 0, failed: 0 });
  }
}

describe("provider-neutral model gateway contract", () => {
  it("creates deterministic non-personal aliases and reconciles offline leases idempotently", async () => {
    const gateway = new OfflineModelGateway();
    const request: ScopedCredentialRequest = {
      projectId: "ai-delivery-workbench",
      agentId: "agent.implementation",
      runId: "run.synthetic-001",
      allowedModelIds: ["offline/delivery-balanced"],
      maximumCostUsd: 0,
      durationSeconds: 60,
    };
    const first = await gateway.reconcileScopedCredential(request);
    const second = await gateway.reconcileScopedCredential(request);
    expect(first.alias).toBe(second.alias);
    expect(first.leaseId).not.toBe(second.leaseId);
    await expect(
      gateway.callModel({
        lease: first,
        modelId: "offline/delivery-balanced",
        stageId: "implement",
        task: "CODE_CHANGE",
        systemInstruction: "synthetic",
        requestText: "synthetic",
        maximumOutputTokens: 20,
        temperature: 0,
        timeoutMs: 100,
      }),
    ).rejects.toThrow("inactive");
    await expect(
      gateway.callModel({
        lease: second,
        modelId: "offline/not-allowed",
        stageId: "implement",
        task: "CODE_CHANGE",
        systemInstruction: "synthetic",
        requestText: "synthetic",
        maximumOutputTokens: 20,
        temperature: 0,
        timeoutMs: 100,
      }),
    ).rejects.toThrow("denies");
    expect(await gateway.cleanupInterruptedRuns(request.runId)).toMatchObject({
      attempted: 1,
      revoked: 1,
      failed: 0,
    });
  });

  it("uses only the declared fallback and records model-call span hierarchy", async () => {
    const gateway = new FakeGateway();
    gateway.failPreferred = true;
    const result = await runModelGateway({
      gateway,
      profile: "live",
      policy: LIVE_POLICY,
      agent: agent(),
      runId: "run-fallback-fixture",
      sourceCommit: "b".repeat(40),
      generatedAt: "2026-07-17T21:00:00.000Z",
    });
    expect(result.calls[0]?.requestedModelId).toBe(LIVE_POLICY.fallbackOrder[0]);
    expect(gateway.calls).toBe(2);
    expect(gateway.revoked).toBe(true);
    expect(result.evidence?.policy.independentReview).toEqual({
      required: false,
      exercised: false,
    });
    const spans = result.trace.artifact.spans;
    expect(spans.map((span) => span.name)).toEqual([
      "delivery.run",
      "delivery.stage",
      "agent.invoke",
      "model.call",
      "model.call",
      "evidence.finalize",
    ]);
    expect(spans.filter((span) => span.name === "model.call").map((span) => span.status)).toEqual([
      "ERROR",
      "OK",
    ]);
    expect(JSON.stringify(result)).not.toContain("systemInstruction");
    expect(JSON.stringify(result)).not.toContain("Synthetic issue TOY-101 changes");
  });

  it("stops over-budget model use and still revokes the scoped credential", async () => {
    const gateway = new FakeGateway();
    gateway.costUsd = 0.25;
    const lowBudgetPolicy: ModelPolicy = { ...LIVE_POLICY, maximumCostUsd: 0.01 };
    await expect(
      runModelGateway({
        gateway,
        profile: "live",
        policy: lowBudgetPolicy,
        agent: agent(),
        runId: "run-budget-fixture",
        sourceCommit: "b".repeat(40),
      }),
    ).rejects.toBeInstanceOf(BudgetStopError);
    expect(gateway.revoked).toBe(true);
  });
});

describe("LiteLLM local adapter", () => {
  it("reconciles, invokes, and revokes virtual keys without leaking key values", async () => {
    const stateRoot = await mkdtemp(resolve(tmpdir(), "workbench-gateway-"));
    temporaryDirectories.push(stateRoot);
    const scopedKeys = [
      "sk-scoped-sentinel-one",
      "sk-scoped-sentinel-two",
      "sk-scoped-sentinel-three",
    ];
    const blocked: string[] = [];
    let generated = 0;
    const fakeFetch: typeof fetch = (input, init) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (url.endsWith("/v1/model/info")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              data: LIVE_POLICY.allowedModelIds.map((modelId) => ({
                model_name: modelId,
                litellm_params: { model: `synthetic/${modelId}` },
                model_info: {
                  litellm_provider: "synthetic-provider",
                  max_input_tokens: 8192,
                  max_output_tokens: 2048,
                  input_cost_per_token: 0.000001,
                  output_cost_per_token: 0.000002,
                },
              })),
            }),
            { status: 200, headers: { "content-type": "application/json" } },
          ),
        );
      }
      if (url.endsWith("/key/generate")) {
        const key = scopedKeys[generated];
        generated += 1;
        return Promise.resolve(new Response(JSON.stringify({ key }), { status: 200 }));
      }
      if (url.endsWith("/key/block")) {
        const bodyText = typeof init?.body === "string" ? init.body : "{}";
        const body = JSON.parse(bodyText) as { key: string };
        blocked.push(body.key);
        return Promise.resolve(new Response(JSON.stringify({ blocked: true }), { status: 200 }));
      }
      if (url.endsWith("/v1/chat/completions")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              model: "delivery-primary",
              choices: [{ message: { content: "LOW_RISK_SYNTHETIC" } }],
              usage: { prompt_tokens: 20, completion_tokens: 5 },
            }),
            {
              status: 200,
              headers: { "x-litellm-response-cost": "0.0005" },
            },
          ),
        );
      }
      return Promise.resolve(new Response(null, { status: 404 }));
    };
    const gateway = new LiteLlmModelGateway({
      baseUrl: "http://127.0.0.1:4000",
      masterKey: "sk-master-sentinel-never-emit",
      stateRoot,
      fetchImplementation: fakeFetch,
      now: () => new Date("2026-07-17T21:00:00.000Z"),
    });
    const request: ScopedCredentialRequest = {
      projectId: "ai-delivery-workbench",
      agentId: "agent.implementation",
      runId: "run-litellm-fixture",
      allowedModelIds: LIVE_POLICY.allowedModelIds,
      maximumCostUsd: LIVE_POLICY.maximumCostUsd,
      durationSeconds: 900,
    };
    const first = await gateway.reconcileScopedCredential(request);
    await gateway.reconcileScopedCredential(request);
    expect(blocked).toContain(scopedKeys[0]);
    const statePath = resolve(stateRoot, `${first.alias}.json`);
    expect(await readFile(statePath, "utf8")).toContain(scopedKeys[1]);

    const result = await runModelGateway({
      gateway,
      profile: "live",
      policy: LIVE_POLICY,
      agent: agent(),
      runId: "run-integrated-fixture",
      sourceCommit: "b".repeat(40),
      generatedAt: "2026-07-17T21:00:00.000Z",
    });
    const serialized = JSON.stringify(result);
    expect(result.evidence?.gateway.credentialRevoked).toBe(true);
    expect(serialized).not.toContain("sk-master-sentinel");
    expect(serialized).not.toContain("sk-scoped-sentinel");
    expect(serialized).not.toContain("LOW_RISK_SYNTHETIC");
    expect(await gateway.cleanupInterruptedRuns()).toMatchObject({
      attempted: 1,
      revoked: 1,
      failed: 0,
    });
    expect(blocked).toContain(scopedKeys[1]);
    expect(blocked).toContain(scopedKeys[2]);
  });

  it("rejects a non-loopback gateway before a master key can be transmitted", () => {
    expect(
      () =>
        new LiteLlmModelGateway({
          baseUrl: "https://gateway.example.invalid",
          masterKey: "sk-master-sentinel-never-emit",
          stateRoot: ".workbench/test",
        }),
    ).toThrow("loopback");
  });

  it("reports malformed recovery state instead of silently claiming cleanup", async () => {
    const stateRoot = await mkdtemp(resolve(tmpdir(), "workbench-gateway-corrupt-"));
    temporaryDirectories.push(stateRoot);
    await writeFile(resolve(stateRoot, "corrupt.json"), "{not-json", "utf8");
    const gateway = new LiteLlmModelGateway({
      baseUrl: "http://127.0.0.1:4000",
      masterKey: "sk-master-sentinel-never-emit",
      stateRoot,
      fetchImplementation: () => Promise.resolve(new Response(null, { status: 500 })),
    });
    await expect(gateway.cleanupInterruptedRuns()).resolves.toEqual({
      aliases: ["invalid:corrupt"],
      attempted: 1,
      revoked: 0,
      failed: 1,
    });
  });
});
