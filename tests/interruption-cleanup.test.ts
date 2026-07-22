import { spawn, type ChildProcess } from "node:child_process";
import { access, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

const projectRoot = resolve(import.meta.dirname, "..");
const fixture = resolve(projectRoot, "tests/fixtures/interruption-cli.ts");
const temporaryRoots: string[] = [];
const recoveryMarkers: string[] = [];
const ownedWorkspaces: string[] = [];

type Signal = "SIGINT" | "SIGTERM";
type Stage =
  | "resource-setup"
  | "active-execution"
  | "evidence-finalization"
  | "cleanup"
  | "cleanup-timeout"
  | "cleanup-failure";

async function exists(path: string): Promise<boolean> {
  return access(path)
    .then(() => true)
    .catch(() => false);
}

async function waitForFile(path: string, timeoutMs = 8_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (!(await exists(path))) {
    if (Date.now() >= deadline) throw new Error(`Timed out waiting for ${path}.`);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 20));
  }
}

function waitForExit(child: ChildProcess, timeoutMs = 8_000) {
  return new Promise<{ readonly code: number | null; readonly signal: NodeJS.Signals | null }>(
    (resolveExit, reject) => {
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        reject(new Error("Interrupted fixture did not exit within its cleanup bound."));
      }, timeoutMs);
      child.once("exit", (code, signal) => {
        clearTimeout(timer);
        resolveExit({ code, signal });
      });
      child.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
    },
  );
}

async function startFixture(subsystem: "sandbox" | "gateway", stage: Stage) {
  const stateRoot = await mkdtemp(resolve(tmpdir(), `adw-${subsystem}-interrupt-`));
  temporaryRoots.push(stateRoot);
  const runId = `sandbox-interrupt-${subsystem}-${stage.replaceAll(/[^a-z]/g, "-")}-${Date.now()}`;
  const child = spawn(
    process.execPath,
    ["--import", "tsx", fixture, subsystem, stage, stateRoot, runId],
    {
      cwd: projectRoot,
      env: process.env,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe", "ipc"],
    },
  );
  let stdout = "";
  let stderr = "";
  if (!child.stdout || !child.stderr) throw new Error("Fixture output pipes were not created.");
  child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
    stdout += chunk;
  });
  child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
    stderr += chunk;
  });
  const statePath = resolve(projectRoot, `.workbench/local-sandbox/runs/${runId}.json`);
  recoveryMarkers.push(statePath);
  ownedWorkspaces.push(resolve(projectRoot, `.workbench/local-sandbox/workspaces/${runId}`));
  return { child, stateRoot, runId, statePath, output: () => ({ stdout, stderr }) };
}

function deliverSignal(child: ChildProcess, signal: Signal): boolean {
  if (process.platform === "win32") {
    if (!child.connected) return false;
    child.send({ signal });
    return true;
  }
  return child.kill(signal);
}

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
  await Promise.all(recoveryMarkers.splice(0).map((path) => rm(path, { force: true })));
  await Promise.all(
    ownedWorkspaces.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

describe("signal-aware CLI cleanup", () => {
  const cases: readonly {
    readonly subsystem: "sandbox" | "gateway";
    readonly stage: Exclude<Stage, "cleanup-timeout" | "cleanup-failure">;
    readonly signal: Signal;
    readonly repeatWith?: Signal;
  }[] = [
    { subsystem: "sandbox", stage: "resource-setup", signal: "SIGINT" },
    { subsystem: "gateway", stage: "resource-setup", signal: "SIGTERM" },
    { subsystem: "sandbox", stage: "active-execution", signal: "SIGTERM" },
    { subsystem: "gateway", stage: "active-execution", signal: "SIGINT" },
    { subsystem: "sandbox", stage: "evidence-finalization", signal: "SIGINT" },
    { subsystem: "gateway", stage: "cleanup", signal: "SIGTERM", repeatWith: "SIGINT" },
  ];

  for (const testCase of cases) {
    it(`cleans ${testCase.subsystem} resources after ${testCase.signal} during ${testCase.stage}`, async () => {
      const fixtureRun = await startFixture(testCase.subsystem, testCase.stage);
      await waitForFile(resolve(fixtureRun.stateRoot, `${testCase.stage}-started`));
      expect(deliverSignal(fixtureRun.child, testCase.signal)).toBe(true);
      if (testCase.repeatWith) {
        await new Promise((resolveDelay) => setTimeout(resolveDelay, 50));
        deliverSignal(fixtureRun.child, testCase.repeatWith);
      }
      const result = await waitForExit(fixtureRun.child);
      const output = fixtureRun.output();
      expect(result.signal).toBeNull();
      expect(result.code).toBe(testCase.signal === "SIGINT" ? 130 : 143);
      expect(output.stderr).toContain(`Shutdown requested by ${testCase.signal}`);
      if (testCase.repeatWith) {
        expect(output.stderr).toContain("did not start duplicate cleanup");
      }
      expect(await readFile(resolve(fixtureRun.stateRoot, "cleanup-attempts"), "utf8")).toBe("1");
      expect(await exists(resolve(fixtureRun.stateRoot, "credential-lease"))).toBe(false);
      expect(await exists(resolve(fixtureRun.stateRoot, "provider-resource"))).toBe(false);
      expect(await exists(fixtureRun.statePath)).toBe(false);
      expect(
        await exists(
          resolve(projectRoot, `.workbench/local-sandbox/workspaces/${fixtureRun.runId}`),
        ),
      ).toBe(false);
      expect(`${output.stdout}${output.stderr}`).not.toContain("systemInstruction");
      expect(`${output.stdout}${output.stderr}`).not.toContain("requestText");
    }, 20_000);
  }

  for (const subsystem of ["sandbox", "gateway"] as const) {
    it(`reports a ${subsystem} cleanup failure with a non-zero exit`, async () => {
      const fixtureRun = await startFixture(subsystem, "cleanup-failure");
      const result = await waitForExit(fixtureRun.child);
      const output = fixtureRun.output();
      expect(result.signal).toBeNull();
      expect(result.code).toBe(1);
      expect(output.stderr).toMatch(/Cleanup failed|cleanup failed/i);
      expect(await readFile(resolve(fixtureRun.stateRoot, "cleanup-attempts"), "utf8")).toBe("1");
      expect(await exists(resolve(fixtureRun.stateRoot, "credential-lease"))).toBe(false);
      expect(
        await exists(
          resolve(projectRoot, `.workbench/local-sandbox/workspaces/${fixtureRun.runId}`),
        ),
      ).toBe(false);
    }, 20_000);
  }

  it("bounds a stalled cleanup and still removes the owned workspace", async () => {
    const started = Date.now();
    const fixtureRun = await startFixture("sandbox", "cleanup-timeout");
    const result = await waitForExit(fixtureRun.child);
    const output = fixtureRun.output();
    expect(result.code).toBe(1);
    expect(Date.now() - started).toBeLessThan(5_000);
    expect(output.stderr).toContain("Cleanup failed");
    expect(
      await exists(resolve(projectRoot, `.workbench/local-sandbox/workspaces/${fixtureRun.runId}`)),
    ).toBe(false);
    expect(await exists(fixtureRun.statePath)).toBe(true);
  }, 10_000);
});
