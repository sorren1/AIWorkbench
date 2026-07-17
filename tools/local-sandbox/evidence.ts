import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

import { z } from "zod";

import { canonicalJson, sha256Hex } from "../../src/demo/control-plane/registry/canonical";
import { validateContextPack } from "../../src/demo/control-plane/registry/validation";
import {
  BUDGET_ACTIONS,
  executionBudgetSchema,
  type BudgetResult,
  type RunAccounting,
} from "./budgets";
import { sha256Bytes } from "./security";
import {
  normalizedTraceArtifactSchema,
  TRACE_FORMAT,
  TRACE_SCHEMA_VERSION,
  validateNormalizedTraceArtifact,
  type NormalizedTraceArtifact,
} from "./telemetry";

const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
const localImageDigestSchema = z.string().regex(/^(?:[a-z0-9._/-]+@)?sha256:[a-f0-9]{64}$/);
const commandReceiptSchema = z.object({
  id: z.enum(["tool-versions", "pre-test", "build", "test"]),
  argv: z.array(z.string()).min(1),
  containerName: z.string().min(1),
  startedAt: z.iso.datetime(),
  durationMs: z.number().int().nonnegative(),
  exitCode: z.number().int().nullable(),
  timedOut: z.boolean(),
  stdout: z.string(),
  stderr: z.string(),
  stdoutSha256: hashSchema,
  stderrSha256: hashSchema,
  outputTruncated: z.boolean(),
});

const localDockerExecutionSchema = z.object({
  provider: z.literal("LOCAL_DOCKER"),
  image: z.string().min(1),
  imageDigest: localImageDigestSchema,
  networkMode: z.literal("none"),
  user: z.string().min(1),
  readOnlyRootFilesystem: z.literal(true),
  noNewPrivileges: z.literal(true),
  commands: z.array(commandReceiptSchema).min(1),
  cleanupAttempts: z.array(z.string()),
});

const e2bExecutionSchema = z.object({
  provider: z.literal("E2B"),
  image: z.string().min(1),
  imageDigest: z.null(),
  networkMode: z.literal("deny-all-verified"),
  user: z.string().min(1),
  readOnlyRootFilesystem: z.null(),
  noNewPrivileges: z.null(),
  commands: z.array(commandReceiptSchema).min(1),
  cleanupAttempts: z.array(z.string()),
  providerMetadata: z.object({
    sdkVersion: z.string().min(1),
    sandboxId: z.string().min(1),
    templateId: z.string().min(1),
    envdVersion: z.string().min(1),
    cpuCount: z.number().positive(),
    memoryMb: z.number().int().positive(),
    sandboxTimeoutMs: z.number().int().positive(),
    lifecycleOnTimeout: z.literal("kill"),
    allowInternetAccess: z.literal(false),
    networkVerification: z.literal("OUTBOUND_PROBE_BLOCKED"),
    uploadedFileCount: z.number().int().positive(),
    uploadedBytes: z.number().int().positive(),
    uploadedTreeDigest: hashSchema,
    remoteTreeDigest: hashSchema,
    remoteChangedFiles: z.array(z.string()).length(0),
    cleanupVerified: z.literal(true),
  }),
});

const fileSnapshotSchema = z.object({
  path: z.string().min(1),
  sha256: hashSchema,
  content: z.string(),
});

const evidenceArtifactSchema = z.object({
  name: z.enum(["spec", "plan", "change-targets", "context-pack"]),
  path: z.string().min(1),
  mimeType: z.string().min(1),
  sha256: hashSchema,
  content: z.string(),
});

