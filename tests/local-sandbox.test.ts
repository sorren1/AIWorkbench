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
import { createExecutionBudget } from "../tools/local-sandbox/budgets";
import {
  BudgetStopEvidenceError,
  validateAllGeneratedEvidence,
  validateEvidencePack,
} from "../tools/local-sandbox/evidence";
import { normalizeCapturedOutput, runProcess } from "../tools/local-sandbox/process";
import { runSandboxSlice } from "../tools/local-sandbox/runner";
import { createSandboxRecoveryState, recoverSandboxRun } from "../tools/local-sandbox/recovery";
import type { TraceArtifactOutput } from "../tools/local-sandbox/telemetry";
import {
  applyControlledReplacement,
  changedFiles,
  resolveControlledPath,
  sha256Bytes,
  snapshotRepository,
} from "../tools/local-sandbox/security";

const projectRoot = resolve(import.meta.dirname, "..");
const imageDigest = `sha256:${"a".repeat(64)}`;
const temporaryPaths: string[] = [];

class FixtureSandboxProvider implements SandboxProvider {
  readonly kind = "LOCAL_DOCKER" as const;

  constructor(
    private readonly postTestExitCode: number,
    private readonly postBuildExitCode = 0,
  ) {}

  inspect(): Promise<SandboxAvailability> {
    return Promise.resolve({
      provider: "LOCAL_DOCKER",
      available: true,
      dockerClientVersion: "29.5.3-test",
      dockerServerVersion: "29.5.3-test",
      image: "ai-delivery-workbench-sandbox:node-22.23.1",
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
          ? "v22.23.1"
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
      image: "ai-delivery-workbench-sandbox:node-22.23.1",
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

class RecoverySandboxProvider extends FixtureSandboxProvider {
  cleanupCalls = 0;

  override cleanup(): Promise<readonly string[]> {
    this.cleanupCalls += 1;
    return Promise.resolve(["fixture-owned-resource:removed"]);
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

  it("terminates an active child process when cancellation is requested", async () => {
    const controller = new AbortController();
    const pending = runProcess({
      executable: process.execPath,
      args: ["-e", "setTimeout(() => {}, 1000)"],
      timeoutMs: 5_000,
      signal: controller.signal,
    });
    setTimeout(() => controller.abort(new Error("Synthetic cancellation.")), 30);
    await expect(pending).resolves.toMatchObject({ aborted: true, timedOut: false });
  });

  it("normalizes line endings, ANSI escapes, and temporary roots deterministically", () => {
    const input = "\u001b[31mD:\\temp\\run\\file.js\u001b[0m\r\nresult\r\n";
    expect(normalizeCapturedOutput(input, ["D:\\temp\\run"])).toBe(
      "<TEMP_WORKSPACE>\\file.js\nresult",
    );
  });

  it("produces valid successful evidence and removes the temporary workspace", async () => {
    let workspace = "";
    let trace: TraceArtifactOutput | undefined;
    const pack = await runSandboxSlice({
      projectRoot,
      provider: new FixtureSandboxProvider(0),
      writeEvidence: false,
      fixedRun: { id: "sandbox-test-success", createdAt: "2026-07-17T16:00:00.000Z" },
      onWorkspaceCreated: (path) => {
        workspace = path;
      },
      onTraceCreated: (value) => {
        trace = value;
      },
    });
    expect(pack.schemaVersion).toBe(3);
    expect(pack.run.status).toBe("SUCCEEDED");
    expect(pack.change.changedFiles.map((file) => file.path)).toEqual(["src/report.js"]);
    expect(
      pack.prePatchExecution.commands.find((command) => command.id === "pre-test")?.exitCode,
    ).toBe(1);
    expect(
      pack.postPatchExecution.commands.find((command) => command.id === "test")?.exitCode,
    ).toBe(0);
    expect(trace).toBeDefined();
    if (!trace) throw new Error("Trace callback was not invoked.");
    expect((await validateEvidencePack(pack, trace.json)).valid).toBe(true);
    expect(trace.artifact.traceId).toBe(pack.observability.trace.traceId);
    expect(trace.sha256).toBe(pack.observability.trace.artifactSha256);
    expect(trace.artifact.bindings.contextPackDigest).toBe(pack.governance.contextPackDigest);
    const root = trace.artifact.spans.find((span) => span.name === "delivery.run");
    const stage = trace.artifact.spans.find((span) => span.name === "delivery.stage");
    const agent = trace.artifact.spans.find((span) => span.name === "agent.invoke");
    const approval = trace.artifact.spans.find((span) => span.name === "approval.wait");
    expect(root?.parentSpanId).toBeNull();
    expect(stage?.parentSpanId).toBe(root?.spanId);
    expect(agent?.parentSpanId).toBe(stage?.spanId);
    expect(approval?.parentSpanId).toBe(stage?.spanId);
    expect(trace.artifact.summary.modelCallCount).toBe(0);
    expect(pack.observability.accounting.total).toMatchObject({
      modelCalls: 0,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      tokenMeasurement: "EXACT_ZERO_NO_MODEL",
      costMeasurement: "EXACT_ZERO_NO_MODEL",
    });
    await expect(access(workspace)).rejects.toThrow();
  });

  it("produces honest failed-test evidence", async () => {
    let trace: TraceArtifactOutput | undefined;
    const pack = await runSandboxSlice({
      projectRoot,
      provider: new FixtureSandboxProvider(1),
      scenario: "failed-validation",
      writeEvidence: false,
      fixedRun: { id: "sandbox-test-failure", createdAt: "2026-07-17T16:00:00.000Z" },
      onTraceCreated: (value) => {
        trace = value;
      },
    });
    expect(pack.run.status).toBe("FAILED");
    expect(
      pack.postPatchExecution.commands.find((command) => command.id === "test")?.exitCode,
    ).toBe(1);
    expect((await validateEvidencePack(pack)).valid).toBe(true);
    expect(trace?.artifact.spans.some((span) => span.status === "ERROR")).toBe(true);
  });

  it("creates failed evidence and a trace event when a stop budget is exceeded", async () => {
    let calls = 0;
    let trace: TraceArtifactOutput | undefined;
    const pack = await runSandboxSlice({
      projectRoot,
      provider: new FixtureSandboxProvider(0),
      writeEvidence: false,
      fixedRun: { id: "sandbox-test-budget-stop", createdAt: "2026-07-17T16:00:00.000Z" },
      executionBudget: createExecutionBudget({
        maximumWallClockDurationMs: 10,
        maximumStageDurationMs: 10,
        actionOnThreshold: "STOP_RUN",
      }),
      monotonicNow: () => {
        calls += 1;
        return calls >= 12 ? 20 : 0;
      },
      onTraceCreated: (value) => {
        trace = value;
      },
    });
    expect(pack.run.status).toBe("FAILED");
    expect(pack.observability.budget).toMatchObject({
      outcome: "STOPPED",
      stopReason: "WALL_CLOCK_DURATION",
    });
    expect(
      trace?.artifact.spans.some((span) =>
        span.events.some((event) => event.name === "budget.exceeded"),
      ),
    ).toBe(true);
  });

  it("finalizes trace-bound failure evidence before a tool call beyond budget", async () => {
    let caught: unknown;
    try {
      await runSandboxSlice({
        projectRoot,
        provider: new FixtureSandboxProvider(0),
        writeEvidence: false,
        fixedRun: {
          id: "sandbox-test-budget-preflight",
          createdAt: "2026-07-17T16:00:00.000Z",
        },
        executionBudget: createExecutionBudget({
          maximumToolCalls: 0,
          actionOnThreshold: "STOP_STAGE",
        }),
      });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(BudgetStopEvidenceError);
    if (!(caught instanceof BudgetStopEvidenceError)) return;
    expect(caught.evidence).toMatchObject({
      classification: "RECORDED_REAL_SANDBOX_BUDGET_STOP_EVIDENCE",
      stop: { dimension: "TOOL_CALLS", action: "STOP_STAGE" },
      run: { status: "FAILED" },
    });
    expect(caught.evidence.trace.traceId).toBe(caught.traceArtifact.traceId);
    expect(
      caught.traceArtifact.spans.some((span) =>
        span.events.some((event) => event.name === "budget.exceeded"),
      ),
    ).toBe(true);
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
    expect(evidence.packs.map((pack) => pack.run.status)).toEqual(
      expect.arrayContaining(["FAILED", "SUCCEEDED"]),
    );
    expect(evidence.latest.run.status).toBe("SUCCEEDED");
  });
});

describe("contained sandbox recovery", () => {
  it("recovers one exact owned run and is idempotent", async () => {
    const root = await temporaryDirectory("sandbox-recovery-");
    const runId = "sandbox-recovery-owned";
    const recovery = await createSandboxRecoveryState({
      projectRoot: root,
      runId,
      provider: "LOCAL_DOCKER",
      createdAt: "2026-07-21T12:00:00.000Z",
    });
    await mkdir(recovery.workspace);
    await writeFile(resolve(recovery.workspace, "owned.txt"), "owned", "utf8");
    const provider = new RecoverySandboxProvider(0);
    const providerFor = () => provider;
    await expect(
      recoverSandboxRun({
        projectRoot: root,
        runId,
        providerFor,
        signal: AbortSignal.timeout(2_000),
      }),
    ).resolves.toMatchObject({
      temporaryWorkspaceRemoved: true,
      recoveryStateRemoved: true,
    });
    await expect(
      recoverSandboxRun({
        projectRoot: root,
        runId,
        providerFor,
        signal: AbortSignal.timeout(2_000),
      }),
    ).resolves.toMatchObject({
      providerAttempts: [],
      temporaryWorkspaceRemoved: true,
      recoveryStateRemoved: true,
    });
    expect(provider.cleanupCalls).toBe(1);
    await expect(access(recovery.workspace)).rejects.toThrow();
  });

  it("rejects malformed ownership state without deleting outside the workspace root", async () => {
    const root = await temporaryDirectory("sandbox-recovery-contained-");
    const runId = "sandbox-recovery-contained";
    const outside = resolve(root, "outside.txt");
    await writeFile(outside, "retain", "utf8");
    await createSandboxRecoveryState({
      projectRoot: root,
      runId,
      provider: "LOCAL_DOCKER",
      createdAt: "2026-07-21T12:00:00.000Z",
    });
    const statePath = resolve(root, `.workbench/local-sandbox/runs/${runId}.json`);
    const state = JSON.parse(await readFile(statePath, "utf8")) as Record<string, unknown>;
    await writeFile(
      statePath,
      `${JSON.stringify({ ...state, workspaceRelativePath: "workspaces/../outside" })}\n`,
      "utf8",
    );
    const provider = new RecoverySandboxProvider(0);
    await expect(
      recoverSandboxRun({
        projectRoot: root,
        runId,
        providerFor: () => provider,
        signal: AbortSignal.timeout(2_000),
      }),
    ).rejects.toThrow();
    expect(provider.cleanupCalls).toBe(0);
    await expect(readFile(outside, "utf8")).resolves.toBe("retain");
  });
});
