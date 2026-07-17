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
import type {
  SandboxAvailability,
  SandboxExecutionResult,
  SandboxLimits,
  SandboxProvider,
  SandboxUpload,
} from "./contracts";
import {
  accountingBudgetUsage,
  BudgetStopError,
  createExecutionBudget,
  ExecutionBudgetTracker,
  ProviderNeutralUsageAccountant,
  type ExecutionBudget,
} from "./budgets";
import {
  createEvidenceDigest,
  createBudgetStopEvidenceDigest,
  budgetStopEvidenceSchema,
  BudgetStopEvidenceError,
  sandboxEvidenceV3Schema,
  validateEvidencePack,
  writeEvidencePack,
  writeBudgetStopEvidence,
  type SandboxEvidencePack,
} from "./evidence";
import {
  applyControlledReplacement,
  assertNoSymlinks,
  changedFiles,
  sha256Bytes,
  snapshotRepository,
} from "./security";
import { DeliveryTelemetry, type TraceArtifactOutput } from "./telemetry";

const execFileAsync = promisify(execFile);
const EVIDENCE_OUTPUT_LIMIT_BYTES = 2 * 1024 * 1024;
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
  readonly executionBudget?: ExecutionBudget;
  readonly monotonicNow?: () => number;
  readonly onTraceCreated?: (trace: TraceArtifactOutput) => void;
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

function requiredApprovalPolicyReference(id: string) {
  const policy = registrySnapshot.approvalPolicies.find((candidate) => candidate.id === id);
  if (!policy || !policy.enabled) throw new Error(`Enabled approval policy missing: ${id}`);
  return { id: policy.id, version: policy.version, contentHash: policy.contentHash };
}