const legacySandboxEvidenceSchema = z.object({
  schemaVersion: z.literal(1),
  classification: z.literal("RECORDED_REAL_LOCAL_SANDBOX_EVIDENCE"),
  disclosure: z.string().min(1),
  run: z.object({
    id: z.string().regex(/^sandbox-[a-z0-9-]+$/),
    scenario: z.enum(["successful-validation", "failed-validation"]),
    createdAt: z.iso.datetime(),
    completedAt: z.iso.datetime(),
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
    sourceWorkingTree: z.enum(["CLEAN", "MODIFIED"]),
    sourceTreeDigest: hashSchema,
    status: z.enum(["SUCCEEDED", "FAILED"]),
  }),
  boundary: z.object({
    invocation: z.literal("EXPLICIT_LOCAL_DEVELOPER_COMMAND"),
    websiteExecutesCode: z.literal(false),
    visitorInputAccepted: z.literal(false),
    patchSource: z.literal("REPOSITORY_OWNED_DETERMINISTIC_FIXTURE"),
    networkDuringExecution: z.literal(false),
    workspaceDisposable: z.literal(true),
    limits: z.object({
      cpuCount: z.number().positive(),
      memoryMb: z.number().int().positive(),
      processLimit: z.number().int().positive(),
      timeoutMs: z.number().int().positive(),
      tmpfsMb: z.number().int().positive(),
    }),
  }),
  inputs: z.object({
    toyRepositoryPath: z.literal("examples/toy-repo"),
    issue: z.object({
      path: z.literal("issue.synthetic.json"),
      sha256: hashSchema,
      content: z.string(),
    }),
    approvedChangeTargets: z.object({
      path: z.literal("approved/change-targets.json"),
      sha256: hashSchema,
      content: z.string(),
    }),
  }),
  governance: z.object({
    stage: z.literal("implement"),
    agentCard: z.object({ id: z.string(), version: z.string(), contentHash: hashSchema }),
    patchTool: z.object({ id: z.string(), version: z.string(), contentHash: hashSchema }),
    validationTool: z.object({ id: z.string(), version: z.string(), contentHash: hashSchema }),
    approvedPaths: z.array(z.string()).min(1),
    contextPackDigest: hashSchema,
    contextPack: z.record(z.string(), z.unknown()),
  }),
  artifacts: z.array(evidenceArtifactSchema).length(4),
  repositoryBefore: z.object({ treeDigest: hashSchema, files: z.array(fileSnapshotSchema).min(1) }),
  prePatchExecution: localDockerExecutionSchema,
  change: z.object({
    path: z.string().min(1),
    expectedTextSha256: hashSchema,
    replacementTextSha256: hashSchema,
    changedFiles: z
      .array(
        z.object({
          path: z.string().min(1),
          beforeSha256: hashSchema,
          afterSha256: hashSchema,
          beforeContent: z.string(),
          afterContent: z.string(),
        }),
      )
      .length(1),
    unifiedDiff: z.string().min(1),
    unifiedDiffSha256: hashSchema,
  }),
  repositoryAfter: z.object({ treeDigest: hashSchema, files: z.array(fileSnapshotSchema).min(1) }),
  postPatchExecution: localDockerExecutionSchema,
  tools: z.object({
    dockerClientVersion: z.string().min(1),
    dockerServerVersion: z.string().min(1),
    image: z.string().min(1),
    imageDigest: localImageDigestSchema,
    containerNodeVersion: z.string().min(1),
    containerNpmVersion: z.string().min(1),
    hostGitVersion: z.string().min(1),
  }),
  cleanup: z.object({
    providerCleanupAttempted: z.literal(true),
    temporaryWorkspaceRemoved: z.literal(true),
    providerAttempts: z.array(z.string()),
  }),
  evidenceDigest: hashSchema,
});

const localDockerToolsSchema = z.object({
  provider: z.literal("LOCAL_DOCKER"),
  dockerClientVersion: z.string().min(1),
  dockerServerVersion: z.string().min(1),
  image: z.string().min(1),
  imageDigest: localImageDigestSchema,
  containerNodeVersion: z.string().min(1),
  containerNpmVersion: z.string().min(1),
  hostGitVersion: z.string().min(1),
});

const e2bToolsSchema = z.object({
  provider: z.literal("E2B"),
  sdkVersion: z.string().min(1),
  template: z.string().min(1),
  templateIds: z.array(z.string().min(1)).min(1),
  envdVersions: z.array(z.string().min(1)).min(1),
  sandboxIds: z.array(z.string().min(1)).min(1),
  sandboxTimeoutMs: z.number().int().positive(),
  allowInternetAccess: z.literal(false),
  networkVerification: z.literal("OUTBOUND_PROBE_BLOCKED"),
  containerNodeVersion: z.string().min(1),
  containerNpmVersion: z.string().min(1),
  hostGitVersion: z.string().min(1),
});

export const sandboxEvidenceV2Schema = legacySandboxEvidenceSchema.extend({
  schemaVersion: z.literal(2),
  classification: z.literal("RECORDED_REAL_SANDBOX_EVIDENCE"),
  boundary: z.object({
    invocation: z.literal("EXPLICIT_LOCAL_DEVELOPER_COMMAND"),
    websiteExecutesCode: z.literal(false),
    visitorInputAccepted: z.literal(false),
    patchSource: z.literal("REPOSITORY_OWNED_DETERMINISTIC_FIXTURE"),
    networkDuringExecution: z.literal(false),
    workspaceDisposable: z.literal(true),
    limits: z.object({
      commandTimeoutMs: z.number().int().positive(),
      outputLimitBytes: z.number().int().positive(),
      provider: z.discriminatedUnion("kind", [
        z.object({
          kind: z.literal("LOCAL_DOCKER"),
          cpuCount: z.number().positive(),
          memoryMb: z.number().int().positive(),
          processLimit: z.number().int().positive(),
          tmpfsMb: z.number().int().positive(),
          basis: z.literal("DOCKER_RUN_FLAGS"),
        }),
        z.object({
          kind: z.literal("E2B"),
          cpuCount: z.number().positive(),
          memoryMb: z.number().int().positive(),
          processLimit: z.null(),
          tmpfsMb: z.null(),
          sandboxTimeoutMs: z.number().int().positive(),
          basis: z.literal("E2B_SANDBOX_INFO_AND_LIFECYCLE"),
          limitation: z.string().min(1),
        }),
      ]),
    }),
  }),
  prePatchExecution: z.union([localDockerExecutionSchema, e2bExecutionSchema]),
  postPatchExecution: z.union([localDockerExecutionSchema, e2bExecutionSchema]),
  tools: z.discriminatedUnion("provider", [localDockerToolsSchema, e2bToolsSchema]),
});

