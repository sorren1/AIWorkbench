import { appendFile, cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { z } from "zod";

import {
  addApprovalRequest,
  createBoundApprovalRequest,
  decideApprovalRequest,
  proposedArgumentsHash,
  transitionApprovalRequest,
  validateApprovalForResume,
  verifyApprovalEventLog,
} from "../../src/demo/authorization/approvalProtocol";
import { authorizeRegistryAction } from "../../src/demo/authorization/authorizeAction";
import { isPersonaId, personaById } from "../../src/demo/authorization/personas";
import { sha256Hex } from "../../src/demo/control-plane/registry/canonical";
import { registrySnapshot } from "../../src/demo/control-plane/registry/generated";
import {
  validateApprovalEvent,
  validateApprovalRequest,
  validateApprovalStore,
  validateContextPack,
} from "../../src/demo/control-plane/registry/validation";
import { buildContextPack, contextSelectionInput } from "../../src/demo/context/runtime";
import { includedContextRemainsFresh, isContextPackCurrent } from "../../src/demo/context/selector";
import { startToyMcpSession } from "../toy-repo-mcp/client";
import { initializeToyRepository } from "../toy-repo-mcp/workspace";

const projectRoot = resolve(import.meta.dirname, "../..");
const fixtureRoot = resolve(projectRoot, "examples/toy-repo");
const DEFAULT_RUN_ROOT = resolve(projectRoot, ".workbench/runs");

const runRecordSchema = z.object({
  schemaVersion: z.literal(2),
  runId: z.string().regex(/^[a-z][a-z0-9._-]+$/),
  scenario: z.literal("approval-required"),
  status: z.enum(["WAITING_FOR_APPROVAL", "COMPLETED", "BLOCKED"]),
  createdAt: z.iso.datetime(),
  stage: z.literal("implement"),
  requesterPersonaId: z.literal("synthetic-implementer"),
  requestId: z.string(),
  workspace: z.literal("workspace"),
  contextPackPath: z.literal("context-pack.json"),
  action: z.object({
    toolId: z.literal("tool.repository.patch.controlled"),
    arguments: z.object({ path: z.string(), expected: z.string(), replacement: z.string() }),
    targetPaths: z.array(z.string()),
    approvedChangeTargets: z.array(z.string()),
    changeTargetDigest: z.string().regex(/^[a-f0-9]{64}$/),
    contextPackDigest: z.string().regex(/^[a-f0-9]{64}$/),
  }),
});
type RunRecord = z.infer<typeof runRecordSchema>;

function option(name: string): string | undefined {
  const index = process.argv.indexOf(name);
  const value = index >= 0 ? process.argv[index + 1] : undefined;
  return value && !value.startsWith("--") ? value : undefined;
}

function requiredOption(name: string): string {
  const value = option(name);
  if (!value) throw new Error(`Missing required option: ${name}`);
  return value;
}

function runRoot(): string {
  return resolve(option("--run-root") ?? DEFAULT_RUN_ROOT);
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function readRun(path: string): Promise<RunRecord> {
  const result = runRecordSchema.safeParse(await readJson(path));
  if (!result.success) throw new Error(`Run record validation failed: ${result.error.message}`);
  return result.data;
}

async function readStore(path: string) {
  const result = validateApprovalStore(await readJson(path));
  if (!result.valid)
    throw new Error(`Approval store validation failed: ${result.errors.join("; ")}`);
  if (!(await verifyApprovalEventLog(result.value.events))) {
    throw new Error("Approval event hash chain validation failed.");
  }
  return result.value;
}

function assertValidStore(value: unknown): void {
  const result = validateApprovalStore(value);
  if (!result.valid)
    throw new Error(`Approval store validation failed: ${result.errors.join("; ")}`);
}

async function appendNewEvents(
  path: string,
  previousCount: number,
  events: Awaited<ReturnType<typeof readStore>>["events"],
): Promise<void> {
  const additions = events.slice(previousCount);
  if (additions.length > 0) {
    await appendFile(
      path,
      additions.map((event) => JSON.stringify(event)).join("\n") + "\n",
      "utf8",
    );
  }
}

async function findRunDirectoryByRequest(root: string, requestId: string): Promise<string> {
  const entries = await readdir(root, { withFileTypes: true }).catch(() => []);
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const directory = resolve(root, entry.name);
    const result = validateApprovalRequest(
      await readJson(resolve(directory, "approval-request.json")).catch(() => null),
    );
    if (result.valid && result.value.requestId === requestId) return directory;
  }
  throw new Error(`Approval request not found under the local run root: ${requestId}`);
}

async function startRun(): Promise<void> {
  if ((option("--scenario") ?? "approval-required") !== "approval-required") {
    throw new Error("Only the deterministic approval-required scenario is supported.");
  }
  const createdAt = new Date().toISOString();
  const runId = option("--run") ?? `run.local.${Date.now()}`;
  if (!/^[a-z][a-z0-9._-]+$/.test(runId))
    throw new Error("Run ID contains unsupported characters.");
  const directory = resolve(runRoot(), runId);
  const workspace = resolve(directory, "workspace");
  await mkdir(runRoot(), { recursive: true });
  await mkdir(directory, { recursive: false });
  await cp(fixtureRoot, workspace, { recursive: true });
  await initializeToyRepository(workspace);

  const actionArguments = {
    path: "src/report.js",
    expected: "return `Variance: ${actual - budget}`;",
    replacement:
      'const difference = actual - budget;\n  const direction = difference >= 0 ? "over" : "under";\n  return `Variance: ${Math.abs(difference)} ${direction}`;',
  };
  const approvedChangeTargets = ["src/**"];
  const changeTargetDigest = await sha256Hex(approvedChangeTargets);
  const contextPack = await buildContextPack("synthetic-toy-repository", "implement", {
    runId,
    createdAt,
  });
  const contextPackDigest = contextPack.packDigest;
  const persona = personaById("synthetic-implementer");
  const context = await authorizeRegistryAction({
    snapshot: registrySnapshot,
    persona,
    stageId: "implement",
    toolId: "tool.repository.patch.controlled",
    targetPaths: [actionArguments.path],
    approvedChangeTargets,
    networkAccess: false,
    evidenceFinalized: false,
    effectiveSubject: "synthetic-toy-repository",
    runId,
    sessionId: `session.${runId}`,
    now: createdAt,
    expiresAt: new Date(Date.parse(createdAt) + 15 * 60 * 1000).toISOString(),
    decisionId: `decision.${runId}.patch`,
  });
  if (context.decision.mode !== "REQUIRE_APPROVAL") {
    throw new Error(`Expected approval pause, received ${context.decision.reasonCode}.`);
  }
  const requestId = `approval.${runId}.patch`;
  const created = await createBoundApprovalRequest({
    requestId,
    identity: context.request.identity,
    decision: context.decision,
    tool: {
      id: context.request.tool.id,
      version: context.request.tool.version,
      contentHash: context.request.tool.contentHash,
    },
    stage: "implement",
    argumentsValue: actionArguments,
    targetPaths: [actionArguments.path],
    changeTargetDigest,
    contextPackDigest,
    requestedAt: createdAt,
  });
  const store = addApprovalRequest({ version: 1, requests: {}, events: [] }, created);
  const requestValidation = validateApprovalRequest(created.request);
  const eventValidation = validateApprovalEvent(created.event);
  if (!requestValidation.valid || !eventValidation.valid) {
    throw new Error("Generated approval request or event failed its JSON Schema.");
  }
  assertValidStore(store);
  const run: RunRecord = {
    schemaVersion: 2,
    runId,
    scenario: "approval-required",
    status: "WAITING_FOR_APPROVAL",
    createdAt,
    stage: "implement",
    requesterPersonaId: "synthetic-implementer",
    requestId,
    workspace: "workspace",
    contextPackPath: "context-pack.json",
    action: {
      toolId: "tool.repository.patch.controlled",
      arguments: actionArguments,
      targetPaths: [actionArguments.path],
      approvedChangeTargets,
      changeTargetDigest,
      contextPackDigest,
    },
  };
  await writeJson(resolve(directory, "run.json"), run);
  await writeJson(resolve(directory, run.contextPackPath), contextPack);
  await writeJson(resolve(directory, "approval-request.json"), created.request);
  await writeJson(resolve(directory, "approval-state.json"), store);
  await writeFile(
    resolve(directory, "approval-events.ndjson"),
    `${JSON.stringify(created.event)}\n`,
    "utf8",
  );
  process.stdout.write(
    `${JSON.stringify({ runId, requestId, status: run.status, runDirectory: directory })}\n`,
  );
}

async function decideRun(status: "APPROVED" | "REJECTED"): Promise<void> {
  const requestId = requiredOption("--request");
  const personaId = requiredOption("--as");
  const reason = requiredOption("--reason");
  if (!isPersonaId(personaId)) throw new Error(`Unknown synthetic persona: ${personaId}`);
  const directory = await findRunDirectoryByRequest(runRoot(), requestId);
  const statePath = resolve(directory, "approval-state.json");
  const eventsPath = resolve(directory, "approval-events.ndjson");
  const store = await readStore(statePath);
  const request = store.requests[requestId];
  if (!request) throw new Error(`Request is missing from materialized state: ${requestId}`);
  const policy = registrySnapshot.approvalPolicies.find(
    (candidate) =>
      candidate.id === request.policy.id &&
      candidate.version === request.policy.version &&
      candidate.contentHash === request.policy.contentHash,
  );
  if (!policy) throw new Error("The approval policy version/hash is no longer current.");
  const next = await decideApprovalRequest({
    store,
    requestId,
    status,
    actor: personaById(personaId),
    reason,
    decidedAt: new Date().toISOString(),
    policy,
  });
  assertValidStore(next);
  await appendNewEvents(eventsPath, store.events.length, next.events);
  await writeJson(statePath, next);
  process.stdout.write(
    `${JSON.stringify({ requestId, status: next.requests[requestId]?.status, actor: personaId })}\n`,
  );
}

async function resumeRun(): Promise<void> {
  const runId = requiredOption("--run");
  const directory = resolve(runRoot(), runId);
  const runPath = resolve(directory, "run.json");
  const statePath = resolve(directory, "approval-state.json");
  const eventsPath = resolve(directory, "approval-events.ndjson");
  const run = await readRun(runPath);
  if (run.status !== "WAITING_FOR_APPROVAL")
    throw new Error(`Run cannot resume from ${run.status}.`);
  const store = await readStore(statePath);
  const request = store.requests[run.requestId];
  if (!request) throw new Error("The run's approval request is absent.");
  const policy = registrySnapshot.approvalPolicies.find(
    (candidate) =>
      candidate.id === request.policy.id &&
      candidate.version === request.policy.version &&
      candidate.contentHash === request.policy.contentHash,
  );
  if (!policy) throw new Error("The run's bound policy is no longer current.");
  const now = new Date().toISOString();
  const contextPackValidation = validateContextPack(
    await readJson(resolve(directory, run.contextPackPath)).catch(() => null),
  );
  const denyContextMismatch = async (detail: string): Promise<never> => {
    const invalidated = await transitionApprovalRequest({
      store,
      requestId: request.requestId,
      status: "INVALIDATED",
      actor: run.requesterPersonaId,
      reason: detail,
      timestamp: now,
    });
    assertValidStore(invalidated);
    await appendNewEvents(eventsPath, store.events.length, invalidated.events);
    await writeJson(statePath, invalidated);
    await writeJson(runPath, { ...run, status: "BLOCKED" });
    throw new Error(`Resume denied: CONTEXT_MISMATCH (${detail})`);
  };
  if (!contextPackValidation.valid) {
    return denyContextMismatch(
      `Persisted context pack is absent or invalid: ${contextPackValidation.errors.join("; ")}`,
    );
  }
  const contextPack = contextPackValidation.value;
  const currentContextInput = contextSelectionInput("synthetic-toy-repository", run.stage, {
    runId: run.runId,
    createdAt: contextPack.createdAt,
  });
  const memoryPolicy = currentContextInput.memoryPolicy;
  if (
    contextPack.packDigest !== run.action.contextPackDigest ||
    !(await isContextPackCurrent(contextPack, currentContextInput)) ||
    !includedContextRemainsFresh(contextPack, memoryPolicy.freshness.maximumAgeSeconds, now)
  ) {
    await denyContextMismatch(
      "The persisted pack digest, selected records, policy binding, or freshness no longer matches the current deterministic selection.",
    );
  }
  const context = await authorizeRegistryAction({
    snapshot: registrySnapshot,
    persona: personaById(run.requesterPersonaId),
    stageId: run.stage,
    toolId: run.action.toolId,
    targetPaths: run.action.targetPaths,
    approvedChangeTargets: run.action.approvedChangeTargets,
    networkAccess: false,
    evidenceFinalized: false,
    effectiveSubject: request.effectiveSubject,
    runId: run.runId,
    sessionId: `session.${run.runId}`,
    now,
    expiresAt: new Date(Date.parse(now) + 15 * 60 * 1000).toISOString(),
    decisionId: `decision.${run.runId}.resume`,
  });
  if (context.decision.mode !== "REQUIRE_APPROVAL")
    throw new Error("Resume policy no longer requires the bound approval.");
  const approver =
    request.decisionActor && isPersonaId(request.decisionActor)
      ? personaById(request.decisionActor)
      : null;
  const binding = {
    proposedArgumentsHash: await proposedArgumentsHash(run.action.arguments),
    agent: context.request.identity.executingAgent,
    tool: {
      id: context.request.tool.id,
      version: context.request.tool.version,
      contentHash: context.request.tool.contentHash,
    },
    changeTargetDigest: await sha256Hex(run.action.approvedChangeTargets),
    contextPackDigest: run.action.contextPackDigest,
  };
  const resume = validateApprovalForResume({ request, binding, policy, approver, now });
  if (!resume.allowed) {
    const invalidated = await transitionApprovalRequest({
      store,
      requestId: request.requestId,
      status: "INVALIDATED",
      actor: run.requesterPersonaId,
      reason: resume.detail,
      timestamp: now,
    });
    assertValidStore(invalidated);
    await appendNewEvents(eventsPath, store.events.length, invalidated.events);
    await writeJson(statePath, invalidated);
    await writeJson(runPath, { ...run, status: "BLOCKED" });
    throw new Error(`Resume denied: ${resume.reasonCode} (${resume.detail})`);
  }
  const session = await startToyMcpSession({
    toyRepositoryRoot: resolve(directory, run.workspace),
    stageId: run.stage,
    approvedToolIds: [run.action.toolId],
    authorization: {
      personaId: run.requesterPersonaId,
      effectiveSubject: request.effectiveSubject,
      runId: run.runId,
      sessionId: `session.${run.runId}`,
      now,
      approvedChangeTargets: run.action.approvedChangeTargets,
      contextPackDigest: run.action.contextPackDigest,
    },
    approvalRequest: request,
  });
  try {
    const result = await session.callApprovedTool(run.action.toolId, run.action.arguments);
    await writeJson(resolve(directory, "execution-evidence.json"), {
      schemaVersion: 1,
      classification: "SYNTHETIC_LOCAL_APPROVAL_EVIDENCE",
      runId: run.runId,
      requestId: request.requestId,
      policyDecisionId: result.evidence.policyDecisionId,
      approvalDecisionHash: request.decisionContentHash,
      tool: {
        id: result.evidence.toolId,
        version: result.evidence.registryVersion,
        contentHash: result.evidence.registryContentHash,
      },
      contextPackDigest: contextPack.packDigest,
      contextPack,
      stageExecutionManifest: session.executionManifest,
      result: { changed: result.payload.changed === true, path: result.payload.path },
      externalNetworkCalls: 0,
    });
  } finally {
    await session.close();
  }
  await writeJson(runPath, { ...run, status: "COMPLETED" });
  process.stdout.write(
    `${JSON.stringify({ runId: run.runId, requestId: request.requestId, status: "COMPLETED" })}\n`,
  );
}

const command = process.argv[2];
try {
  if (command === "start") await startRun();
  else if (command === "approve") await decideRun("APPROVED");
  else if (command === "reject") await decideRun("REJECTED");
  else if (command === "resume") await resumeRun();
  else throw new Error("Expected one command: start, approve, reject, or resume.");
} catch (error) {
  process.stderr.write(
    `${error instanceof Error ? error.message : "Unknown local sandbox error"}\n`,
  );
  process.exitCode = 1;
}
