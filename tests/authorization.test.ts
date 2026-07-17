import { describe, expect, it } from "vitest";

import { authorizeRegistryAction } from "../src/demo/authorization/authorizeAction";
import { evaluateApprovalEligibility } from "../src/demo/authorization/approvalEligibility";
import {
  addApprovalRequest,
  createBoundApprovalRequest,
  decideApprovalRequest,
  proposedArgumentsHash,
  validateApprovalForResume,
  verifyApprovalEventLog,
} from "../src/demo/authorization/approvalProtocol";
import { evaluateAuthorization, globMatches } from "../src/demo/authorization/engine";
import { PERSONAS, personaById } from "../src/demo/authorization/personas";
import { sha256Hex } from "../src/demo/control-plane/registry/canonical";
import { registrySnapshot } from "../src/demo/control-plane/registry/generated";

const NOW = "2026-07-17T15:00:00.000Z";
const TARGETS = ["src/**"] as const;
const CONTEXT_DIGEST = "b".repeat(64);
const PATCH_ARGUMENTS = {
  path: "src/report.js",
  expected: "before",
  replacement: "after",
};

async function action(options: {
  personaId?: Parameters<typeof personaById>[0];
  toolId?: string;
  targetPaths?: readonly string[];
  approvedChangeTargets?: readonly string[];
  networkAccess?: boolean;
}) {
  return authorizeRegistryAction({
    snapshot: registrySnapshot,
    persona: personaById(options.personaId ?? "synthetic-implementer"),
    stageId: "implement",
    toolId: options.toolId ?? "tool.repository.patch.controlled",
    targetPaths: options.targetPaths ?? [PATCH_ARGUMENTS.path],
    approvedChangeTargets: options.approvedChangeTargets ?? TARGETS,
    networkAccess: options.networkAccess ?? false,
    evidenceFinalized: false,
    effectiveSubject: "synthetic-toy-repository",
    runId: "run.test.authorization",
    sessionId: "session.test.authorization",
    now: NOW,
    expiresAt: "2026-07-17T15:15:00.000Z",
    decisionId: "decision.test.authorization",
  });
}

async function pendingPatch() {
  const context = await action({});
  const created = await createBoundApprovalRequest({
    requestId: "approval.test.authorization",
    identity: context.request.identity,
    decision: context.decision,
    tool: {
      id: context.request.tool.id,
      version: context.request.tool.version,
      contentHash: context.request.tool.contentHash,
    },
    stage: "implement",
    argumentsValue: PATCH_ARGUMENTS,
    targetPaths: [PATCH_ARGUMENTS.path],
    changeTargetDigest: await sha256Hex(TARGETS),
    contextPackDigest: CONTEXT_DIGEST,
    requestedAt: NOW,
  });
  const policy = context.decision.matchedPolicy;
  if (!policy) throw new Error("Patch policy missing from test registry.");
  return {
    context,
    policy,
    store: addApprovalRequest({ version: 1, requests: {}, events: [] }, created),
    requestId: created.request.requestId,
  };
}

