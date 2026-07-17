import { resolve } from "node:path";

import { LocalDockerSandboxProvider } from "./dockerProvider";
import { E2BSandboxProvider } from "./e2bProvider";
import { validateAllGeneratedEvidence } from "./evidence";
import { runSandboxSlice, type SandboxScenario } from "./runner";
import type { SandboxProvider } from "./contracts";

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

async function run(): Promise<void> {
  const options = runOptions();
  const pack = await runSandboxSlice({
    projectRoot,
    provider: options.provider,
    scenario: options.scenario,
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

try {
  const command = process.argv[2];
  if (command === "run") await run();
  else if (command === "validate") await validate();
  else throw new Error("Expected one command: run or validate.");
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Unknown local sandbox error"}\n`,
  );
  process.exitCode = 1;
}
