import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";

import { z } from "zod";

import { canonicalJson, sha256Hex } from "../../src/demo/control-plane/registry/canonical";
import { validateContextPack } from "../../src/demo/control-plane/registry/validation";
import { sha256Bytes } from "./security";

const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);
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

const executionSchema = z.object({
  provider: z.literal("LOCAL_DOCKER"),
  image: z.string().min(1),
  imageDigest: z.string().regex(/^node@sha256:[a-f0-9]{64}$/),
  networkMode: z.literal("none"),
  user: z.string().min(1),
  readOnlyRootFilesystem: z.literal(true),
  noNewPrivileges: z.literal(true),
  commands: z.array(commandReceiptSchema).min(1),
  cleanupAttempts: z.array(z.string()),
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

export const sandboxEvidenceSchema = z.object({
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
  prePatchExecution: executionSchema,
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
  postPatchExecution: executionSchema,
  tools: z.object({
    dockerClientVersion: z.string().min(1),
    dockerServerVersion: z.string().min(1),
    image: z.string().min(1),
    imageDigest: z.string().regex(/^node@sha256:[a-f0-9]{64}$/),
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

export type SandboxEvidencePack = z.infer<typeof sandboxEvidenceSchema>;

export const evidenceIndexSchema = z.object({
  schemaVersion: z.literal(1),
  latest: z.object({
    json: z.string().regex(/^sandbox-run-[a-z0-9-]+\.json$/),
    markdown: z.string().regex(/^sandbox-run-[a-z0-9-]+\.md$/),
    evidenceDigest: hashSchema,
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
    status: z.literal("SUCCEEDED"),
  }),
});

export type EvidenceIndex = z.infer<typeof evidenceIndexSchema>;

function evidenceDigestInput(
  pack: SandboxEvidencePack | Omit<SandboxEvidencePack, "evidenceDigest">,
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
): Promise<
  | { readonly valid: true; readonly value: SandboxEvidencePack }
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
  if ((await sha256Hex(evidenceDigestInput(pack))) !== pack.evidenceDigest)
    errors.push("Evidence-pack digest mismatch.");
  return errors.length === 0 ? { valid: true, value: pack } : { valid: false, errors };
}

function commandLine(pack: SandboxEvidencePack, id: "pre-test" | "build" | "test"): string {
  const receipt = [...pack.prePatchExecution.commands, ...pack.postPatchExecution.commands].find(
    (candidate) => candidate.id === id,
  );
  return receipt
    ? `${id}: exit ${receipt.exitCode ?? "none"} (${receipt.durationMs} ms)`
    : `${id}: missing`;
}

export function renderEvidenceMarkdown(pack: SandboxEvidencePack): string {
  return `# Recorded real sandbox run

- Classification: ${pack.classification}
- Status: ${pack.run.status}
- Run: ${pack.run.id}
- Source commit: ${pack.run.sourceCommit}
- Source working tree: ${pack.run.sourceWorkingTree}
- Evidence digest: ${pack.evidenceDigest}
- Context-pack digest: ${pack.governance.contextPackDigest}
- Docker image: ${pack.tools.imageDigest}
- Network during execution: disabled
- Container user: ${pack.postPatchExecution.user}
- Limits: ${pack.boundary.limits.cpuCount} CPU, ${pack.boundary.limits.memoryMb} MiB memory, ${pack.boundary.limits.processLimit} processes, ${pack.boundary.limits.timeoutMs} ms per command

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
): Promise<{
  readonly jsonPath: string;
  readonly markdownPath: string;
  readonly indexPath: string;
}> {
  const generatedRoot = resolve(projectRoot, "evidence/generated");
  await mkdir(generatedRoot, { recursive: true });
  const suffix = pack.run.id.replace(/^sandbox-/, "");
  const jsonName = `sandbox-run-${suffix}.json`;
  const markdownName = `sandbox-run-${suffix}.md`;
  const jsonPath = resolve(generatedRoot, jsonName);
  const markdownPath = resolve(generatedRoot, markdownName);
  if (
    await access(jsonPath)
      .then(() => true)
      .catch(() => false)
  )
    throw new Error(`Evidence file already exists: ${jsonName}`);
  await writeFile(jsonPath, `${JSON.stringify(pack, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  await writeFile(markdownPath, renderEvidenceMarkdown(pack), { encoding: "utf8", flag: "wx" });
  const index: EvidenceIndex = {
    schemaVersion: 1,
    latest: {
      json: jsonName,
      markdown: markdownName,
      evidenceDigest: pack.evidenceDigest,
      sourceCommit: pack.run.sourceCommit,
      status: "SUCCEEDED",
    },
  };
  const indexPath = resolve(generatedRoot, "index.json");
  if (pack.run.status === "SUCCEEDED")
    await writeFile(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
  return { jsonPath, markdownPath, indexPath };
}

export async function readLatestValidatedEvidence(projectRoot: string): Promise<{
  readonly pack: SandboxEvidencePack;
  readonly index: EvidenceIndex;
  readonly json: string;
  readonly markdown: string;
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
  const validation = await validateEvidencePack(JSON.parse(json));
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
  return { pack: validation.value, index, json, markdown };
}

export async function validateGeneratedEvidence(
  projectRoot: string,
): Promise<SandboxEvidencePack | null> {
  const latest = await readLatestValidatedEvidence(projectRoot);
  if (!latest) return null;
  return latest.pack;
}

export async function validateAllGeneratedEvidence(projectRoot: string): Promise<{
  readonly latest: SandboxEvidencePack;
  readonly packs: readonly SandboxEvidencePack[];
}> {
  const generatedRoot = resolve(projectRoot, "evidence/generated");
  const names = (await readdir(generatedRoot))
    .filter((name) => /^sandbox-run-[a-z0-9-]+\.json$/.test(name))
    .sort();
  if (names.length === 0) throw new Error("No generated sandbox evidence packs were found.");
  const packs: SandboxEvidencePack[] = [];
  for (const name of names) {
    const raw = await readFile(resolve(generatedRoot, name), "utf8");
    const validation = await validateEvidencePack(JSON.parse(raw));
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

export function canonicalEvidenceJson(pack: SandboxEvidencePack): string {
  return canonicalJson(pack);
}