describe("shared authorization policy engine", () => {
  it("intersects persona, delegation, stage, agent, tool, and resource authority", async () => {
    const read = await action({
      toolId: "tool.repository.file.read",
      targetPaths: ["src/report.js"],
    });
    expect(read.decision).toMatchObject({ allowed: true, reasonCode: "POLICY_ALLOW" });
    expect(read.decision.effectiveScopes).toEqual(
      expect.arrayContaining(["artifact:read", "tool:invoke"]),
    );

    const auditor = await action({
      personaId: "synthetic-auditor",
      toolId: "tool.repository.file.read",
      targetPaths: ["src/report.js"],
    });
    expect(auditor.decision).toMatchObject({
      allowed: false,
      reasonCode: "MISSING_REQUIRED_SCOPE",
    });
    expect(auditor.decision.explanation).toContain("tool:invoke");
  });

  it("prevents delegation from escalating beyond the initiating persona", async () => {
    const context = await action({
      personaId: "synthetic-auditor",
      toolId: "tool.repository.file.read",
      targetPaths: ["src/report.js"],
    });
    const request = {
      ...context.request,
      identity: {
        ...context.request.identity,
        grantedScopes: [...context.request.identity.grantedScopes, "tool:invoke" as const],
      },
    };
    const decision = evaluateAuthorization(request, registrySnapshot.approvalPolicies);
    expect(decision.reasonCode).toBe("DELEGATION_SCOPE_ESCALATION");
  });

  it("applies deny precedence and exact glob/path matching", async () => {
    expect(globMatches("src/report.js", "src/**")).toBe(true);
    expect(globMatches("test/report.test.js", "src/**")).toBe(false);

    const outside = await action({ targetPaths: ["docs/outside.md"] });
    expect(outside.decision).toMatchObject({
      allowed: false,
      reasonCode: "RESOURCE_BOUNDARY_DENY",
    });
    expect(outside.decision.matchedPolicy?.id).toBe("policy.write.outside-targets-deny");

    const network = await action({
      toolId: "tool.sandbox.command",
      targetPaths: [],
      networkAccess: true,
    });
    expect(network.decision).toMatchObject({ allowed: false, reasonCode: "POLICY_DENY" });
    expect(network.decision.matchedPolicy?.id).toBe("policy.sandbox.network-deny");
  });

  it("denies mutation of finalized evidence", async () => {
    const now = new Date().toISOString();
    const evidence = await authorizeRegistryAction({
      snapshot: registrySnapshot,
      persona: personaById("synthetic-implementer"),
      stageId: "implement",
      toolId: "tool.evidence.write",
      targetPaths: ["browser-local://evidence/FIN-1077.json"],
      approvedChangeTargets: ["browser-local://evidence/**"],
      networkAccess: false,
      evidenceFinalized: true,
      effectiveSubject: "FIN-1077",
      runId: "run.test.finalized-evidence",
      sessionId: "session.test.finalized-evidence",
      now,
      expiresAt: new Date(Date.parse(now) + 15 * 60 * 1000).toISOString(),
      decisionId: "decision.test.finalized-evidence",
    });
    expect(evidence.decision).toMatchObject({ allowed: false, reasonCode: "POLICY_DENY" });
    expect(evidence.decision.matchedPolicy?.id).toBe("policy.evidence.finalized-deny");
  });

  it("requires a distinct authorized human and a reason", async () => {
    const pending = await pendingPatch();
    const selfApprovalPolicy = {
      ...pending.policy,
      requiredApproverPersonas: ["synthetic-implementer"],
      requiredApproverScopes: ["artifact:write"],
    };
    await expect(
      decideApprovalRequest({
        store: pending.store,
        requestId: pending.requestId,
        status: "APPROVED",
        actor: personaById("synthetic-implementer"),
        reason: "Self approval attempt",
        decidedAt: "2026-07-17T15:00:05.000Z",
        policy: selfApprovalPolicy,
      }),
    ).rejects.toThrow("Self-approval is forbidden");
    await expect(
      decideApprovalRequest({
        store: pending.store,
        requestId: pending.requestId,
        status: "APPROVED",
        actor: personaById("synthetic-code-reviewer"),
        reason: "",
        decidedAt: "2026-07-17T15:00:05.000Z",
        policy: pending.policy,
      }),
    ).rejects.toThrow("reason is required");
    const rejected = await decideApprovalRequest({
      store: pending.store,
      requestId: pending.requestId,
      status: "REJECTED",
      actor: personaById("synthetic-code-reviewer"),
      reason: "Synthetic patch requires revision.",
      decidedAt: "2026-07-17T15:00:05.000Z",
      policy: pending.policy,
    });
    expect(rejected.requests[pending.requestId]?.status).toBe("REJECTED");
  });

  it("explains requester, reviewer, and administrator approval eligibility from shared domain logic", async () => {
    const pending = await pendingPatch();
    const request = pending.store.requests[pending.requestId];
    if (!request) throw new Error("Pending request missing.");

    expect(
      evaluateApprovalEligibility({
        request,
        policy: pending.policy,
        persona: personaById("synthetic-implementer"),
      }),
    ).toMatchObject({ allowed: false, reasonCode: "SELF_APPROVAL_FORBIDDEN" });
    expect(
      evaluateApprovalEligibility({
        request,
        policy: pending.policy,
        persona: personaById("synthetic-code-reviewer"),
      }),
    ).toMatchObject({ allowed: true, reasonCode: "ELIGIBLE_DISTINCT_REVIEWER" });
    expect(
      evaluateApprovalEligibility({
        request,
        policy: pending.policy,
        persona: personaById("synthetic-platform-admin"),
      }),
    ).toMatchObject({ allowed: false, reasonCode: "PERSONA_NOT_ALLOWED" });
  });

  it("expires pending decisions and enforces decision-cache TTL", async () => {
    const pending = await pendingPatch();
    const expired = await decideApprovalRequest({
      store: pending.store,
      requestId: pending.requestId,
      status: "APPROVED",
      actor: personaById("synthetic-code-reviewer"),
      reason: "Late decision",
      decidedAt: "2026-07-17T16:00:01.000Z",
      policy: pending.policy,
    });
    expect(expired.requests[pending.requestId]?.status).toBe("EXPIRED");

    const approved = await decideApprovalRequest({
      store: pending.store,
      requestId: pending.requestId,
      status: "APPROVED",
      actor: personaById("synthetic-code-reviewer"),
      reason: "Bound target reviewed.",
      decidedAt: "2026-07-17T15:00:05.000Z",
      policy: pending.policy,
    });
    const request = approved.requests[pending.requestId];
    if (!request) throw new Error("Approved request missing.");
    const resume = validateApprovalForResume({
      request,
      binding: request.binding,
      policy: pending.policy,
      approver: personaById("synthetic-code-reviewer"),
      now: "2026-07-17T15:05:06.000Z",
    });
    expect(resume).toMatchObject({ allowed: false, reasonCode: "APPROVAL_CACHE_EXPIRED" });
  });

  it("binds approvals to arguments, versions, change targets, and context", async () => {
    const pending = await pendingPatch();
    const approved = await decideApprovalRequest({
      store: pending.store,
      requestId: pending.requestId,
      status: "APPROVED",
      actor: personaById("synthetic-code-reviewer"),
      reason: "Bound target reviewed.",
      decidedAt: "2026-07-17T15:00:05.000Z",
      policy: pending.policy,
    });
    const request = approved.requests[pending.requestId];
    if (!request) throw new Error("Approved request missing.");

    const argumentMismatch = validateApprovalForResume({
      request,
      binding: {
        ...request.binding,
        proposedArgumentsHash: await proposedArgumentsHash({
          ...PATCH_ARGUMENTS,
          replacement: "different",
        }),
      },
      policy: pending.policy,
      approver: personaById("synthetic-code-reviewer"),
      now: "2026-07-17T15:00:06.000Z",
    });
    expect(argumentMismatch).toMatchObject({
      allowed: false,
      reasonCode: "APPROVAL_BINDING_MISMATCH",
    });

    const versionMismatch = validateApprovalForResume({
      request,
      binding: { ...request.binding, tool: { ...request.binding.tool, version: "2.0.0" } },
      policy: pending.policy,
      approver: personaById("synthetic-code-reviewer"),
      now: "2026-07-17T15:00:06.000Z",
    });
    expect(versionMismatch).toMatchObject({
      allowed: false,
      reasonCode: "APPROVAL_BINDING_MISMATCH",
    });
    for (const binding of [
      { ...request.binding, agent: { ...request.binding.agent, version: "2.0.0" } },
      { ...request.binding, changeTargetDigest: "c".repeat(64) },
      { ...request.binding, contextPackDigest: "d".repeat(64) },
    ]) {
      expect(
        validateApprovalForResume({
          request,
          binding,
          policy: pending.policy,
          approver: personaById("synthetic-code-reviewer"),
          now: "2026-07-17T15:00:06.000Z",
        }),
      ).toMatchObject({ allowed: false, reasonCode: "APPROVAL_BINDING_MISMATCH" });
    }
    expect(await verifyApprovalEventLog(approved.events)).toBe(true);
  });

  it("keeps administrators out of release approval and AI out of human personas", async () => {
    const release = await authorizeRegistryAction({
      snapshot: registrySnapshot,
      persona: personaById("synthetic-platform-admin"),
      stageId: "review",
      toolId: "tool.workflow.release-readiness",
      targetPaths: [],
      approvedChangeTargets: [],
      networkAccess: false,
      evidenceFinalized: true,
      effectiveSubject: "FIN-1150",
      runId: "run.test.release",
      sessionId: "session.test.release",
      now: NOW,
      expiresAt: "2026-07-17T15:15:00.000Z",
      decisionId: "decision.test.release",
    });
    expect(release.decision).toMatchObject({
      allowed: false,
      reasonCode: "MISSING_REQUIRED_SCOPE",
    });
    expect(PERSONAS.some((persona) => persona.id.includes("agent"))).toBe(false);
    expect(
      registrySnapshot.agents.find((agent) => agent.id === "agent.review-assistant")?.description,
    ).toContain("cannot grant");
  });
});
