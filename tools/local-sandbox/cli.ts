import { resolve } from "node:path";

import { LocalDockerSandboxProvider } from "./dockerProvider";
import { validateAllGeneratedEvidence } from "./evidence";
import { runSandboxSlice, type SandboxScenario } from "./runner";

const projectRoot = resolve(import.meta.dirname, "../..");

function scenario(): SandboxScenario {
  const value = process.argv.includes("--failed-validation")
    ? "failed-validation"
    : "successful-validation";
  const unsupported = process.argv
    .slice(3)
    .filter((argument) => argument !== "--failed-validation");
  if (unsupported.length > 0) {
    throw new Error(
      `Unsupported sandbox option: ${unsupported.join(", ")}. This command accepts no repository path, patch, command, or visitor input.`,
    );
  }
  return value;
}

async function run(): Promise<void> {
  const pack = await runSandboxSlice({
    projectRoot,
    provider: new LocalDockerSandboxProvider(),
    scenario: scenario(),
  });
  process.stdout.write(
    `${JSON.stringify({
      runId: pack.run.id,
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