const budgetDimensionSchema = z.enum([
  "WALL_CLOCK_DURATION",
  "STAGE_DURATION",
  "TOOL_CALLS",
  "REPAIR_ATTEMPTS",
  "INPUT_TOKENS",
  "OUTPUT_TOKENS",
  "COST_USD",
]);

const budgetResultSchema: z.ZodType<BudgetResult> = z.object({
  schemaVersion: z.literal(1),
  policy: executionBudgetSchema,
  outcome: z.enum(["WITHIN_BUDGET", "WARNING", "STOPPED"]),
  stopReason: budgetDimensionSchema.nullable(),
  dimensions: z.array(
    z.object({
      dimension: budgetDimensionSchema,
      observed: z.number().nonnegative(),
      limit: z.number().nonnegative().nullable(),
      unit: z.enum(["MILLISECONDS", "COUNT", "TOKENS", "USD"]),
      measurement: z.enum(["MEASURED", "EXACT", "ACTUAL_PROVIDER_REPORTED", "ESTIMATED"]),
      status: z.enum(["WITHIN", "APPROACHING", "EXCEEDED"]),
    }),
  ),
  events: z.array(
    z.object({
      type: z.enum(["APPROACHING", "EXCEEDED"]),
      dimension: budgetDimensionSchema,
      observed: z.number().nonnegative(),
      limit: z.number().nonnegative(),
      action: z.enum(BUDGET_ACTIONS),
      elapsedMs: z.number().int().nonnegative(),
    }),
  ),
});

const usageMeasurementSchema = z.enum([
  "ACTUAL_PROVIDER_REPORTED",
  "ESTIMATED",
  "EXACT_ZERO_NO_MODEL",
]);

const runAccountingSchema: z.ZodType<RunAccounting> = z.object({
  schemaVersion: z.literal(1),
  records: z.array(
    z.object({
      stage: z.literal("implement"),
      modelPolicyId: z.string().min(1),
      modelIdentifier: z.string().min(1),
      inputTokens: z.number().int().nonnegative(),
      outputTokens: z.number().int().nonnegative(),
      costUsd: z.number().nonnegative(),
      tokenMeasurement: usageMeasurementSchema,
      costMeasurement: usageMeasurementSchema,
      pricingSource: z.object({
        id: z.string().min(1),
        version: z.string().min(1),
        effectiveAt: z.iso.datetime().nullable(),
      }),
    }),
  ),
  stages: z.array(
    z.object({
      stage: z.literal("implement"),
      modelCalls: z.number().int().nonnegative(),
      inputTokens: z.number().int().nonnegative(),
      outputTokens: z.number().int().nonnegative(),
      costUsd: z.number().nonnegative(),
      tokenMeasurement: usageMeasurementSchema,
      costMeasurement: usageMeasurementSchema,
    }),
  ),
  total: z.object({
    modelCalls: z.number().int().nonnegative(),
    inputTokens: z.number().int().nonnegative(),
    outputTokens: z.number().int().nonnegative(),
    costUsd: z.number().nonnegative(),
    tokenMeasurement: usageMeasurementSchema,
    costMeasurement: usageMeasurementSchema,
  }),
});

export const sandboxEvidenceV3Schema = sandboxEvidenceV2Schema.extend({
  schemaVersion: z.literal(3),
  governance: sandboxEvidenceV2Schema.shape.governance.extend({
    approvalPolicy: z.object({ id: z.string(), version: z.string(), contentHash: hashSchema }),
    executionBudget: executionBudgetSchema,
  }),
  observability: z.object({
    trace: z.object({
      schemaVersion: z.literal(TRACE_SCHEMA_VERSION),
      format: z.literal(TRACE_FORMAT),
      traceId: z.string().regex(/^[a-f0-9]{32}$/),
      artifact: z.string().regex(/^sandbox-trace-[a-z0-9-]+\.json$/),
      artifactSha256: hashSchema,
      spanCount: z.number().int().positive(),
    }),
    budget: budgetResultSchema,
    accounting: runAccountingSchema,
    approval: z.object({
      requestId: z.string().min(1),
      policyId: z.string().min(1),
      outcome: z.literal("PREAPPROVED_SYNTHETIC_FIXTURE"),
      waitDurationMs: z.number().nonnegative(),
      measurement: z.literal("MEASURED"),
    }),
  }),
});

export const sandboxEvidenceSchema = z.union([
  legacySandboxEvidenceSchema,
  sandboxEvidenceV2Schema,
  sandboxEvidenceV3Schema,
]);

