import { createHash } from "node:crypto";
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { registrySnapshot } from "../../src/demo/control-plane/registry/generated";
import { runSignalAwareCli } from "../../tools/lifecycle";
import type {
  SandboxAvailability,
  SandboxCommandReceipt,
  SandboxExecutionRequest,
  SandboxExecutionResult,
  SandboxProvider,
} from "../../tools/local-sandbox/contracts";
import { runSandboxSlice } from "../../tools/local-sandbox/runner";
import { sha256Bytes } from "../../tools/local-sandbox/security";
import type {
  CredentialCleanupResult,
  ModelCallReceipt,
  ModelCallRequest,
  ModelCatalogSnapshot,
  ModelGateway,
  ScopedCredentialLease,
  ScopedCredentialRequest,
} from "../../tools/model-gateway/contracts";
import { scopedCredentialAlias } from "../../tools/model-gateway/contracts";
import { runModelGateway } from "../../tools/model-gateway/runner";

type Stage =
  | "resource-setup"
  | "active-execution"
  | "evidence-finalization"
  | "cleanup"
  | "cleanup-timeout"
  | "cleanup-failure";

const projectRoot = resolve(import.meta.dirname, "../..");
const subsystemArgument = process.argv[2];
const stageArgument = process.argv[3];
const stateRootArgument = process.argv[4];
const runIdArgument = process.argv[5];
const stages: readonly Stage[] = [
  "resource-setup",
  "active-execution",
  "evidence-finalization",
  "cleanup",
  "cleanup-timeout",
  "cleanup-failure",
];

if (
  (subsystemArgument !== "sandbox" && subsystemArgument !== "gateway") ||
  !stageArgument ||
  !stages.includes(stageArgument as Stage) ||
  !stateRootArgument ||
  !runIdArgument
) {
  throw new Error("Expected subsystem, stage, state root, and run ID.");
}
const subsystem = subsystemArgument;
const stage = stageArgument as Stage;
const stateRoot = stateRootArgument;
const runId = runIdArgument;

await mkdir(stateRoot, { recursive: true });

process.on("message", (message: unknown) => {
  if (
    typeof message === "object" &&
    message !== null &&
    "signal" in message &&
    (message.signal === "SIGINT" || message.signal === "SIGTERM")
  ) {
    process.emit(message.signal);
  }
});

async function mark(name: string, value = "1"): Promise<void> {
  await writeFile(resolve(stateRoot, name), value, "utf8");
}

async function increment(name: string): Promise<void> {
  const path = resolve(stateRoot, name);
  const current = Number.parseInt(await readFile(path, "utf8").catch(() => "0"), 10);
  await writeFile(path, String(current + 1), "utf8");
}

async function waitForAbort(signal: AbortSignal): Promise<never> {
  signal.throwIfAborted();
  return new Promise<never>((_resolve, reject) => {
    signal.addEventListener(
      "abort",
      () => {
        const reason: unknown = signal.reason;
        reject(reason instanceof Error ? reason : new Error("Fixture was aborted."));
      },
      { once: true },
    );
  });
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, milliseconds));
}

class InterruptibleSandboxProvider implements SandboxProvider {
  readonly kind = "LOCAL_DOCKER" as const;

  inspect(signal?: AbortSignal): Promise<SandboxAvailability> {
    signal?.throwIfAborted();
    return Promise.resolve({
      provider: "LOCAL_DOCKER",
      available: true,
      dockerClientVersion: "fixture-client",
      dockerServerVersion: "fixture-server",
      image: "fixture:signal-safe",
      imageDigest: `sha256:${"a".repeat(64)}`,
      detail: "Child-process interruption fixture.",
    });
  }

  async prepare(signal?: AbortSignal): Promise<SandboxAvailability> {
    signal?.throwIfAborted();
    await mark("provider-resource");
    return this.inspect(signal);
  }

  execute(request: SandboxExecutionRequest): Promise<SandboxExecutionResult> {
    request.signal?.throwIfAborted();
    const commands = request.commands.map((command) => {
      const exitCode = command.id === "pre-test" ? 1 : 0;
      const stdout = command.id === "tool-versions" ? "v22.23.1" : "fixture command";
      return {
        id: command.id,
        argv: command.argv,
        containerName: `fixture-${request.runId}-${command.id}`,
        startedAt: "2026-07-21T12:00:00.000Z",
        durationMs: 1,
        exitCode,
        timedOut: false,
        stdout,
        stderr: "",
        stdoutSha256: sha256Bytes(stdout),
        stderrSha256: sha256Bytes(""),
        outputTruncated: false,
      } satisfies SandboxCommandReceipt;
    });
    return Promise.resolve({
      provider: "LOCAL_DOCKER",
      image: "fixture:signal-safe",
      imageDigest: `sha256:${"a".repeat(64)}`,
      networkMode: "none",
      user: "65532:65532",
      readOnlyRootFilesystem: true,
      noNewPrivileges: true,
      commands,
      cleanupAttempts: [],
    });
  }

  async cleanup(_ownedRunId: string, signal?: AbortSignal): Promise<readonly string[]> {
    await increment("cleanup-attempts");
    await mark("cleanup-started");
    if (stage === "cleanup") await delay(350);
    if (stage === "cleanup-timeout") {
      if (!signal) throw new Error("Cleanup timeout fixture requires a signal.");
      await waitForAbort(signal);
    }
    if (stage === "cleanup-failure") {
      await rm(resolve(stateRoot, "provider-resource"), { force: true });
      throw new Error("Synthetic provider cleanup failure.");
    }
    signal?.throwIfAborted();
    await rm(resolve(stateRoot, "provider-resource"), { force: true });
    return ["fixture-resource:removed"];
  }
}