function traceArtifactName(runId: string): string {
  return `sandbox-trace-${runId.replace(/^sandbox-/, "")}.json`;
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

function sandboxUploads(
  files: readonly { readonly path: string; readonly sha256: string; readonly content: string }[],
  artifacts: readonly ReturnType<typeof artifact>[],
): readonly SandboxUpload[] {
  return [
    ...files.map((file) => ({
      path: `workspace/${file.path}`,
      content: file.content,
      sha256: file.sha256,
      classification: "SYNTHETIC_TOY_REPOSITORY" as const,
    })),
    ...artifacts.map((item) => ({
      path: item.path,
      content: item.content,
      sha256: item.sha256,
      classification: "APPROVED_GENERATED_ARTIFACT" as const,
    })),
  ].sort((left, right) => left.path.localeCompare(right.path));
}

function providerTools(
  availability: SandboxAvailability,
  prePatchExecution: SandboxExecutionResult,
  postPatchExecution: SandboxExecutionResult,
  containerNodeVersion: string,
  containerNpmVersion: string,
  hostGitVersion: string,
): SandboxEvidencePack["tools"] {
  if (availability.provider === "LOCAL_DOCKER") {
    if (
      !availability.dockerClientVersion ||
      !availability.dockerServerVersion ||
      !availability.imageDigest ||
      prePatchExecution.provider !== "LOCAL_DOCKER" ||
      postPatchExecution.provider !== "LOCAL_DOCKER"
    ) {
      throw new Error("Local Docker availability and execution metadata are incomplete.");
    }
    return {
      provider: "LOCAL_DOCKER",
      dockerClientVersion: availability.dockerClientVersion,
      dockerServerVersion: availability.dockerServerVersion,
      image: availability.image,
      imageDigest: availability.imageDigest,
      containerNodeVersion,
      containerNpmVersion,
      hostGitVersion,
    };
  }
  if (prePatchExecution.provider !== "E2B" || postPatchExecution.provider !== "E2B") {
    throw new Error("E2B availability and execution metadata are inconsistent.");
  }
  const executions = [prePatchExecution, postPatchExecution];
  return {
    provider: "E2B",
    sdkVersion: availability.sdkVersion,
    template: availability.template,
    templateIds: [...new Set(executions.map((item) => item.providerMetadata.templateId))].sort(),
    envdVersions: [...new Set(executions.map((item) => item.providerMetadata.envdVersion))].sort(),
    sandboxIds: executions.map((item) => item.providerMetadata.sandboxId).sort(),
    sandboxTimeoutMs: Math.max(...executions.map((item) => item.providerMetadata.sandboxTimeoutMs)),
    allowInternetAccess: false,
    networkVerification: "OUTBOUND_PROBE_BLOCKED",
    containerNodeVersion,
    containerNpmVersion,
    hostGitVersion,
  };
}

function evidenceExecution(
  execution: SandboxExecutionResult,
): SandboxEvidencePack["prePatchExecution"] {
  const commands = execution.commands.map((command) => ({
    ...command,
    argv: [...command.argv],
  }));
  if (execution.provider === "LOCAL_DOCKER") {
    return { ...execution, commands, cleanupAttempts: [...execution.cleanupAttempts] };
  }
  return {
    ...execution,
    commands,
    cleanupAttempts: [...execution.cleanupAttempts],
    providerMetadata: {
      ...execution.providerMetadata,
      remoteChangedFiles: [...execution.providerMetadata.remoteChangedFiles],
    },
  };
}

function evidenceBoundary(
  prePatchExecution: SandboxExecutionResult,
  postPatchExecution: SandboxExecutionResult,
): SandboxEvidencePack["boundary"] {
  const common = {
    invocation: "EXPLICIT_LOCAL_DEVELOPER_COMMAND" as const,
    websiteExecutesCode: false as const,
    visitorInputAccepted: false as const,
    patchSource: "REPOSITORY_OWNED_DETERMINISTIC_FIXTURE" as const,
    networkDuringExecution: false as const,
    workspaceDisposable: true as const,
  };
  if (
    prePatchExecution.provider === "LOCAL_DOCKER" &&
    postPatchExecution.provider === "LOCAL_DOCKER"
  ) {
    return {
      ...common,
      limits: {
        commandTimeoutMs: DEFAULT_LIMITS.timeoutMs,
        outputLimitBytes: EVIDENCE_OUTPUT_LIMIT_BYTES,
        provider: {
          kind: "LOCAL_DOCKER",
          cpuCount: DEFAULT_LIMITS.cpuCount,
          memoryMb: DEFAULT_LIMITS.memoryMb,
          processLimit: DEFAULT_LIMITS.processLimit,
          tmpfsMb: DEFAULT_LIMITS.tmpfsMb,
          basis: "DOCKER_RUN_FLAGS",
        },
      },
    };
  }
  if (prePatchExecution.provider === "E2B" && postPatchExecution.provider === "E2B") {
    return {
      ...common,
      limits: {
        commandTimeoutMs: DEFAULT_LIMITS.timeoutMs,
        outputLimitBytes: EVIDENCE_OUTPUT_LIMIT_BYTES,
        provider: {
          kind: "E2B",
          cpuCount: Math.min(
            prePatchExecution.providerMetadata.cpuCount,
            postPatchExecution.providerMetadata.cpuCount,
          ),
          memoryMb: Math.min(
            prePatchExecution.providerMetadata.memoryMb,
            postPatchExecution.providerMetadata.memoryMb,
          ),
          processLimit: null,
          tmpfsMb: null,
          sandboxTimeoutMs: Math.min(
            prePatchExecution.providerMetadata.sandboxTimeoutMs,
            postPatchExecution.providerMetadata.sandboxTimeoutMs,
          ),
          basis: "E2B_SANDBOX_INFO_AND_LIFECYCLE",
          limitation:
            "The provider reports sandbox CPU and memory. This implementation does not configure or claim an E2B process limit, tmpfs limit, or read-only root filesystem.",
        },
      },
    };
  }
  throw new Error("Sandbox execution providers changed during one run.");
}

function receiptEndTime(receipt: SandboxExecutionResult["commands"][number]): Date {
  return new Date(new Date(receipt.startedAt).getTime() + receipt.durationMs);
}

async function tracedSandboxExecution(options: {
  readonly provider: SandboxProvider;
  readonly request: Parameters<SandboxProvider["execute"]>[0];
  readonly telemetry: DeliveryTelemetry;
  readonly stageSpan: import("@opentelemetry/api").Span;
  readonly tracker: ExecutionBudgetTracker;
  readonly validationTool: ReturnType<typeof requiredRegistryReference>;
  readonly expectedFailureCommand: "pre-test" | null;
}): Promise<SandboxExecutionResult> {
  options.tracker.beforeToolCall();
  const toolSpan = options.telemetry.startSpan("tool.call", options.stageSpan, {
    "delivery.stage": "implement",
    "delivery.tool.id": options.validationTool.id,
    "delivery.tool.version": options.validationTool.version,
    "delivery.tool.hash": options.validationTool.contentHash,
    "delivery.tool.call_number": options.tracker
      .snapshot()
      .dimensions.find((item) => item.dimension === "TOOL_CALLS")?.observed,
    "delivery.outcome": "RUNNING",
  });
  const sandboxSpan = options.telemetry.startSpan("sandbox.execute", toolSpan, {
    "delivery.stage": "implement",
    "delivery.sandbox.provider": options.provider.kind,
    "delivery.sandbox.phase": options.request.phase,
    "delivery.outcome": "RUNNING",
  });
  try {
    const execution = await options.provider.execute(options.request);
    let failed = false;
    for (const receipt of execution.commands) {
      const expectedFailure = receipt.id === options.expectedFailureCommand;
      const commandFailed = receipt.exitCode !== 0 || receipt.timedOut || receipt.outputTruncated;
      failed ||= commandFailed && !expectedFailure;
      const commandSpan = options.telemetry.startSpan(
        "validation.command",
        sandboxSpan,
        {
          "delivery.stage": "implement",
          "delivery.command.category": receipt.id,
          "delivery.sandbox.provider": execution.provider,
          "delivery.validation.status": expectedFailure
            ? "EXPECTED_FAILURE"
            : commandFailed
              ? "FAILED"
              : "PASSED",
          "delivery.duration_ms": receipt.durationMs,
          "delivery.outcome": expectedFailure
            ? "EXPECTED_FAILURE"
            : commandFailed
              ? "FAILED"
              : "SUCCEEDED",
        },
        new Date(receipt.startedAt),
      );
      if (commandFailed && !expectedFailure) {
        options.telemetry.fail(
          commandSpan,
          receipt.timedOut ? "COMMAND_TIMEOUT" : "COMMAND_NONZERO_EXIT",
          receiptEndTime(receipt),
        );
      } else {
        options.telemetry.succeed(commandSpan, {}, receiptEndTime(receipt));
      }
    }
    if (failed) {
      options.telemetry.fail(sandboxSpan, "VALIDATION_COMMAND_FAILED");
      options.telemetry.fail(toolSpan, "VALIDATION_COMMAND_FAILED");
    } else {
      options.telemetry.succeed(sandboxSpan, {
        "delivery.outcome": "SUCCEEDED",
        "delivery.validation.command_count": execution.commands.length,
      });
      options.telemetry.succeed(toolSpan, { "delivery.outcome": "SUCCEEDED" });
    }
    options.tracker.checkTime();
    return execution;
  } catch (error) {
    if (sandboxSpan.isRecording()) options.telemetry.fail(sandboxSpan, "SANDBOX_EXECUTION_ERROR");
    if (toolSpan.isRecording()) options.telemetry.fail(toolSpan, "SANDBOX_EXECUTION_ERROR");
    throw error;
  }
}

export async function runSandboxSlice(options: RunSandboxOptions): Promise<SandboxEvidencePack> {
  const scenario = options.scenario ?? "successful-validation";
  const run = createRunIdentity(options.fixedRun);
  if (!/^sandbox-[a-z0-9-]+$/.test(run.id)) throw new Error("Internal sandbox run ID is invalid.");
  const agentCard = requiredRegistryReference("agent.implementation", "agent");
  const patchTool = requiredRegistryReference("tool.repository.patch.controlled", "tool");
  const validationTool = requiredRegistryReference("tool.sandbox.command", "tool");
  const approvalPolicy = requiredApprovalPolicyReference("policy.write.approved-targets");
  const executionBudget = options.executionBudget ?? createExecutionBudget();
  const telemetry = new DeliveryTelemetry("1.0.0");
  const runSpan = telemetry.startSpan("delivery.run", null, {
    "delivery.run.id": run.id,
    "delivery.issue.id": "TOY-101",
    "delivery.stage": "implement",
    "delivery.agent.id": agentCard.id,
    "delivery.agent.version": agentCard.version,
    "delivery.agent.hash": agentCard.contentHash,
    "delivery.approval.policy.id": approvalPolicy.id,
    "delivery.approval.policy.hash": approvalPolicy.contentHash,
    "delivery.budget.policy.id": executionBudget.id,
    "delivery.budget.policy.version": executionBudget.version,
    "delivery.budget.policy.hash": executionBudget.contentHash,
    "delivery.sandbox.provider": options.provider.kind,
    "delivery.outcome": "RUNNING",
  });
  const stageSpan = telemetry.startSpan("delivery.stage", runSpan, {
    "delivery.run.id": run.id,
    "delivery.issue.id": "TOY-101",
    "delivery.stage": "implement",
    "delivery.agent.id": agentCard.id,
    "delivery.agent.version": agentCard.version,
    "delivery.agent.hash": agentCard.contentHash,
    "delivery.outcome": "RUNNING",
  });
  const tracker = new ExecutionBudgetTracker(executionBudget, options.monotonicNow, (event) =>
    telemetry.budgetEvent(stageSpan, event),
  );
  const accountant = new ProviderNeutralUsageAccountant();
  const provenance = await projectProvenance(options.projectRoot);
  runSpan.setAttributes({
    "delivery.source.commit": provenance.sourceCommit,
    "delivery.source.tree_digest": provenance.sourceTreeDigest,
  });
  const availability = await options.provider.prepare();
  if (!availability.available || availability.provider !== options.provider.kind)
    throw new Error(`${options.provider.kind} sandbox unavailable: ${availability.detail}`);

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
  let unifiedDiff: string | undefined;
  let changes: ReturnType<typeof changedFiles> | undefined;
  let artifacts: ReturnType<typeof artifact>[] | undefined;
  let issueContent: string | undefined;
  let changeTargetsContent: string | undefined;
  let contextPack: Awaited<ReturnType<typeof buildContextPack>> | undefined;
  let approvalWaitDurationMs: number | undefined;
  let earlyBudgetStop: BudgetStopError | undefined;

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
    const agentSpan = telemetry.startSpan("agent.invoke", stageSpan, {
      "delivery.run.id": run.id,
      "delivery.issue.id": issue.id,
      "delivery.stage": "implement",
      "delivery.agent.id": agentCard.id,
      "delivery.agent.version": agentCard.version,
      "delivery.agent.hash": agentCard.contentHash,
      "delivery.model.policy.id": "model.policy.delivery-balanced",
      "delivery.model.used": false,
      "delivery.outcome": "RUNNING",
    });
    contextPack = await buildContextPack("synthetic-toy-repository", "implement", {
      runId: run.id,
      createdAt: run.createdAt,
    });
    const spec = `# Deterministic specification\n\nIssue: ${issue.id} — ${issue.summary}\n\n${issue.acceptanceCriteria.map((criterion) => `- ${criterion}`).join("\n")}\n`;
    const plan = `# Deterministic plan\n\n1. Run the checked-in synthetic tests and record the expected failure.\n2. Replace one exact source fragment in \`${changeTargets.paths[0]}\`.\n3. Reject any changed path outside the approved target.\n4. Run the fixed build and test commands in a provider-isolated sandbox with verified outbound denial.\n`;
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
    telemetry.succeed(agentSpan, {
      "delivery.context.pack_digest": contextPack.packDigest,
      "delivery.artifact.count": artifacts.length,
      "delivery.model.call_count": 0,
      "delivery.model.input_tokens": 0,
      "delivery.model.output_tokens": 0,
      "delivery.model.cost_usd": 0,
      "delivery.model.accounting_basis": "EXACT_ZERO_NO_MODEL",
      "delivery.outcome": "SUCCEEDED",
    });
    runSpan.setAttribute("delivery.context.pack_digest", contextPack.packDigest);
    stageSpan.setAttribute("delivery.context.pack_digest", contextPack.packDigest);
    repositoryBefore = await snapshotRepository(repositoryRoot);
    prePatchExecution = await tracedSandboxExecution({
      provider: options.provider,
      telemetry,
      stageSpan,
      tracker,
      validationTool,
      expectedFailureCommand: "pre-test",
      request: {
        runId: run.id,
        phase: "before-patch",
        workspaceRoot: repositoryRoot,
        uploads: sandboxUploads(repositoryBefore, artifacts),
        limits: DEFAULT_LIMITS,
        commands: [
          { id: "tool-versions", argv: ["node", "--version"] },
          { id: "pre-test", argv: ["node", "--test"] },
        ],
      },
    });
    const preTest = prePatchExecution.commands.find((command) => command.id === "pre-test");
    if (!preTest || preTest.exitCode === 0 || preTest.timedOut) {
      throw new Error("The synthetic baseline must fail its test before the controlled patch.");
    }
    const replacement =
      scenario === "successful-validation" ? SUCCESSFUL_REPLACEMENT : FAILED_REPLACEMENT;
    const approvalStarted = performance.now();
    const approvalRequestId = `approval.${run.id}.checked-in-change-target`;
    const approvalSpan = telemetry.startSpan("approval.wait", stageSpan, {
      "delivery.run.id": run.id,
      "delivery.issue.id": issue.id,
      "delivery.stage": "implement",
      "delivery.approval.request_id": approvalRequestId,
      "delivery.approval.policy.id": approvalPolicy.id,
      "delivery.approval.policy.hash": approvalPolicy.contentHash,
      "delivery.approval.outcome": "PREAPPROVED_SYNTHETIC_FIXTURE",
      "delivery.outcome": "SUCCEEDED",
    });
    telemetry.succeed(approvalSpan);
    approvalWaitDurationMs = Number((performance.now() - approvalStarted).toFixed(3));
    tracker.beforeRepairAttempt();
    tracker.beforeToolCall();
    const patchSpan = telemetry.startSpan("tool.call", stageSpan, {
      "delivery.run.id": run.id,
      "delivery.issue.id": issue.id,
      "delivery.stage": "implement",
      "delivery.tool.id": patchTool.id,
      "delivery.tool.version": patchTool.version,
      "delivery.tool.hash": patchTool.contentHash,
      "delivery.command.category": "controlled-patch",
      "delivery.repair.attempt": 1,
      "delivery.outcome": "RUNNING",
    });
    try {
      await applyControlledReplacement({
        root: repositoryRoot,
        path: approvedPath,
        allowedPaths: changeTargets.paths,
        expected: EXPECTED_SOURCE,
        replacement,
      });
      telemetry.succeed(patchSpan, {
        "delivery.changed_file_count": 1,
        "delivery.outcome": "SUCCEEDED",
      });
    } catch (error) {
      telemetry.fail(patchSpan, "CONTROLLED_PATCH_FAILED");
      throw error;
    }
    tracker.checkTime();
    await assertNoSymlinks(repositoryRoot);
    repositoryAfter = await snapshotRepository(repositoryRoot);
    changes = changedFiles(repositoryBefore, repositoryAfter, changeTargets.paths);
    unifiedDiff = await git(repositoryRoot, ["diff", "--no-ext-diff", "--", approvedPath]);
    if (unifiedDiff.length === 0) throw new Error("Controlled patch produced no Git diff.");
    postPatchExecution = await tracedSandboxExecution({
      provider: options.provider,
      telemetry,
      stageSpan,
      tracker,
      validationTool,
      expectedFailureCommand: null,
      request: {
        runId: run.id,
        phase: "after-patch",
        workspaceRoot: repositoryRoot,
        uploads: sandboxUploads(repositoryAfter, artifacts),
        limits: DEFAULT_LIMITS,
        commands: [
          { id: "build", argv: ["node", "--check", "src/report.js"] },
          { id: "test", argv: ["node", "--test"] },
        ],
      },
    });
  } catch (error) {
    if (error instanceof BudgetStopError) earlyBudgetStop = error;
    else throw error;
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

  if (!temporaryWorkspaceRemoved) throw new Error("Temporary sandbox workspace cleanup failed.");

  if (earlyBudgetStop) {
    if (!repositoryBefore || !contextPack) {
      throw new Error("A budget stop occurred before governance evidence could be assembled.");
    }
    const budget = tracker.snapshot(earlyBudgetStop.dimension);
    const evidenceSpan = telemetry.startSpan("evidence.finalize", stageSpan, {
      "delivery.run.id": run.id,
      "delivery.issue.id": "TOY-101",
      "delivery.stage": "implement",
      "delivery.budget.outcome": "STOPPED",
      "delivery.outcome": "SUCCEEDED",
    });
    telemetry.succeed(evidenceSpan);
    telemetry.fail(stageSpan, "BUDGET_STOP");
    telemetry.fail(runSpan, "BUDGET_STOP");
    const stoppedAt = new Date().toISOString();
    const testedTree = repositoryAfter ?? repositoryBefore;
    const trace = await telemetry.artifact(
      stoppedAt,
      {
        runId: run.id,
        issueId: "TOY-101",
        sourceCommit: provenance.sourceCommit,
        sourceTreeDigest: provenance.sourceTreeDigest,
        testedRepositoryTreeDigest: await treeDigest(testedTree),
        contextPackDigest: contextPack.packDigest,
        agentCardHash: agentCard.contentHash,
        approvalPolicyHash: approvalPolicy.contentHash,
        budgetPolicyHash: executionBudget.contentHash,
      },
      runSpan.spanContext().traceId,
    );
    options.onTraceCreated?.(trace);
    const withoutDigest = {
      schemaVersion: 1 as const,
      classification: "RECORDED_REAL_SANDBOX_BUDGET_STOP_EVIDENCE" as const,
      run: {
        id: run.id,
        issueId: "TOY-101" as const,
        stage: "implement" as const,
        createdAt: run.createdAt,
        stoppedAt,
        sourceCommit: provenance.sourceCommit,
        sourceTreeDigest: provenance.sourceTreeDigest,
        status: "FAILED" as const,
      },
      governance: {
        agentCard,
        approvalPolicy,
        contextPackDigest: contextPack.packDigest,
        executionBudget,
      },
      stop: {
        dimension: earlyBudgetStop.dimension,
        action: earlyBudgetStop.action,
        result: budget,
      },
      trace: {
        traceId: trace.artifact.traceId,
        artifact: traceArtifactName(run.id),
        artifactSha256: trace.sha256,
      },
      cleanup: {
        providerCleanupAttempted: true as const,
        temporaryWorkspaceRemoved: true as const,
        providerAttempts: [
          ...(prePatchExecution?.cleanupAttempts ?? []),
          ...(postPatchExecution?.cleanupAttempts ?? []),
          ...providerCleanupAttempts,
        ],
      },
    };
    const stopEvidence = budgetStopEvidenceSchema.parse({
      ...withoutDigest,
      evidenceDigest: await createBudgetStopEvidenceDigest(withoutDigest),
    });
    if (options.writeEvidence !== false) {
      await writeBudgetStopEvidence(options.projectRoot, stopEvidence, trace.json);
    }
    throw new BudgetStopEvidenceError(stopEvidence, trace.artifact);
  }

  if (
    !prePatchExecution ||
    !postPatchExecution ||
    !repositoryBefore ||
    !repositoryAfter ||
    !changes ||
    !contextPack ||
    !issueContent ||
    !changeTargetsContent ||
    !artifacts ||
    !unifiedDiff ||
    approvalWaitDurationMs === undefined
  ) {
    throw new Error("Sandbox run ended before complete evidence could be assembled.");
  }
  let finalStatus: "SUCCEEDED" | "FAILED" = executionPassed(postPatchExecution, ["build", "test"])
    ? "SUCCEEDED"
    : "FAILED";
  const accounting = accountant.snapshot();
  let budgetStopReason: import("./budgets").BudgetDimension | null = null;
  try {
    tracker.setUsage(accountingBudgetUsage(accounting));
    tracker.checkTime();
  } catch (error) {
    if (!(error instanceof BudgetStopError)) throw error;
    budgetStopReason = error.dimension;
    finalStatus = "FAILED";
  }
  const budget = tracker.snapshot(budgetStopReason);
  const versions = prePatchExecution.commands.find((command) => command.id === "tool-versions");
  const containerNodeVersion = versions?.stdout.split("\n")[0] ?? "unavailable";
  const containerNpmVersion = "not-installed";
  const replacement =
    scenario === "successful-validation" ? SUCCESSFUL_REPLACEMENT : FAILED_REPLACEMENT;
  const evidenceSpan = telemetry.startSpan("evidence.finalize", stageSpan, {
    "delivery.run.id": run.id,
    "delivery.issue.id": "TOY-101",
    "delivery.stage": "implement",
    "delivery.changed_file_count": changes.length,
    "delivery.test.count": 2,
    "delivery.validation.status": finalStatus,
    "delivery.outcome": finalStatus,
  });
  telemetry.succeed(evidenceSpan, {
    "delivery.budget.outcome": budget.outcome,
    "delivery.tool.call_count": budget.dimensions.find((item) => item.dimension === "TOOL_CALLS")
      ?.observed,
    "delivery.repair.attempt_count": budget.dimensions.find(
      (item) => item.dimension === "REPAIR_ATTEMPTS",
    )?.observed,
  });
  if (finalStatus === "SUCCEEDED") {
    telemetry.succeed(stageSpan, { "delivery.outcome": "SUCCEEDED" });
    telemetry.succeed(runSpan, { "delivery.outcome": "SUCCEEDED" });
  } else {
    const errorType = budgetStopReason ? "BUDGET_STOP" : "VALIDATION_FAILED";
    telemetry.fail(stageSpan, errorType);
    telemetry.fail(runSpan, errorType);
  }
  const completedAt = new Date().toISOString();
  const trace = await telemetry.artifact(
    completedAt,
    {
      runId: run.id,
      issueId: "TOY-101",
      sourceCommit: provenance.sourceCommit,
      sourceTreeDigest: provenance.sourceTreeDigest,
      testedRepositoryTreeDigest: await treeDigest(repositoryAfter),
      contextPackDigest: contextPack.packDigest,
      agentCardHash: agentCard.contentHash,
      approvalPolicyHash: approvalPolicy.contentHash,
      budgetPolicyHash: executionBudget.contentHash,
    },
    runSpan.spanContext().traceId,
  );
  options.onTraceCreated?.(trace);
  const packWithoutDigest: Omit<SandboxEvidencePack, "evidenceDigest"> = {
    schemaVersion: 3,
    classification: "RECORDED_REAL_SANDBOX_EVIDENCE",
    disclosure:
      "Recorded evidence from an explicitly invoked developer command against repository-owned synthetic fixtures. The static public website does not execute code, accept patches, start sandboxes, or expose this runner as a service.",
    run: {
      id: run.id,
      scenario,
      createdAt: run.createdAt,
      completedAt,
      sourceCommit: provenance.sourceCommit,
      sourceWorkingTree: provenance.sourceWorkingTree,
      sourceTreeDigest: provenance.sourceTreeDigest,
      status: finalStatus,
    },
    boundary: evidenceBoundary(prePatchExecution, postPatchExecution),
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
      agentCard,
      patchTool,
      validationTool,
      approvalPolicy,
      executionBudget,
      approvedPaths: ["src/report.js"],
      contextPackDigest: contextPack.packDigest,
      contextPack,
    },
    artifacts,
    repositoryBefore: {
      treeDigest: await treeDigest(repositoryBefore),
      files: [...repositoryBefore],
    },
    prePatchExecution: evidenceExecution(prePatchExecution),
    change: {
      path: "src/report.js",
      expectedTextSha256: sha256Bytes(EXPECTED_SOURCE),
      replacementTextSha256: sha256Bytes(replacement),
      changedFiles: [...changes],
      unifiedDiff,
      unifiedDiffSha256: sha256Bytes(unifiedDiff),
    },
    repositoryAfter: { treeDigest: await treeDigest(repositoryAfter), files: [...repositoryAfter] },
    postPatchExecution: evidenceExecution(postPatchExecution),
    tools: providerTools(
      availability,
      prePatchExecution,
      postPatchExecution,
      containerNodeVersion,
      containerNpmVersion,
      provenance.hostGitVersion,
    ),
    cleanup: {
      providerCleanupAttempted: true,
      temporaryWorkspaceRemoved,
      providerAttempts: [
        ...prePatchExecution.cleanupAttempts,
        ...postPatchExecution.cleanupAttempts,
        ...providerCleanupAttempts,
      ],
    },
    observability: {
      trace: {
        schemaVersion: 1,
        format: "OTEL_COMPATIBLE_NORMALIZED_JSON",
        traceId: trace.artifact.traceId,
        artifact: traceArtifactName(run.id),
        artifactSha256: trace.sha256,
        spanCount: trace.artifact.spans.length,
      },
      budget,
      accounting,
      approval: {
        requestId: `approval.${run.id}.checked-in-change-target`,
        policyId: approvalPolicy.id,
        outcome: "PREAPPROVED_SYNTHETIC_FIXTURE",
        waitDurationMs: approvalWaitDurationMs,
        measurement: "MEASURED",
      },
    },
  };
  const pack = sandboxEvidenceV3Schema.parse({
    ...packWithoutDigest,
    evidenceDigest: await createEvidenceDigest(packWithoutDigest),
  });
  const validation = await validateEvidencePack(pack, trace.json);
  if (!validation.valid)
    throw new Error(`Generated evidence is invalid: ${validation.errors.join("; ")}`);
  if (options.writeEvidence !== false)
    await writeEvidencePack(options.projectRoot, pack, trace.json);
  return pack;
}
