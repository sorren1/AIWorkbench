import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

import { validateApprovalStore } from "../src/demo/control-plane/registry/validation";

const execFileAsync = promisify(execFile);
const cli = resolve(import.meta.dirname, "../tools/demo-sandbox/cli.ts");
const roots: string[] = [];

async function root(): Promise<string> {
  const path = await mkdtemp(resolve(tmpdir(), "workbench-approval-cli-test-"));
  roots.push(path);
  return path;
}

async function command(args: readonly string[]) {
  return execFileAsync(process.execPath, ["--import", "tsx", cli, ...args], {
    cwd: resolve(import.meta.dirname, ".."),
  });
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("durable local sandbox approval CLI", () => {
  it("pauses, refuses self-approval, records reviewer approval, and resumes once", async () => {
    const runRoot = await root();
    const started = await command([
      "start",
      "--scenario",
      "approval-required",
      "--run",
      "run.test.cli",
      "--run-root",
      runRoot,
    ]);
    const startResult: unknown = JSON.parse(started.stdout);
    expect(startResult).toMatchObject({
      runId: "run.test.cli",
      requestId: "approval.run.test.cli.patch",
      status: "WAITING_FOR_APPROVAL",
    });

    await expect(
      command([
        "approve",
        "--request",
        "approval.run.test.cli.patch",
        "--as",
        "synthetic-implementer",
        "--reason",
        "self approval",
        "--run-root",
        runRoot,
      ]),
    ).rejects.toThrow();

    const decided = await command([
      "approve",
      "--request",
      "approval.run.test.cli.patch",
      "--as",
      "synthetic-code-reviewer",
      "--reason",
      "Synthetic diff is bounded to src/report.js.",
      "--run-root",
      runRoot,
    ]);
    expect(JSON.parse(decided.stdout)).toMatchObject({ status: "APPROVED" });

    const resumed = await command(["resume", "--run", "run.test.cli", "--run-root", runRoot]);
    expect(JSON.parse(resumed.stdout)).toMatchObject({ status: "COMPLETED" });
    const evidence: unknown = JSON.parse(
      await readFile(resolve(runRoot, "run.test.cli/execution-evidence.json"), "utf8"),
    );
    expect(evidence).toMatchObject({
      classification: "SYNTHETIC_LOCAL_APPROVAL_EVIDENCE",
      result: { changed: true, path: "src/report.js" },
      externalNetworkCalls: 0,
    });
    await expect(
      command(["resume", "--run", "run.test.cli", "--run-root", runRoot]),
    ).rejects.toThrow();
  }, 20_000);

  it("invalidates an approval when proposed arguments change before resume", async () => {
    const runRoot = await root();
    await command([
      "start",
      "--scenario",
      "approval-required",
      "--run",
      "run.test.stale",
      "--run-root",
      runRoot,
    ]);
    await command([
      "approve",
      "--request",
      "approval.run.test.stale.patch",
      "--as",
      "synthetic-code-reviewer",
      "--reason",
      "Original synthetic patch reviewed.",
      "--run-root",
      runRoot,
    ]);
    const runPath = resolve(runRoot, "run.test.stale/run.json");
    const originalRun = await readFile(runPath, "utf8");
    const mutatedRun = originalRun.replace(
      "return `Variance: ${actual - budget}`; // approved synthetic CLI patch",
      "mutated after approval",
    );
    expect(mutatedRun).not.toBe(originalRun);
    await writeFile(runPath, mutatedRun, "utf8");

    await expect(
      command(["resume", "--run", "run.test.stale", "--run-root", runRoot]),
    ).rejects.toThrow();
    const validation = validateApprovalStore(
      JSON.parse(await readFile(resolve(runRoot, "run.test.stale/approval-state.json"), "utf8")),
    );
    expect(validation.valid).toBe(true);
    if (validation.valid) {
      expect(validation.value.requests["approval.run.test.stale.patch"]?.status).toBe(
        "INVALIDATED",
      );
      expect(validation.value.events.map((event) => event.type)).toEqual([
        "REQUESTED",
        "APPROVED",
        "INVALIDATED",
      ]);
    }
  }, 20_000);
});
