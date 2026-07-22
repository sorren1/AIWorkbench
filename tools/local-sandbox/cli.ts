import { resolve } from "node:path";

import { runSignalAwareCli, type CleanupLifecycle } from "../lifecycle";
import { LocalDockerSandboxProvider } from "./dockerProvider";
import { E2BSandboxProvider } from "./e2bProvider";
import { validateAllGeneratedEvidence } from "./evidence";
import { runSandboxSlice, type SandboxScenario } from "./runner";
import type { SandboxProvider } from "./contracts";
import { recoverSandboxRun } from "./recovery";

const projectRoot = resolve(import.meta.dirname, "../..");

type RunOptions = {
  readonly scenario: SandboxScenario;
  readonly provider: SandboxProvider;
};

function runOptions(): RunOptions {
  const args = process.argv.slice(3);
  let selectedProvider: "docker" | "e2b" = "docker";
  let scenario: SandboxScenario = "successful-validation";
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--failed-validation") {
      scenario = "failed-validation";
      continue;
    }
    if (argument === "--provider") {
      const value = args[index + 1];
      if (value !== "docker" && value !== "e2b") {
        throw new Error("--provider must be followed by docker or e2b.");
      }
      selectedProvider = value;
      index += 1;
      continue;
    }
    throw new Error(
      `Unsupported sandbox option: ${argument ?? "<missing>"}. This command accepts only --provider docker|e2b and the repository-owned --failed-validation scenario; it accepts no repository path, patch, command, or visitor input.`,
    );
  }
  return {
    scenario,
    provider:
      selectedProvider === "e2b" ? new E2BSandboxProvider() : new LocalDockerSandboxProvider(),
  };
}

async function run(lifecycle: CleanupLifecycle): Promise<void> {
  const options = runOptions();
  const pack = await runSandboxSlice({
    projectRoot,
    provider: options.provider,
    scenario: options.scenario,
    lifecycle,
  });
  process.stdout.write(
    `${JSON.stringify({
      runId: pack.run.id,
      provider: pack.prePatchExecution.provider,
      status: pack.run.status,
      sourceCommit: pack.run.sourceCommit,
      changedFiles: pack.change.changedFiles.map((file) => file.path),
      preTestExitCode: pack.prePatchExecution.commands.find((command) => command.id === "pre-test")
        ?.exitCode,
      buildExitCode: pack.postPatchExecution.commands.find((command) => command.id === "build")
        ?.exitCode,
      testExitCode: pack.postPatchExecution.commands.find((command) => command.id === "test")
        ?.exitCode,
      evidenceDigest: pack.evidenceDigest,
      traceId: pack.observability.trace.traceId,
      traceArtifactSha256: pack.observability.trace.artifactSha256,
      budgetOutcome: pack.observability.budget.outcome,
    })}\n`,
  );
  if (pack.run.status !== "SUCCEEDED") process.exitCode = 1;
}

async function validate(): Promise<void> {
  const evidence = await validateAllGeneratedEvidence(projectRoot);
  process.stdout.write(
    `${JSON.stringify({
      status: "VALID",
      packCount: evidence.packs.length,
      runId: evidence.latest.run.id,
      evidenceDigest: evidence.latest.evidenceDigest,
    })}\n`,
  );
}

function recoveryRunId(): string {
  const args = process.argv.slice(3);
  if (args.length !== 2 || args[0] !== "--run-id" || !args[1]) {
    throw new Error("Sandbox recovery requires exactly --run-id sandbox-<owned-run-id>.");
  }
  return args[1];
}

async function recover(lifecycle: CleanupLifecycle): Promise<void> {
  const result = await recoverSandboxRun({
    projectRoot,
    runId: recoveryRunId(),
    signal: lifecycle.signal,
    providerFor: (kind) =>
      kind === "E2B" ? new E2BSandboxProvider() : new LocalDockerSandboxProvider(),
  });
  process.stdout.write(
    `${JSON.stringify({
      status: "CLEAN",
      runId: result.runId,
      providerCleanupAttempts: result.providerAttempts.length,
      temporaryWorkspaceRemoved: result.temporaryWorkspaceRemoved,
      recoveryStateRemoved: result.recoveryStateRemoved,
    })}\n`,
  );
}

const exitCode = await runSignalAwareCli(async (lifecycle) => {
  const command = process.argv[2];
  if (command === "run") await run(lifecycle);
  else if (command === "recover") await recover(lifecycle);
  else if (command === "validate") await validate();
  else throw new Error("Expected one command: run, recover, or validate.");
});
process.exitCode = exitCode;
