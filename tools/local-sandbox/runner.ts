import { randomUUID } from "node:crypto";
import { execFile } from "node:child_process";
import { access, cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import { promisify } from "node:util";

import { z } from "zod";

import { buildContextPack } from "../../src/demo/context/runtime";
import { registrySnapshot } from "../../src/demo/control-plane/registry/generated";
import { sha256Hex } from "../../src/demo/control-plane/registry/canonical";
import { initializeToyRepository } from "../toy-repo-mcp/workspace";
import type { SandboxExecutionResult, SandboxLimits, SandboxProvider } from "./contracts";
import {
  createEvidenceDigest,
  sandboxEvidenceSchema,
  validateEvidencePack,
  writeEvidencePack,
  type SandboxEvidencePack,
} from "./evidence";
import {
  applyControlledReplacement,
  assertNoSymlinks,
  changedFiles,
  sha256Bytes,
  snapshotRepository,
} from "./security";

const execFileAsync = promisify(execFile);
const DEFAULT_LIMITS: SandboxLimits = {
  cpuCount: 0.5,
  memoryMb: 256,
  processLimit: 64,
  timeoutMs: 30_000,
  tmpfsMb: 16,
};

const issueSchema = z.object({
  schemaVersion: z.literal(1),
  classification: z.literal("SYNTHETIC_PUBLIC_FIXTURE"),
  id: z.literal("TOY-101"),
  summary: z.string().min(1),
  description: z.string().min(1),
  acceptanceCriteria: z.array(z.string()).length(2),
});

const changeTargetsSchema = z.object({
  schemaVersion: z.literal(1),
  classification: z.literal("SYNTHETIC_PUBLIC_FIXTURE"),
  issueId: z.literal("TOY-101"),
  status: z.literal("APPROVED"),
  paths: z.array(z.literal("src/report.js")).length(1),
  excludedPaths: z.array(z.string()).min(1),
  approval: z.object({
    kind: z.literal("CHECKED_IN_SYNTHETIC_REVIEW_FIXTURE"),
    reviewer: z.string(),
    reason: z.string(),
  }),
});

const EXPECTED_SOURCE = "  return `Variance: ${actual - budget}`;";
const SUCCESSFUL_REPLACEMENT = `  const difference = actual - budget;
  const direction = difference >= 0 ? "over" : "under";
  return \`Variance: \${Math.abs(difference)} \${direction}\`;`;
const FAILED_REPLACEMENT = `  const difference = actual - budget;
  return \`Variance: \${difference} over\`;`;

export type SandboxScenario = "successful-validation" | "failed-validation";

export type RunSandboxOptions = {
  readonly projectRoot: string;
  readonly provider: SandboxProvider;
  readonly scenario?: SandboxScenario;
  readonly writeEvidence?: boolean;
  readonly fixedRun?: { readonly id: string; readonly createdAt: string };
  readonly onWorkspaceCreated?: (path: string) => void;
};

function requiredRegistryReference(id: string, kind: "agent" | "tool") {
  const record =
    kind === "agent"
      ? registrySnapshot.agents.find((candidate) => candidate.id === id)
      : registrySnapshot.tools.find((candidate) => candidate.id === id);
  if (!record || record.status !== "APPROVED")
    throw new Error(`Approved registry record missing: ${id}`);
  return { id: record.id, version: record.version, contentHash: record.contentHash };
}

function createRunIdentity(fixed?: RunSandboxOptions["fixedRun"]): {
  id: string;
  createdAt: string;
} {
  if (fixed) return fixed;
  const createdAt = new Date().toISOString();
  const timestamp = createdAt
    .toLowerCase()
    .replace(/[^0-9a-z]/g, "")
    .slice(0, 15);
  return { id: `sandbox-${timestamp}-${randomUUID().slice(0, 8)}`, createdAt };
}

async function git(root: string, args: readonly string[]): Promise<string> {
  const result = await execFileAsync("git", [...args], { cwd: root, maxBuffer: 2 * 1024 * 1024 });
  return result.stdout.trimEnd();
}

async function projectProvenance(projectRoot: string): Promise<{
  readonly sourceCommit: string;
  readonly sourceWorkingTree: "CLEAN" | "MODIFIED";
  readonly sourceTreeDigest: string;
  readonly hostGitVersion: string;
}> {
  const sourceCommit = await git(projectRoot, ["rev-parse", "HEAD"]);
  const status = await git(projectRoot, ["status", "--porcelain=v1"]);
  const listed = await execFileAsync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { cwd: projectRoot, encoding: "buffer", maxBuffer: 16 * 1024 * 1024 },
  );
  const files = listed.stdout
    .toString("utf8")
    .split("\0")
    .filter((path) => path.length > 0 && !path.startsWith("evidence/generated/"))
    .sort();
  const fileHashes = await Promise.all(
    files.map(async (path) => ({
      path,
      sha256: await readFile(resolve(projectRoot, path))
        .then((content) => sha256Bytes(content))
        .catch(() => "DELETED"),
    })),
  );
  return {
    sourceCommit,
    sourceWorkingTree: status.length === 0 ? "CLEAN" : "MODIFIED",
    sourceTreeDigest: await sha256Hex(fileHashes),
    hostGitVersion: await git(projectRoot, ["--version"]),
  };
}

