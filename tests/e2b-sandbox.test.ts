import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { SandboxInfo, SandboxOpts } from "e2b";
import { describe, expect, it } from "vitest";

import type { SandboxExecutionRequest } from "../tools/local-sandbox/contracts";
import {
  E2BSandboxProvider,
  e2bProviderSdkVersion,
  e2bSandboxTimeoutMs,
  type E2BSandboxFactory,
  type E2BSandboxHandle,
} from "../tools/local-sandbox/e2bProvider";
import { validateEvidencePack } from "../tools/local-sandbox/evidence";
import { runSandboxSlice } from "../tools/local-sandbox/runner";
import { sha256Bytes } from "../tools/local-sandbox/security";

const projectRoot = resolve(import.meta.dirname, "..");

class FakeE2BFactory implements E2BSandboxFactory {
  readonly createOptions: SandboxOpts[] = [];
  readonly uploadedPaths: string[][] = [];
  readonly killedIds: string[] = [];
  readonly streamedStdout: string[] = [];
  readonly listedRunIds: string[] = [];
  private nextId = 1;
  private readonly orphanIds: string[];

  constructor(
    orphanIds: readonly string[] = [],
    private readonly networkProbeExitCode = 0,
  ) {
    this.orphanIds = [...orphanIds];
  }

  create(options: SandboxOpts): Promise<E2BSandboxHandle> {
    this.createOptions.push(options);
    const sandboxId = `e2b-fake-${this.nextId}`;
    this.nextId += 1;
    const files = new Map<string, string>();
    let running = true;
    const uploaded: string[] = [];
    this.uploadedPaths.push(uploaded);
    const info: SandboxInfo = {
      sandboxId,
      templateId: "base-fake-template",
      name: "base",
      metadata: options.metadata ?? {},
      startedAt: new Date("2026-07-17T16:00:00.000Z"),
      endAt: new Date("2026-07-17T16:02:00.000Z"),
      state: "running",
      cpuCount: 2,
      memoryMB: 512,
      envdVersion: "0.9.0-fake",
      allowInternetAccess: false,
      network: { denyOut: ["0.0.0.0/0"], allowPublicTraffic: false },
      lifecycle: { onTimeout: "kill", autoResume: false },
    };
    const handle: E2BSandboxHandle = {
      sandboxId,
      commands: {
        run: async (command, commandOptions) => {
          if (command.includes("fetch('https://example.com'")) {
            return { exitCode: this.networkProbeExitCode, stdout: "", stderr: "" };
          }
          const preTest = command.includes("'npm' 'test' '--silent'") && this.nextId === 2;
          const stdout = command.includes("node --version")
            ? "v22.18.0\n10.9.3"
            : preTest
              ? "2 synthetic tests failed"
              : "synthetic command passed";
          await commandOptions.onStdout?.(stdout);
          this.streamedStdout.push(stdout);
          return { exitCode: preTest ? 1 : 0, stdout, stderr: "" };
        },
      },
      files: {
        writeFiles(entries) {
          for (const entry of entries) {
            uploaded.push(entry.path);
            files.set(entry.path, entry.data);
          }
          return Promise.resolve([]);
        },
        read(path) {
          const content = files.get(path);
          if (content === undefined) throw new Error(`Missing fake E2B file: ${path}`);
          return Promise.resolve(content);
        },
        list(directory) {
          const prefix = `${directory}/`;
          const entries = new Map<string, "file" | "dir">();
          for (const path of files.keys()) {
            if (!path.startsWith(prefix)) continue;
            const remainder = path.slice(prefix.length);
            const [name] = remainder.split("/");
            if (!name) continue;
            const entryPath = `${directory}/${name}`;
            entries.set(entryPath, remainder.includes("/") ? "dir" : "file");
          }
          return Promise.resolve(
            [...entries]
              .map(([path, type]) => ({ path, type }))
              .sort((left, right) => left.path.localeCompare(right.path)),
          );
        },
      },
      getInfo: () => Promise.resolve(info),
      isRunning: () => Promise.resolve(running),
      kill: () => {
        running = false;
        this.killedIds.push(sandboxId);
        return Promise.resolve(true);
      },
    };
    return Promise.resolve(handle);
  }

  listByRunId(runId: string): Promise<readonly string[]> {
    this.listedRunIds.push(runId);
    return Promise.resolve(this.orphanIds);
  }

  killById(sandboxId: string): Promise<boolean> {
    this.killedIds.push(sandboxId);
    return Promise.resolve(true);
  }
}

function minimalRequest(path = "workspace/src/report.js"): SandboxExecutionRequest {
  const content = "export const synthetic = true;\n";
  return {
    runId: "sandbox-e2b-contract",
    phase: "after-patch",
    workspaceRoot: "ignored-by-e2b-provider",
    uploads: [
      {
        path,
        content,
        sha256: sha256Bytes(content),
        classification: "SYNTHETIC_TOY_REPOSITORY",
      },
      {
        path: "artifacts/plan.md",
        content: "# Synthetic plan\n",
        sha256: sha256Bytes("# Synthetic plan\n"),
        classification: "APPROVED_GENERATED_ARTIFACT",
      },
    ],
    commands: [{ id: "build", argv: ["npm", "run", "build", "--silent"] }],
    limits: {
      cpuCount: 0.5,
      memoryMb: 256,
      processLimit: 64,
      timeoutMs: 30_000,
      tmpfsMb: 16,
    },
  };
}