export type SandboxEvidencePack = z.infer<typeof sandboxEvidenceV3Schema>;
export type ValidatedSandboxEvidencePack = z.infer<typeof sandboxEvidenceSchema>;

const legacyEvidenceIndexSchema = z.object({
  schemaVersion: z.literal(1),
  latest: z.object({
    json: z.string().regex(/^sandbox-run-[a-z0-9-]+\.json$/),
    markdown: z.string().regex(/^sandbox-run-[a-z0-9-]+\.md$/),
    evidenceDigest: hashSchema,
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
    status: z.literal("SUCCEEDED"),
  }),
});

export const evidenceIndexSchema = z.union([
  legacyEvidenceIndexSchema,
  legacyEvidenceIndexSchema.extend({
    schemaVersion: z.literal(2),
    latest: legacyEvidenceIndexSchema.shape.latest.extend({
      trace: z.string().regex(/^sandbox-trace-[a-z0-9-]+\.json$/),
      traceId: z.string().regex(/^[a-f0-9]{32}$/),
      traceArtifactSha256: hashSchema,
    }),
  }),
]);

export type EvidenceIndex = z.infer<typeof evidenceIndexSchema>;

export const budgetStopEvidenceSchema = z.object({
  schemaVersion: z.literal(1),
  classification: z.literal("RECORDED_REAL_SANDBOX_BUDGET_STOP_EVIDENCE"),
  run: z.object({
    id: z.string().regex(/^sandbox-[a-z0-9-]+$/),
    issueId: z.literal("TOY-101"),
    stage: z.literal("implement"),
    createdAt: z.iso.datetime(),
    stoppedAt: z.iso.datetime(),
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
    sourceTreeDigest: hashSchema,
    status: z.literal("FAILED"),
  }),
  governance: z.object({
    agentCard: z.object({ id: z.string(), version: z.string(), contentHash: hashSchema }),
    approvalPolicy: z.object({ id: z.string(), version: z.string(), contentHash: hashSchema }),
    contextPackDigest: hashSchema,
    executionBudget: executionBudgetSchema,
  }),
  stop: z.object({
    dimension: budgetDimensionSchema,
    action: z.enum(["STOP_STAGE", "STOP_RUN"]),
    result: budgetResultSchema,
  }),
  trace: z.object({
    traceId: z.string().regex(/^[a-f0-9]{32}$/),
    artifact: z.string().regex(/^sandbox-trace-[a-z0-9-]+\.json$/),
    artifactSha256: hashSchema,
  }),
  cleanup: z.object({
    providerCleanupAttempted: z.literal(true),
    temporaryWorkspaceRemoved: z.literal(true),
    providerAttempts: z.array(z.string()),
  }),
  evidenceDigest: hashSchema,
});

export type BudgetStopEvidence = z.infer<typeof budgetStopEvidenceSchema>;

export class BudgetStopEvidenceError extends Error {
  constructor(
    readonly evidence: BudgetStopEvidence,
    readonly traceArtifact: NormalizedTraceArtifact,
  ) {
    super(
      `Sandbox run stopped by ${evidence.stop.dimension} budget; failure evidence was finalized.`,
    );
    this.name = "BudgetStopEvidenceError";
  }
}

export async function createBudgetStopEvidenceDigest(
  pack: Omit<BudgetStopEvidence, "evidenceDigest">,
): Promise<string> {
  return sha256Hex(pack);
}

export async function writeBudgetStopEvidence(
  projectRoot: string,
  pack: BudgetStopEvidence,
  traceArtifactJson: string,
): Promise<{ readonly evidencePath: string; readonly tracePath: string }> {
  const parsed = budgetStopEvidenceSchema.parse(pack);
  const expectedDigest = await sha256Hex(
    Object.fromEntries(Object.entries(parsed).filter(([key]) => key !== "evidenceDigest")),
  );
  if (expectedDigest !== parsed.evidenceDigest) {
    throw new Error("Budget-stop evidence digest mismatch.");
  }
  if (sha256Bytes(traceArtifactJson) !== parsed.trace.artifactSha256) {
    throw new Error("Budget-stop trace artifact hash mismatch.");
  }
  const traceValidation = validateNormalizedTraceArtifact(JSON.parse(traceArtifactJson));
  if (!traceValidation.valid || traceValidation.value.traceId !== parsed.trace.traceId) {
    throw new Error("Budget-stop trace artifact binding mismatch.");
  }
  const generatedRoot = resolve(projectRoot, "evidence/generated");
  await mkdir(generatedRoot, { recursive: true });
  const suffix = parsed.run.id.replace(/^sandbox-/, "");
  const evidencePath = resolve(generatedRoot, `sandbox-budget-stop-${suffix}.json`);
  const tracePath = resolve(generatedRoot, parsed.trace.artifact);
  await writeFile(tracePath, traceArtifactJson, { encoding: "utf8", flag: "wx" });
  await writeFile(evidencePath, `${JSON.stringify(parsed, null, 2)}\n`, {
    encoding: "utf8",
    flag: "wx",
  });
  return { evidencePath, tracePath };
}