function artifact(
  name: "spec" | "plan" | "change-targets" | "context-pack",
  path: string,
  mimeType: string,
  content: string,
) {
  return { name, path, mimeType, sha256: sha256Bytes(content), content } as const;
}

function executionPassed(
  execution: SandboxExecutionResult,
  commandIds: readonly string[],
): boolean {
  return commandIds.every((id) => {
    const receipt = execution.commands.find((command) => command.id === id);
    return receipt?.exitCode === 0 && !receipt.timedOut && !receipt.outputTruncated;
  });
}

async function treeDigest(
  files: readonly { readonly path: string; readonly sha256: string }[],
): Promise<string> {
  return sha256Hex(files.map(({ path, sha256 }) => ({ path, sha256 })));
}

export async function runSandboxSlice(options: RunSandboxOptions): Promise<SandboxEvidencePack> {
  const scenario = options.scenario ?? "successful-validation";
  const run = createRunIdentity(options.fixedRun);
  if (!/^sandbox-[a-z0-9-]+$/.test(run.id)) throw new Error("Internal sandbox run ID is invalid.");
  const provenance = await projectProvenance(options.projectRoot);
  const availability = await options.provider.prepare();
  if (
    !availability.available ||
    !availability.imageDigest ||
    !availability.dockerClientVersion ||
    !availability.dockerServerVersion
  ) {
    throw new Error(`Local Docker sandbox unavailable: ${availability.detail}`);
  }

  const toyRoot = resolve(options.projectRoot, "examples/toy-repo");
  await assertNoSymlinks(toyRoot);
  const temporaryRoot = await mkdtemp(resolve(tmpdir(), "ai-delivery-workbench-sandbox-"));
  options.onWorkspaceCreated?.(temporaryRoot);
  const repositoryRoot = resolve(temporaryRoot, "repository");
  const artifactsRoot = resolve(temporaryRoot, "artifacts");
  let providerCleanupAttempts: readonly string[];
  let temporaryWorkspaceRemoved: boolean;
  let prePatchExecution: SandboxExecutionResult | undefined;
  let postPatchExecution: SandboxExecutionResult | undefined;
  let repositoryBefore: Awaited<ReturnType<typeof snapshotRepository>> | undefined;
  let repositoryAfter: Awaited<ReturnType<typeof snapshotRepository>> | undefined;
  let unifiedDiff: string;
  let changes: ReturnType<typeof changedFiles> | undefined;
  let artifacts: ReturnType<typeof artifact>[];
  let issueContent: string;
  let changeTargetsContent: string;
  let contextPack: Awaited<ReturnType<typeof buildContextPack>> | undefined;

  try {
    await cp(toyRoot, repositoryRoot, { recursive: true, errorOnExist: true });
    await assertNoSymlinks(repositoryRoot);
    await initializeToyRepository(repositoryRoot);
    if ((await git(repositoryRoot, ["status", "--porcelain=v1"])).length !== 0) {
      throw new Error("Disposable toy repository did not initialize to a clean Git baseline.");
    }
    issueContent = await readFile(resolve(repositoryRoot, "issue.synthetic.json"), "utf8");
    changeTargetsContent = await readFile(
      resolve(repositoryRoot, "approved/change-targets.json"),
      "utf8",
    );
    const issue = issueSchema.parse(JSON.parse(issueContent));
    const changeTargets = changeTargetsSchema.parse(JSON.parse(changeTargetsContent));
    const approvedPath = changeTargets.paths[0];
    if (!approvedPath) throw new Error("Synthetic change-target fixture has no approved path.");
    contextPack = await buildContextPack("synthetic-toy-repository", "implement", {
      runId: run.id,
      createdAt: run.createdAt,
    });
    const spec = `# Deterministic specification\n\nIssue: ${issue.id} — ${issue.summary}\n\n${issue.acceptanceCriteria.map((criterion) => `- ${criterion}`).join("\n")}\n`;
    const plan = `# Deterministic plan\n\n1. Run the checked-in synthetic tests and record the expected failure.\n2. Replace one exact source fragment in \`${changeTargets.paths[0]}\`.\n3. Reject any changed path outside the approved target.\n4. Run the fixed build and test commands in network-disabled containers.\n`;
    const targets = `${JSON.stringify({ ...changeTargets, source: "approved/change-targets.json", digest: await sha256Hex(changeTargets) }, null, 2)}\n`;
    const context = `${JSON.stringify(contextPack, null, 2)}\n`;
    artifacts = [
      artifact("spec", "artifacts/spec.md", "text/markdown", spec),
      artifact("plan", "artifacts/plan.md", "text/markdown", plan),
      artifact("change-targets", "artifacts/change-targets.json", "application/json", targets),
      artifact("context-pack", "artifacts/context-pack.json", "application/json", context),
    ];
    await mkdir(artifactsRoot, { recursive: true });
    await Promise.all(
      artifacts.map((item) => writeFile(resolve(temporaryRoot, item.path), item.content, "utf8")),
    );
    repositoryBefore = await snapshotRepository(repositoryRoot);
    prePatchExecution = await options.provider.execute({
      runId: run.id,
      phase: "before-patch",
      workspaceRoot: repositoryRoot,
      limits: DEFAULT_LIMITS,
      commands: [
        { id: "tool-versions", argv: ["sh", "-c", "node --version && npm --version"] },
        { id: "pre-test", argv: ["npm", "test", "--silent"] },
      ],
    });
    const preTest = prePatchExecution.commands.find((command) => command.id === "pre-test");
    if (!preTest || preTest.exitCode === 0 || preTest.timedOut) {
      throw new Error("The synthetic baseline must fail its test before the controlled patch.");
    }
    const replacement =
      scenario === "successful-validation" ? SUCCESSFUL_REPLACEMENT : FAILED_REPLACEMENT;
    await applyControlledReplacement({
      root: repositoryRoot,
      path: approvedPath,
      allowedPaths: changeTargets.paths,
      expected: EXPECTED_SOURCE,
      replacement,
    });
    await assertNoSymlinks(repositoryRoot);
    repositoryAfter = await snapshotRepository(repositoryRoot);
    changes = changedFiles(repositoryBefore, repositoryAfter, changeTargets.paths);
    unifiedDiff = await git(repositoryRoot, ["diff", "--no-ext-diff", "--", approvedPath]);
    if (unifiedDiff.length === 0) throw new Error("Controlled patch produced no Git diff.");
    postPatchExecution = await options.provider.execute({
      runId: run.id,
      phase: "after-patch",
      workspaceRoot: repositoryRoot,
      limits: DEFAULT_LIMITS,
      commands: [
        { id: "build", argv: ["npm", "run", "build", "--silent"] },
        { id: "test", argv: ["npm", "test", "--silent"] },
      ],
    });
  } finally {
    providerCleanupAttempts = await options.provider
      .cleanup(run.id)
      .catch((error: unknown) => [
        `provider-cleanup-error:${error instanceof Error ? error.message : "unknown"}`,
      ]);
    await rm(temporaryRoot, { recursive: true, force: true });
    temporaryWorkspaceRemoved = !(await access(temporaryRoot)
      .then(() => true)
      .catch(() => false));
  }

  if (
    !prePatchExecution ||
    !postPatchExecution ||
    !repositoryBefore ||
    !repositoryAfter ||
    !changes ||
    !contextPack
  ) {
    throw new Error("Sandbox run ended before complete evidence could be assembled.");
  }
  if (!temporaryWorkspaceRemoved) throw new Error("Temporary sandbox workspace cleanup failed.");
  const finalStatus = executionPassed(postPatchExecution, ["build", "test"])
    ? "SUCCEEDED"
    : "FAILED";
  const versions = prePatchExecution.commands.find((command) => command.id === "tool-versions");
  const [containerNodeVersion = "unavailable", containerNpmVersion = "unavailable"] =
    versions?.stdout.split("\n") ?? [];
  const replacement =
    scenario === "successful-validation" ? SUCCESSFUL_REPLACEMENT : FAILED_REPLACEMENT;
  const packWithoutDigest: Omit<SandboxEvidencePack, "evidenceDigest"> = {
    schemaVersion: 1,
    classification: "RECORDED_REAL_LOCAL_SANDBOX_EVIDENCE",
    disclosure:
      "Recorded evidence from an explicitly invoked local command against repository-owned synthetic fixtures. The static public website does not execute code, accept patches, start containers, or expose this runner as a service.",
    run: {
      id: run.id,
      scenario,
      createdAt: run.createdAt,
      completedAt: new Date().toISOString(),
      sourceCommit: provenance.sourceCommit,
      sourceWorkingTree: provenance.sourceWorkingTree,
      sourceTreeDigest: provenance.sourceTreeDigest,
      status: finalStatus,
    },
    boundary: {
      invocation: "EXPLICIT_LOCAL_DEVELOPER_COMMAND",
      websiteExecutesCode: false,
      visitorInputAccepted: false,
      patchSource: "REPOSITORY_OWNED_DETERMINISTIC_FIXTURE",
      networkDuringExecution: false,
      workspaceDisposable: true,
      limits: DEFAULT_LIMITS,
    },
    inputs: {
      toyRepositoryPath: "examples/toy-repo",
      issue: {
        path: "issue.synthetic.json",
        sha256: sha256Bytes(issueContent),
        content: issueContent,
      },
      approvedChangeTargets: {
        path: "approved/change-targets.json",
        sha256: sha256Bytes(changeTargetsContent),
        content: changeTargetsContent,
      },
    },
    governance: {
      stage: "implement",
      agentCard: requiredRegistryReference("agent.implementation", "agent"),
      patchTool: requiredRegistryReference("tool.repository.patch.controlled", "tool"),
      validationTool: requiredRegistryReference("tool.sandbox.command", "tool"),
      approvedPaths: ["src/report.js"],
      contextPackDigest: contextPack.packDigest,
      contextPack,
    },
    artifacts,
    repositoryBefore: {
      treeDigest: await treeDigest(repositoryBefore),
      files: [...repositoryBefore],
    },
    prePatchExecution: {
      ...prePatchExecution,
      commands: [...prePatchExecution.commands].map((command) => ({
        ...command,
        argv: [...command.argv],
      })),
      cleanupAttempts: [...prePatchExecution.cleanupAttempts],
    },
    change: {
      path: "src/report.js",
      expectedTextSha256: sha256Bytes(EXPECTED_SOURCE),
      replacementTextSha256: sha256Bytes(replacement),
      changedFiles: [...changes],
      unifiedDiff,
      unifiedDiffSha256: sha256Bytes(unifiedDiff),
    },
    repositoryAfter: { treeDigest: await treeDigest(repositoryAfter), files: [...repositoryAfter] },
    postPatchExecution: {
      ...postPatchExecution,
      commands: [...postPatchExecution.commands].map((command) => ({
        ...command,
        argv: [...command.argv],
      })),
      cleanupAttempts: [...postPatchExecution.cleanupAttempts],
    },
    tools: {
      dockerClientVersion: availability.dockerClientVersion,
      dockerServerVersion: availability.dockerServerVersion,
      image: availability.image,
      imageDigest: availability.imageDigest,
      containerNodeVersion,
      containerNpmVersion,
      hostGitVersion: provenance.hostGitVersion,
    },
    cleanup: {
      providerCleanupAttempted: true,
      temporaryWorkspaceRemoved,
      providerAttempts: [
        ...prePatchExecution.cleanupAttempts,
        ...postPatchExecution.cleanupAttempts,
        ...providerCleanupAttempts,
      ],
    },
  };
  const pack = sandboxEvidenceSchema.parse({
    ...packWithoutDigest,
    evidenceDigest: await createEvidenceDigest(packWithoutDigest),
  });
  const validation = await validateEvidencePack(pack);
  if (!validation.valid)
    throw new Error(`Generated evidence is invalid: ${validation.errors.join("; ")}`);
  if (options.writeEvidence !== false) await writeEvidencePack(options.projectRoot, pack);
  return pack;
}
