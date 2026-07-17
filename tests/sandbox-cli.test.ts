import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

import {
  validateApprovalStore,
  validateContextPack,
} from "../src/demo/control-plane/registry/validation";

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
    const persistedPack: unknown = JSON.parse(
      await readFile(resolve(runRoot, "run.test.cli/context-pack.json"), "utf8"),
    );
    expect(validateContextPack(persistedPack).valid).toBe(true);

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
    if (!isRecord(evidence)) throw new Error("Execution evidence is not an object.");
    expect(evidence.classification).toBe("SYNTHETIC_LOCAL_APPROVAL_EVIDENCE");
    expect(evidence.contextPackDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(evidence.contextPack).toMatchObject({
      classification: "SYNTHETIC_PUBLIC_CONTEXT_PACK",
    });
    expect(evidence.stageExecutionManifest).toMatchObject({
      contextPackDigest: evidence.contextPackDigest,
    });
    expect(evidence.result).toMatchObject({ changed: true, path: "src/report.js" });
    expect(evidence.externalNetworkCalls).toBe(0);
    await expect(
      command(["resume", "--run", "run.test.cli", "--run-root", runRoot]),
    ).rejects.toThrow();
  }, 20_000);

  it("rejects resume when the persisted context pack no longer matches", async () => {
    const runRoot = await root();
    await command([
      "start",
      "--scenario",
      "approval-required",
      "--run",
      "run.test.context-mismatch",
      "--run-root",
      runRoot,
    ]);
    await command([
      "approve",
      "--request",
      "approval.run.test.context-mismatch.patch",
      "--as",
      "synthetic-code-reviewer",
      "--reason",
      "Original synthetic context and patch reviewed.",
      "--run-root",
      runRoot,
    ]);
    const packPath = resolve(runRoot, "run.test.context-mismatch/context-pack.json");
    const packValidation = validateContextPack(JSON.parse(await readFile(packPath, "utf8")));
    if (!packValidation.valid) throw new Error("Persisted context fixture is invalid.");
    const pack = packValidation.value;
    const first = pack.includedRecords[0];
    if (!first) throw new Error("Persisted context fixture has no selected record.");
    const tamperedPack = {
      ...pack,
      includedRecords: [
        {
          ...first,
          record: { ...first.record, content: `${first.record.content} tampered` },
        },
        ...pack.includedRecords.slice(1),
      ],
    };
    await writeFile(packPath, `${JSON.stringify(tamperedPack, null, 2)}\n`, "utf8");

    await expect(
      command(["resume", "--run", "run.test.context-mismatch", "--run-root", runRoot]),
    ).rejects.toThrow();
    const run: unknown = JSON.parse(
      await readFile(resolve(runRoot, "run.test.context-mismatch/run.json"), "utf8"),
    );
    if (!isRecord(run)) throw new Error("Run record is not an object.");
    expect(run.status).toBe("BLOCKED");
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
      '"replacement": "',
      '"replacement": "mutated after approval: ',
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