describe("optional E2B sandbox provider contract", () => {
  it("requires E2B_API_KEY without affecting the default local provider", async () => {
    const provider = new E2BSandboxProvider(new FakeE2BFactory(), "base", () => false);
    await expect(provider.inspect()).resolves.toMatchObject({
      provider: "E2B",
      available: false,
      apiKeyConfigured: false,
      sdkVersion: e2bProviderSdkVersion,
    });
    await expect(provider.execute(minimalRequest())).rejects.toThrow("requires E2B_API_KEY");
    await expect(readFile(resolve(projectRoot, ".env.example"), "utf8")).resolves.toBe(
      "E2B_API_KEY=\n",
    );
  });

  it("uploads only approved roots, verifies outbound denial, captures output, and kills finally", async () => {
    const factory = new FakeE2BFactory();
    const provider = new E2BSandboxProvider(factory, "base", () => true);
    const result = await provider.execute(minimalRequest());

    expect(factory.createOptions[0]).toMatchObject({
      template: "base",
      timeoutMs: e2bSandboxTimeoutMs,
      allowInternetAccess: false,
      secure: true,
      lifecycle: { onTimeout: "kill", autoResume: false },
      network: { denyOut: ["0.0.0.0/0"], allowPublicTraffic: false },
    });
    expect(factory.uploadedPaths[0]).toEqual([
      "/home/user/workspace/src/report.js",
      "/home/user/artifacts/plan.md",
    ]);
    expect(result.provider).toBe("E2B");
    expect(result.networkMode).toBe("deny-all-verified");
    expect(result.commands[0]?.stdout).toBe("synthetic command passed");
    expect(result.providerMetadata.remoteChangedFiles).toEqual([]);
    expect(result.providerMetadata.cleanupVerified).toBe(true);
    expect(factory.killedIds).toEqual(["e2b-fake-1"]);
    expect(provider.activeSandboxIds()).toEqual([]);
  });

  it("rejects uploads outside the synthetic workspace and approved artifact roots", async () => {
    const factory = new FakeE2BFactory();
    const provider = new E2BSandboxProvider(factory, "base", () => true);
    await expect(provider.execute(minimalRequest("../private.txt"))).rejects.toThrow(
      "unsafe upload path",
    );
    expect(factory.createOptions).toEqual([]);
  });

  it("refuses network-isolation evidence when the outbound probe is not blocked", async () => {
    const factory = new FakeE2BFactory([], 42);
    const provider = new E2BSandboxProvider(factory, "base", () => true);
    await expect(provider.execute(minimalRequest())).rejects.toThrow(
      "outbound-denial probe returned unexpectedly",
    );
    expect(factory.killedIds).toEqual(["e2b-fake-1"]);
    expect(provider.activeSandboxIds()).toEqual([]);
  });

  it("rejects upload classification and hash mismatches before creating a sandbox", async () => {
    const factory = new FakeE2BFactory();
    const provider = new E2BSandboxProvider(factory, "base", () => true);
    const request = minimalRequest();
    const first = request.uploads[0];
    if (!first) throw new Error("Expected a synthetic upload fixture.");
    await expect(
      provider.execute({
        ...request,
        uploads: [
          { ...first, classification: "APPROVED_GENERATED_ARTIFACT" },
          ...request.uploads.slice(1),
        ],
      }),
    ).rejects.toThrow("upload classification");
    await expect(
      provider.execute({
        ...request,
        uploads: [{ ...first, sha256: "0".repeat(64) }, ...request.uploads.slice(1)],
      }),
    ).rejects.toThrow("upload hash mismatch");
    expect(factory.createOptions).toEqual([]);
  });

  it("discovers and kills tagged orphan sandboxes during cleanup", async () => {
    const factory = new FakeE2BFactory(["e2b-orphan-1"]);
    const provider = new E2BSandboxProvider(factory, "base", () => true);
    await expect(provider.cleanup("sandbox-interrupted")).resolves.toEqual(["e2b-orphan-1:killed"]);
    expect(factory.listedRunIds).toEqual(["sandbox-interrupted"]);
    expect(factory.killedIds).toEqual(["e2b-orphan-1"]);
  });

  it("normalizes fake E2B execution into trace-bound schema v3 evidence", async () => {
    const factory = new FakeE2BFactory();
    const provider = new E2BSandboxProvider(factory, "base", () => true);
    const pack = await runSandboxSlice({
      projectRoot,
      provider,
      writeEvidence: false,
      fixedRun: { id: "sandbox-e2b-evidence", createdAt: "2026-07-17T16:00:00.000Z" },
    });
    expect(pack.schemaVersion).toBe(3);
    expect(pack.tools.provider).toBe("E2B");
    expect(pack.run.status).toBe("SUCCEEDED");
    expect(pack.prePatchExecution.provider).toBe("E2B");
    expect(pack.postPatchExecution.provider).toBe("E2B");
    expect((await validateEvidencePack(pack)).valid).toBe(true);
    expect(factory.killedIds).toEqual(["e2b-fake-1", "e2b-fake-2"]);
  });
});
