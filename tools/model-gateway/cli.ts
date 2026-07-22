import { execFile } from "node:child_process";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";

import { registrySnapshot } from "../../src/demo/control-plane/registry/generated";
import { runSignalAwareCli, type CleanupLifecycle } from "../lifecycle";
import { MODEL_GATEWAY_IMPLEMENTATION_LABEL, type ModelGatewayProfile } from "./contracts";
import { validateGatewayEvidenceFile, writeGatewayEvidence } from "./evidence";
import { LiteLlmModelGateway } from "./liteLlmGateway";
import { OfflineModelGateway } from "./offlineGateway";
import { runModelGateway } from "./runner";

const executeFile = promisify(execFile);
const root = resolve(import.meta.dirname, "../..");

function option(name: string): string | null {
  const index = process.argv.indexOf(name);
  return index >= 0 ? (process.argv[index + 1] ?? null) : null;
}

function profile(): ModelGatewayProfile {
  const value = option("--profile") ?? "offline";
  if (value !== "offline" && value !== "live")
    throw new Error("--profile must be offline or live.");
  return value;
}

async function sourceCommit(signal: AbortSignal): Promise<string> {
  const result = await executeFile(
    "git",
    ["-c", `safe.directory=${root.replaceAll("\\", "/")}`, "rev-parse", "HEAD"],
    { cwd: root, windowsHide: true, signal },
  );
  const value = result.stdout.trim();
  if (!/^[a-f0-9]{40}$/.test(value)) throw new Error("Unable to resolve the source commit.");
  return value;
}

function newRunId(): string {
  const stamp = new Date().toISOString().replaceAll(/[-:.]/g, "").toLocaleLowerCase();
  return `gateway-${stamp}`;
}

async function run(lifecycle: CleanupLifecycle): Promise<void> {
  const selectedProfile = profile();
  const policyId =
    selectedProfile === "live"
      ? "model.policy.local-gateway-opt-in"
      : "model.policy.delivery-balanced";
  const policy = registrySnapshot.modelPolicies.find((candidate) => candidate.id === policyId);
  const agent = registrySnapshot.agents.find(
    (candidate) => candidate.id === "agent.implementation",
  );
  if (!policy || !agent) throw new Error("Checked-in gateway policy or agent card is missing.");
  const gateway =
    selectedProfile === "live"
      ? LiteLlmModelGateway.fromEnvironment(root)
      : new OfflineModelGateway();
  const runId = option("--run-id") ?? newRunId();
  const result = await runModelGateway({
    gateway,
    profile: selectedProfile,
    policy,
    agent,
    runId,
    sourceCommit: await sourceCommit(lifecycle.signal),
    lifecycle,
  });
  let paths: { readonly evidencePath: string; readonly tracePath: string } | null = null;
  if (result.evidence) {
    lifecycle.throwIfAborted();
    paths = await writeGatewayEvidence({
      root,
      evidence: result.evidence,
      trace: result.trace.artifact,
    });
    lifecycle.throwIfAborted();
  }
  process.stdout.write(
    `${JSON.stringify(
      {
        profile: selectedProfile,
        gateway: gateway.kind,
        status:
          selectedProfile === "live"
            ? "validated local gateway integration"
            : MODEL_GATEWAY_IMPLEMENTATION_LABEL,
        runId,
        credentialAlias: result.credentialAlias,
        credentialRevoked: result.credentialRevoked,
        modelCalls: result.calls.length,
        independentReview:
          result.independentReview === "EXERCISED"
            ? "exercised"
            : "configured or not required; not exercised",
        budgetOutcome: result.budget.outcome,
        evidenceFiles: paths,
      },
      null,
      2,
    )}\n`,
  );
}

async function cleanup(lifecycle: CleanupLifecycle): Promise<void> {
  if (profile() !== "live") throw new Error("Credential cleanup requires --profile live.");
  const gateway = LiteLlmModelGateway.fromEnvironment(root);
  const result = await gateway.cleanupInterruptedRuns(
    option("--run-id") ?? undefined,
    lifecycle.signal,
  );
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.failed > 0) process.exitCode = 1;
}

async function validate(): Promise<void> {
  const base = resolve(root, "evidence/generated");
  const requested = option("--file");
  const paths = requested
    ? [resolve(root, requested)]
    : (await readdir(base).catch(() => []))
        .filter((name) => /^model-gateway-(?!trace-).+\.json$/.test(name))
        .map((name) => resolve(base, name));
  for (const path of paths) await validateGatewayEvidenceFile(path);
  process.stdout.write(
    paths.length === 0
      ? "No live model-gateway evidence is checked in; no validation claim was made.\n"
      : `Validated ${paths.length} model-gateway evidence pack(s).\n`,
  );
}

const exitCode = await runSignalAwareCli(async (lifecycle) => {
  const command = process.argv[2] ?? "run";
  if (command === "run") await run(lifecycle);
  else if (command === "cleanup") await cleanup(lifecycle);
  else if (command === "validate") await validate();
  else throw new Error("Usage: cli.ts run|cleanup|validate [--profile offline|live].");
});
process.exitCode = exitCode;