class InterruptibleGateway implements ModelGateway {
  readonly kind = "LITELLM_LOCAL" as const;
  private readonly leasePath = resolve(stateRoot, "credential-lease");

  fetchCatalog(signal?: AbortSignal): Promise<ModelCatalogSnapshot> {
    signal?.throwIfAborted();
    const policy = livePolicy();
    return Promise.resolve({
      schemaVersion: 1,
      classification: "SANITIZED_LOCAL_GATEWAY_CATALOG",
      gatewayKind: this.kind,
      retrievedAt: "2026-07-21T12:00:00.000Z",
      entries: policy.allowedModelIds.map((modelId) => ({
        providerId: "fixture-provider",
        modelId,
        maximumInputTokens: 8192,
        maximumOutputTokens: 2048,
        inputCostPerTokenUsd: 0,
        outputCostPerTokenUsd: 0,
      })),
    });
  }

  async reconcileScopedCredential(
    request: ScopedCredentialRequest,
    signal?: AbortSignal,
  ): Promise<ScopedCredentialLease> {
    signal?.throwIfAborted();
    const lease: ScopedCredentialLease = {
      leaseId: "00000000-0000-4000-8000-000000000001",
      alias: scopedCredentialAlias(request),
      gatewayKind: this.kind,
      runId: request.runId,
      agentId: request.agentId,
      allowedModelIds: [...request.allowedModelIds],
      maximumCostUsd: request.maximumCostUsd,
      createdAt: "2026-07-21T12:00:00.000Z",
      expiresAt: "2026-07-21T12:15:00.000Z",
    };
    await writeFile(this.leasePath, lease.alias, "utf8");
    if (signal?.aborted) {
      await rm(this.leasePath, { force: true });
      signal.throwIfAborted();
    }
    return lease;
  }

  async callModel(request: ModelCallRequest): Promise<ModelCallReceipt> {
    request.signal?.throwIfAborted();
    if (
      !(await access(this.leasePath)
        .then(() => true)
        .catch(() => false))
    ) {
      throw new Error("Fixture credential lease is inactive.");
    }
    const output = `fixture:${request.modelId}`;
    return {
      providerId: "fixture-provider",
      requestedModelId: request.modelId,
      responseModelId: request.modelId,
      latencyMs: 1,
      inputTokens: 1,
      outputTokens: 1,
      tokenMeasurement: "ACTUAL_PROVIDER_REPORTED",
      costUsd: 0,
      costMeasurement: "ACTUAL_PROVIDER_REPORTED",
      pricingSource: { id: "fixture", version: "1", effectiveAt: null },
      outputSha256: createHash("sha256").update(output).digest("hex"),
      outputCharacterCount: output.length,
    };
  }

  async revokeScopedCredential(): Promise<void> {
    if (
      await access(this.leasePath)
        .then(() => true)
        .catch(() => false)
    ) {
      await increment("effective-revocations");
      await rm(this.leasePath, { force: true });
    }
  }

  async cleanupInterruptedRuns(
    _ownedRunId?: string,
    signal?: AbortSignal,
  ): Promise<CredentialCleanupResult> {
    await increment("cleanup-attempts");
    await mark("cleanup-started");
    if (stage === "cleanup") await delay(350);
    if (stage === "cleanup-timeout") {
      if (!signal) throw new Error("Cleanup timeout fixture requires a signal.");
      await waitForAbort(signal);
    }
    if (stage === "cleanup-failure") {
      return { aliases: [], attempted: 1, revoked: 0, failed: 1 };
    }
    signal?.throwIfAborted();
    const active = await access(this.leasePath)
      .then(() => true)
      .catch(() => false);
    if (active) {
      await increment("effective-revocations");
      await rm(this.leasePath, { force: true });
    }
    return {
      aliases: active ? ["fixture-owned-alias"] : [],
      attempted: active ? 1 : 0,
      revoked: active ? 1 : 0,
      failed: 0,
    };
  }
}

function livePolicy() {
  const policy = registrySnapshot.modelPolicies.find(
    (candidate) => candidate.id === "model.policy.local-gateway-opt-in",
  );
  if (!policy) throw new Error("Missing live model policy fixture.");
  return policy;
}

function implementationAgent() {
  const agent = registrySnapshot.agents.find(
    (candidate) => candidate.id === "agent.implementation",
  );
  if (!agent) throw new Error("Missing implementation agent fixture.");
  return agent;
}

const exitCode = await runSignalAwareCli(
  async (lifecycle) => {
    const onLifecycleStage = async (
      current: Exclude<Stage, "cleanup" | "cleanup-timeout" | "cleanup-failure">,
    ) => {
      await mark(`${current}-started`);
      if (stage === current) await waitForAbort(lifecycle.signal);
    };
    if (subsystem === "sandbox") {
      await runSandboxSlice({
        projectRoot,
        provider: new InterruptibleSandboxProvider(),
        fixedRun: { id: runId, createdAt: "2026-07-21T12:00:00.000Z" },
        writeEvidence: false,
        lifecycle,
        onLifecycleStage,
      });
      return;
    }
    await runModelGateway({
      gateway: new InterruptibleGateway(),
      profile: "live",
      policy: livePolicy(),
      agent: implementationAgent(),
      runId,
      sourceCommit: "b".repeat(40),
      generatedAt: "2026-07-21T12:00:00.000Z",
      lifecycle,
      onLifecycleStage,
    });
  },
  { cleanupTimeoutMs: 1_000 },
);

process.exitCode = exitCode;
if (process.connected) process.disconnect();