function evidenceDigestInput(
  pack: ValidatedSandboxEvidencePack | Omit<SandboxEvidencePack, "evidenceDigest">,
): unknown {
  return Object.fromEntries(Object.entries(pack).filter(([key]) => key !== "evidenceDigest"));
}

export async function createEvidenceDigest(
  pack: Omit<SandboxEvidencePack, "evidenceDigest">,
): Promise<string> {
  return sha256Hex(evidenceDigestInput(pack));
}

function verifyFileSnapshots(
  files: readonly { readonly path: string; readonly sha256: string; readonly content: string }[],
): string[] {
  const errors: string[] = [];
  const paths = new Set<string>();
  for (const file of files) {
    if (paths.has(file.path)) errors.push(`Duplicate repository snapshot path: ${file.path}`);
    paths.add(file.path);
    if (sha256Bytes(file.content) !== file.sha256) errors.push(`File hash mismatch: ${file.path}`);
  }
  return errors;
}

export async function validateEvidencePack(
  value: unknown,
  traceArtifactJson?: string,
): Promise<
  | { readonly valid: true; readonly value: ValidatedSandboxEvidencePack }
  | { readonly valid: false; readonly errors: readonly string[] }
> {
  const parsed = sandboxEvidenceSchema.safeParse(value);
  if (!parsed.success) {
    return {
      valid: false,
      errors: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }
  const pack = parsed.data;
  const errors = [
    ...verifyFileSnapshots(pack.repositoryBefore.files),
    ...verifyFileSnapshots(pack.repositoryAfter.files),
  ];
  if (
    (await sha256Hex(pack.repositoryBefore.files.map(({ path, sha256 }) => ({ path, sha256 })))) !==
    pack.repositoryBefore.treeDigest
  ) {
    errors.push("Repository-before tree digest mismatch.");
  }
  if (
    (await sha256Hex(pack.repositoryAfter.files.map(({ path, sha256 }) => ({ path, sha256 })))) !==
    pack.repositoryAfter.treeDigest
  ) {
    errors.push("Repository-after tree digest mismatch.");
  }
  if (sha256Bytes(pack.inputs.issue.content) !== pack.inputs.issue.sha256)
    errors.push("Synthetic issue hash mismatch.");
  if (
    sha256Bytes(pack.inputs.approvedChangeTargets.content) !==
    pack.inputs.approvedChangeTargets.sha256
  )
    errors.push("Approved change-target hash mismatch.");
  for (const artifact of pack.artifacts) {
    if (sha256Bytes(artifact.content) !== artifact.sha256)
      errors.push(`Artifact hash mismatch: ${artifact.name}`);
  }
  for (const execution of [pack.prePatchExecution, pack.postPatchExecution]) {
    for (const receipt of execution.commands) {
      if (sha256Bytes(receipt.stdout) !== receipt.stdoutSha256)
        errors.push(`stdout hash mismatch: ${receipt.id}`);
      if (sha256Bytes(receipt.stderr) !== receipt.stderrSha256)
        errors.push(`stderr hash mismatch: ${receipt.id}`);
    }
  }
  const changed = pack.change.changedFiles[0];
  if (changed && sha256Bytes(changed.beforeContent) !== changed.beforeSha256)
    errors.push("Changed-file before hash mismatch.");
  if (changed && sha256Bytes(changed.afterContent) !== changed.afterSha256)
    errors.push("Changed-file after hash mismatch.");
  if (sha256Bytes(pack.change.unifiedDiff) !== pack.change.unifiedDiffSha256)
    errors.push("Unified-diff hash mismatch.");
  const contextValidation = validateContextPack(pack.governance.contextPack);
  if (!contextValidation.valid)
    errors.push(`Context pack invalid: ${contextValidation.errors.join("; ")}`);
  else if (contextValidation.value.packDigest !== pack.governance.contextPackDigest)
    errors.push("Context-pack digest binding mismatch.");
  if (pack.schemaVersion !== 1) {
    if (
      pack.prePatchExecution.provider !== pack.postPatchExecution.provider ||
      pack.prePatchExecution.provider !== pack.tools.provider
    ) {
      errors.push("Sandbox provider binding mismatch.");
    }
    for (const execution of [pack.prePatchExecution, pack.postPatchExecution]) {
      if (execution.provider === "E2B") {
        if (
          execution.providerMetadata.uploadedTreeDigest !==
          execution.providerMetadata.remoteTreeDigest
        ) {
          errors.push(`E2B remote tree digest mismatch: ${execution.providerMetadata.sandboxId}`);
        }
        if (!execution.providerMetadata.cleanupVerified) {
          errors.push(`E2B cleanup was not verified: ${execution.providerMetadata.sandboxId}`);
        }
      }
    }
  }
  if (pack.schemaVersion === 3) {
    const budgetHashInput = Object.fromEntries(
      Object.entries(pack.governance.executionBudget).filter(([key]) => key !== "contentHash"),
    );
    if (
      sha256Bytes(canonicalJson(budgetHashInput)) !== pack.governance.executionBudget.contentHash
    ) {
      errors.push("Execution-budget policy hash mismatch.");
    }
    if (
      pack.observability.budget.policy.contentHash !== pack.governance.executionBudget.contentHash
    ) {
      errors.push("Execution-budget evidence binding mismatch.");
    }
    if (pack.observability.approval.policyId !== pack.governance.approvalPolicy.id) {
      errors.push("Approval-policy evidence binding mismatch.");
    }
    if (traceArtifactJson !== undefined) {
      if (sha256Bytes(traceArtifactJson) !== pack.observability.trace.artifactSha256) {
        errors.push("Trace artifact hash mismatch.");
      } else {
        const traceValidation = validateNormalizedTraceArtifact(JSON.parse(traceArtifactJson));
        if (!traceValidation.valid) {
          errors.push(`Trace artifact invalid: ${traceValidation.errors.join("; ")}`);
        } else {
          const traceArtifact = traceValidation.value;
          if (traceArtifact.traceId !== pack.observability.trace.traceId) {
            errors.push("Trace ID evidence binding mismatch.");
          }
          if (traceArtifact.spans.length !== pack.observability.trace.spanCount) {
            errors.push("Trace span-count evidence binding mismatch.");
          }
          if (
            traceArtifact.bindings.sourceCommit !== pack.run.sourceCommit ||
            traceArtifact.bindings.sourceTreeDigest !== pack.run.sourceTreeDigest ||
            traceArtifact.bindings.contextPackDigest !== pack.governance.contextPackDigest ||
            traceArtifact.bindings.agentCardHash !== pack.governance.agentCard.contentHash ||
            traceArtifact.bindings.approvalPolicyHash !==
              pack.governance.approvalPolicy.contentHash ||
            traceArtifact.bindings.budgetPolicyHash !== pack.governance.executionBudget.contentHash
          ) {
            errors.push("Trace governance or source binding mismatch.");
          }
        }
      }
    }
    const accounting = pack.observability.accounting;
    const inputTokens = accounting.records.reduce((total, item) => total + item.inputTokens, 0);
    const outputTokens = accounting.records.reduce((total, item) => total + item.outputTokens, 0);
    const costUsd = Number(
      accounting.records.reduce((total, item) => total + item.costUsd, 0).toFixed(8),
    );
    if (
      inputTokens !== accounting.total.inputTokens ||
      outputTokens !== accounting.total.outputTokens ||
      costUsd !== accounting.total.costUsd ||
      accounting.records.length !== accounting.total.modelCalls
    ) {
      errors.push("Run accounting total mismatch.");
    }
    if (
      accounting.total.modelCalls === 0 &&
      (accounting.total.inputTokens !== 0 ||
        accounting.total.outputTokens !== 0 ||
        accounting.total.costUsd !== 0 ||
        accounting.total.tokenMeasurement !== "EXACT_ZERO_NO_MODEL" ||
        accounting.total.costMeasurement !== "EXACT_ZERO_NO_MODEL")
    ) {
      errors.push("Deterministic no-model accounting must report exact zero usage and cost.");
    }
  }
  if ((await sha256Hex(evidenceDigestInput(pack))) !== pack.evidenceDigest)
    errors.push("Evidence-pack digest mismatch.");
  return errors.length === 0 ? { valid: true, value: pack } : { valid: false, errors };
}

function commandLine(
  pack: ValidatedSandboxEvidencePack,
  id: "pre-test" | "build" | "test",
): string {
  const receipt = [...pack.prePatchExecution.commands, ...pack.postPatchExecution.commands].find(
    (candidate) => candidate.id === id,
  );
  return receipt
    ? `${id}: exit ${receipt.exitCode ?? "none"} (${receipt.durationMs} ms)`
    : `${id}: missing`;
}

function providerMarkdown(pack: ValidatedSandboxEvidencePack): string {
  if (pack.schemaVersion === 1) {
    return `- Provider: Local Docker\n- Runtime image: ${pack.tools.imageDigest}\n- Network during execution: disabled`;
  }
  if (pack.tools.provider === "LOCAL_DOCKER") {
    return `- Provider: Local Docker\n- Runtime image: ${pack.tools.imageDigest}\n- Network during execution: disabled`;
  }
  return `- Provider: E2B\n- SDK: e2b ${pack.tools.sdkVersion}\n- Template: ${pack.tools.template}\n- Network configuration: allowInternetAccess=false\n- Network verification: outbound probe blocked\n- Sandbox TTL: ${pack.tools.sandboxTimeoutMs} ms with lifecycle on-timeout kill`;
}

function limitsMarkdown(pack: ValidatedSandboxEvidencePack): string {
  if (pack.schemaVersion === 1) {
    return `${pack.boundary.limits.cpuCount} CPU, ${pack.boundary.limits.memoryMb} MiB memory, ${pack.boundary.limits.processLimit} processes, ${pack.boundary.limits.timeoutMs} ms per command`;
  }
  const limits = pack.boundary.limits;
  if (limits.provider.kind === "LOCAL_DOCKER") {
    return `${limits.provider.cpuCount} CPU, ${limits.provider.memoryMb} MiB memory, ${limits.provider.processLimit} processes, ${limits.commandTimeoutMs} ms per command (Docker flags)`;
  }
  return `${limits.provider.cpuCount} CPU and ${limits.provider.memoryMb} MiB reported by E2B, ${limits.commandTimeoutMs} ms per command; process and tmpfs limits are not configured`;
}

export function renderEvidenceMarkdown(pack: ValidatedSandboxEvidencePack): string {
  const traceLines =
    pack.schemaVersion === 3
      ? `- Trace ID: ${pack.observability.trace.traceId}\n- Trace artifact: ${pack.observability.trace.artifact}\n- Trace artifact SHA-256: ${pack.observability.trace.artifactSha256}\n- Budget outcome: ${pack.observability.budget.outcome}\n- Tool calls: ${pack.observability.budget.dimensions.find((item) => item.dimension === "TOOL_CALLS")?.observed ?? 0}\n- Repair attempts: ${pack.observability.budget.dimensions.find((item) => item.dimension === "REPAIR_ATTEMPTS")?.observed ?? 0}\n- Model usage: ${pack.observability.accounting.total.modelCalls} calls, ${pack.observability.accounting.total.costUsd} USD (${pack.observability.accounting.total.costMeasurement})`
      : "- Trace evidence: not available in this legacy pack";
  return `# Recorded real sandbox run

- Classification: ${pack.classification}
- Status: ${pack.run.status}
- Run: ${pack.run.id}
- Source commit: ${pack.run.sourceCommit}
- Source working tree: ${pack.run.sourceWorkingTree}
- Evidence digest: ${pack.evidenceDigest}
- Context-pack digest: ${pack.governance.contextPackDigest}
${traceLines}
${providerMarkdown(pack)}
- Container user: ${pack.postPatchExecution.user}
- Limits: ${limitsMarkdown(pack)}

## Result

The checked-in synthetic test fails before the controlled patch. For a successful scenario, the build and tests pass after the only changed path, \`${pack.change.path}\`, is patched.

- ${commandLine(pack, "pre-test")}
- ${commandLine(pack, "build")}
- ${commandLine(pack, "test")}

## Unified diff

\`\`\`diff
${pack.change.unifiedDiff.trimEnd()}
\`\`\`

## Safety boundary

${pack.disclosure}
`;
}

export async function writeEvidencePack(
  projectRoot: string,
  pack: SandboxEvidencePack,
  traceArtifactJson: string,
): Promise<{
  readonly jsonPath: string;
  readonly markdownPath: string;
  readonly tracePath: string;
  readonly indexPath: string;
}> {
  const generatedRoot = resolve(projectRoot, "evidence/generated");
  await mkdir(generatedRoot, { recursive: true });
  const suffix = pack.run.id.replace(/^sandbox-/, "");
  const jsonName = `sandbox-run-${suffix}.json`;
  const markdownName = `sandbox-run-${suffix}.md`;
  const jsonPath = resolve(generatedRoot, jsonName);
  const markdownPath = resolve(generatedRoot, markdownName);
  const tracePath = resolve(generatedRoot, pack.observability.trace.artifact);
  if (
    await access(jsonPath)
      .then(() => true)
      .catch(() => false)
  )
    throw new Error(`Evidence file already exists: ${jsonName}`);
  const traceValidation = validateNormalizedTraceArtifact(JSON.parse(traceArtifactJson));
  if (!traceValidation.valid) {
    throw new Error(`Trace artifact is invalid: ${traceValidation.errors.join("; ")}`);
  }
  if (
    traceValidation.value.traceId !== pack.observability.trace.traceId ||
    sha256Bytes(traceArtifactJson) !== pack.observability.trace.artifactSha256
  ) {
    throw new Error("Trace artifact does not match the evidence manifest binding.");
  }
  await writeFile(tracePath, traceArtifactJson, { encoding: "utf8", flag: "wx" });
  await writeFile(jsonPath, `${JSON.stringify(pack, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  await writeFile(markdownPath, renderEvidenceMarkdown(pack), { encoding: "utf8", flag: "wx" });
  const index: EvidenceIndex = {
    schemaVersion: 2,
    latest: {
      json: jsonName,
      markdown: markdownName,
      evidenceDigest: pack.evidenceDigest,
      sourceCommit: pack.run.sourceCommit,
      status: "SUCCEEDED",
      trace: pack.observability.trace.artifact,
      traceId: pack.observability.trace.traceId,
      traceArtifactSha256: pack.observability.trace.artifactSha256,
    },
  };
  const indexPath = resolve(generatedRoot, "index.json");
  if (pack.run.status === "SUCCEEDED")
    await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  return { jsonPath, markdownPath, tracePath, indexPath };
}

export async function readLatestValidatedEvidence(projectRoot: string): Promise<{
  readonly pack: ValidatedSandboxEvidencePack;
  readonly index: EvidenceIndex;
  readonly json: string;
  readonly markdown: string;
  readonly trace: NormalizedTraceArtifact | null;
  readonly traceJson: string | null;
} | null> {
  const generatedRoot = resolve(projectRoot, "evidence/generated");
  const rawIndex = await readFile(resolve(generatedRoot, "index.json"), "utf8").catch(() => null);
  if (!rawIndex) return null;
  const index = evidenceIndexSchema.parse(JSON.parse(rawIndex));
  if (
    basename(index.latest.json) !== index.latest.json ||
    basename(index.latest.markdown) !== index.latest.markdown
  ) {
    throw new Error("Evidence index contains an unsafe path.");
  }
  const json = await readFile(resolve(generatedRoot, index.latest.json), "utf8");
  const markdown = await readFile(resolve(generatedRoot, index.latest.markdown), "utf8");
  const parsedPack: unknown = JSON.parse(json);
  const traceJson =
    index.schemaVersion === 2
      ? await readFile(resolve(generatedRoot, index.latest.trace), "utf8")
      : null;
  const validation = await validateEvidencePack(parsedPack, traceJson ?? undefined);
  if (!validation.valid)
    throw new Error(`Recorded sandbox evidence failed validation: ${validation.errors.join("; ")}`);
  if (validation.value.run.status !== "SUCCEEDED")
    throw new Error("Latest evidence index must reference a successful run.");
  if (
    validation.value.evidenceDigest !== index.latest.evidenceDigest ||
    validation.value.run.sourceCommit !== index.latest.sourceCommit
  ) {
    throw new Error("Evidence index binding mismatch.");
  }
  if (!markdown.includes(validation.value.evidenceDigest))
    throw new Error("Evidence Markdown is not bound to the JSON digest.");
  if (validation.value.schemaVersion === 3 && index.schemaVersion !== 2) {
    throw new Error("Trace-enabled evidence requires a trace-enabled index.");
  }
  if (index.schemaVersion === 2) {
    if (
      basename(index.latest.trace) !== index.latest.trace ||
      validation.value.schemaVersion !== 3 ||
      validation.value.observability.trace.artifact !== index.latest.trace ||
      validation.value.observability.trace.traceId !== index.latest.traceId ||
      validation.value.observability.trace.artifactSha256 !== index.latest.traceArtifactSha256
    ) {
      throw new Error("Trace index binding mismatch.");
    }
  }
  const traceArtifact = traceJson
    ? normalizedTraceArtifactSchema.parse(JSON.parse(traceJson))
    : null;
  return { pack: validation.value, index, json, markdown, trace: traceArtifact, traceJson };
}

export async function validateGeneratedEvidence(
  projectRoot: string,
): Promise<ValidatedSandboxEvidencePack | null> {
  const latest = await readLatestValidatedEvidence(projectRoot);
  if (!latest) return null;
  return latest.pack;
}

export async function validateAllGeneratedEvidence(projectRoot: string): Promise<{
  readonly latest: ValidatedSandboxEvidencePack;
  readonly packs: readonly ValidatedSandboxEvidencePack[];
}> {
  const generatedRoot = resolve(projectRoot, "evidence/generated");
  const names = (await readdir(generatedRoot))
    .filter((name) => /^sandbox-run-[a-z0-9-]+\.json$/.test(name))
    .sort();
  if (names.length === 0) throw new Error("No generated sandbox evidence packs were found.");
  const packs: ValidatedSandboxEvidencePack[] = [];
  for (const name of names) {
    const raw = await readFile(resolve(generatedRoot, name), "utf8");
    const candidate: unknown = JSON.parse(raw);
    const parsed = sandboxEvidenceSchema.safeParse(candidate);
    const traceJson =
      parsed.success && parsed.data.schemaVersion === 3
        ? await readFile(resolve(generatedRoot, parsed.data.observability.trace.artifact), "utf8")
        : undefined;
    const validation = await validateEvidencePack(candidate, traceJson);
    if (!validation.valid)
      throw new Error(`${name} failed validation: ${validation.errors.join("; ")}`);
    const markdown = await readFile(resolve(generatedRoot, name.replace(/\.json$/, ".md")), "utf8");
    if (!markdown.includes(validation.value.evidenceDigest)) {
      throw new Error(`${name} Markdown is not bound to its JSON digest.`);
    }
    packs.push(validation.value);
  }
  const latest = await validateGeneratedEvidence(projectRoot);
  if (!latest) throw new Error("No successful latest evidence index was found.");
  if (!packs.some((pack) => pack.evidenceDigest === latest.evidenceDigest)) {
    throw new Error("Latest evidence index does not reference a validated generated pack.");
  }
  return { latest, packs };
}

export function canonicalEvidenceJson(pack: ValidatedSandboxEvidencePack): string {
  return canonicalJson(pack);
}
