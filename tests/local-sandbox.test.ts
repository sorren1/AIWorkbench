import { access, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import type {
  SandboxAvailability,
  SandboxCommandReceipt,
  SandboxExecutionRequest,
  SandboxExecutionResult,
  SandboxProvider,
} from "../tools/local-sandbox/contracts";
import {
  validateAllGeneratedEvidence,
  validateEvidencePack,
} from "../tools/local-sandbox/evidence";
import { normalizeCapturedOutput, runProcess } from "../tools/local-sandbox/process";
import { runSandboxSlice } from "../tools/local-sandbox/runner";
import {
  applyControlledReplacement,
  changedFiles,
  resolveControlledPath,
  sha256Bytes,
  snapshotRepository,
} from "../tools/local-sandbox/security";

const projectRoot = resolve(import.meta.dirname, "..");
const imageDigest = `node@sha256:${"a".repeat(64)}`;
const temporaryPaths: string[] = [];

class FixtureSandboxProvider implements SandboxProvider {
  readonly kind = "LOCAL_DOCKER" as const;

  constructor(
    private readonly postTestExitCode: number,
    private readonly postBuildExitCode = 0,
  ) {}

  inspect(): Promise<SandboxAvailability> {
    return Promise.resolve({
      available: true,
      dockerClientVersion: "29.5.3-test",
      dockerServerVersion: "29.5.3-test",
      image: "node:22.18.0-alpine",
      imageDigest,
      detail: "Synthetic provider receipt for unit testing.",
    });
  }

  async prepare(): Promise<SandboxAvailability> {
    return this.inspect();
  }

  execute(request: SandboxExecutionRequest): Promise<SandboxExecutionResult> {
    const commands = request.commands.map((command) => {
      const exitCode =
        command.id === "pre-test"
          ? 1
          : command.id === "build"
            ? this.postBuildExitCode
            : command.id === "test"
              ? this.postTestExitCode
              : 0;
      const stdout =
        command.id === "tool-versions"
          ? "v22.18.0\n10.9.3"
          : command.id === "pre-test"
            ? "2 tests failed"
            : exitCode === 0
              ? `${command.id} passed`
              : `${command.id} failed`;
      const receipt: SandboxCommandReceipt = {
        id: command.id,
        argv: command.argv,
        containerName: `fixture-${request.phase}-${command.id}`,
        startedAt: "2026-07-17T16:00:00.000Z",
        durationMs: 12,
        exitCode,
        timedOut: false,
        stdout,
        stderr: "",
        stdoutSha256: sha256Bytes(stdout),
        stderrSha256: sha256Bytes(""),
        outputTruncated: false,
      };
      return receipt;
    });
    return Promise.resolve({
      provider: "LOCAL_DOCKER",
      image: "node:22.18.0-alpine",
      imageDigest,
      networkMode: "none",
      user: "65532:65532",
      readOnlyRootFilesystem: true,
      noNewPrivileges: true,
      commands,
      cleanupAttempts: [],
    });
  }

  cleanup(): Promise<readonly string[]> {
    return Promise.resolve([]);
  }
}

async function temporaryDirectory(prefix: string): Promise<string> {
  const path = await mkdtemp(resolve(tmpdir(), prefix));
  temporaryPaths.push(path);
  return path;
}

afterEach(async () => {
  await Promise.all(
    temporaryPaths.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("controlled local sandbox filesystem boundary", () => {
  it("allows one exact replacement on an approved path", async () => {
    const root = await temporaryDirectory("sandbox-allowlist-");
    await mkdir(resolve(root, "src"));
    await writeFile(resolve(root, "src/report.js"), "old value\n", "utf8");
    await applyControlledReplacement({
      root,
      path: "src/report.js",
      allowedPaths: ["src/report.js"],
      expected: "old value",
      replacement: "new value",
    });
    expect(await readFile(resolve(root, "src/report.js"), "utf8")).toBe("new value\n");
  });

  it("rejects traversal and paths outside the exact allow list", async () => {
    const root = await temporaryDirectory("sandbox-traversal-");
    await mkdir(resolve(root, "src"));
    await writeFile(resolve(root, "src/report.js"), "fixture", "utf8");
    await expect(resolveControlledPath(root, "../outside.txt", ["src/report.js"])).rejects.toThrow(
      "unsafe path",
    );
    await expect(resolveControlledPath(root, "package.json", ["src/report.js"])).rejects.toThrow(
      "outside approved",
    );
  });

  it("rejects a symlink that could escape the workspace", async () => {
    const root = await temporaryDirectory("sandbox-symlink-");
    const outside = await temporaryDirectory("sandbox-symlink-outside-");
    await mkdir(resolve(root, "src"));
    await writeFile(resolve(outside, "report.js"), "outside", "utf8");
    await symlink(outside, resolve(root, "src/linked"), "junction");
    await expect(
      resolveControlledPath(root, "src/linked/report.js", ["src/linked/report.js"]),
    ).rejects.toThrow("symbolic link");
  });

  it("rejects unexpected file creation when comparing snapshots", async () => {
    const root = await temporaryDirectory("sandbox-unexpected-");
    await writeFile(resolve(root, "approved.txt"), "before", "utf8");
    const before = await snapshotRepository(root);
    await writeFile(resolve(root, "unexpected.txt"), "created", "utf8");
    const after = await snapshotRepository(root);
    expect(() => changedFiles(before, after, ["approved.txt"])).toThrow("creation/deletion");
  });
});

describe("sandbox process and evidence behavior", () => {
  it("rejects repository and command input before preparing Docker", () => {
    const cli = resolve(projectRoot, "tools/local-sandbox/cli.ts");
    const result = spawnSync(
      process.execPath,
      ["--import", "tsx", cli, "run", "--repository", "../external", "--command", "whoami"],
      { cwd: projectRoot, encoding: "utf8", windowsHide: true },
    );
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("accepts no repository path, patch, command, or visitor input");
  });

  it("terminates a process after the configured timeout", async () => {
    const result = await runProcess({
      executable: process.execPath,
      args: ["-e", "setTimeout(() => {}, 1000)"],
      timeoutMs: 30,
    });
    expect(result.timedOut).toBe(true);
    expect(result.exitCode).not.toBe(0);
  });

  it("normalizes line endings, ANSI escapes, and temporary roots deterministically", () => {
    const input = "\u001b[31mD:\\temp\\run\\file.js\u001b[0m\r\nresult\r\n";
    expect(normalizeCapturedOutput(input, ["D:\\temp\\run"])).toBe(
      "<TEMP_WORKSPACE>\\file.js\nresult",
    );
  });

  it("produces valid successful evidence and removes the temporary workspace", async () => {
    let workspace = "";
    const pack = await runSandboxSlice({
      projectRoot,
      provider: new FixtureSandboxProvider(0),
      writeEvidence: false,
      fixedRun: { id: "sandbox-test-success", createdAt: "2026-07-17T16:00:00.000Z" },
      onWorkspaceCreated: (path) => {
        workspace = path;
      },
    });
    expect(pack.run.status).toBe("SUCCEEDED");
    expect(pack.change.changedFiles.map((file) => file.path)).toEqual(["src/report.js"]);
    expect(
      pack.prePatchExecution.commands.find((command) => command.id === "pre-test")?.exitCode,
    ).toBe(1);
    expect(
      pack.postPatchExecution.commands.find((command) => command.id === "test")?.exitCode,
    ).toBe(0);
    expect((await validateEvidencePack(pack)).valid).toBe(true);
    await expect(access(workspace)).rejects.toThrow();
  });

  it("produces honest failed-test evidence", async () => {
    const pack = await runSandboxSlice({
      projectRoot,
      provider: new FixtureSandboxProvider(1),
      scenario: "failed-validation",
      writeEvidence: false,
      fixedRun: { id: "sandbox-test-failure", createdAt: "2026-07-17T16:00:00.000Z" },
    });
    expect(pack.run.status).toBe("FAILED");
    expect(
      pack.postPatchExecution.commands.find((command) => command.id === "test")?.exitCode,
    ).toBe(1);
    expect((await validateEvidencePack(pack)).valid).toBe(true);
  });

  it("produces honest failed-build evidence", async () => {
    const pack = await runSandboxSlice({
      projectRoot,
      provider: new FixtureSandboxProvider(0, 1),
      writeEvidence: false,
      fixedRun: { id: "sandbox-test-build-failure", createdAt: "2026-07-17T16:00:00.000Z" },
    });
    expect(pack.run.status).toBe("FAILED");
    expect(
      pack.postPatchExecution.commands.find((command) => command.id === "build")?.exitCode,
    ).toBe(1);
    expect((await validateEvidencePack(pack)).valid).toBe(true);
  });

  it("detects tampering in a successful evidence pack", async () => {
    const pack = await runSandboxSlice({
      projectRoot,
      provider: new FixtureSandboxProvider(0),
      writeEvidence: false,
      fixedRun: { id: "sandbox-test-tamper", createdAt: "2026-07-17T16:00:00.000Z" },
    });
    const tampered = {
      ...pack,
      change: { ...pack.change, unifiedDiff: `${pack.change.unifiedDiff}\nmalicious change` },
    };
    const validation = await validateEvidencePack(tampered);
    expect(validation.valid).toBe(false);
    if (!validation.valid) expect(validation.errors).toContain("Unified-diff hash mismatch.");
  });

  it("validates every checked-in real-run pack and the successful latest pointer", async () => {
    const evidence = await validateAllGeneratedEvidence(projectRoot);
    expect(evidence.packs.map((pack) => pack.run.status).sort()).toEqual(["FAILED", "SUCCEEDED"]);
    expect(evidence.latest.run.status).toBe("SUCCEEDED");
  });
});
