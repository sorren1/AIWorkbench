import type { ApprovalRequest } from "../authorization/contracts";
import { authorizeRegistryAction } from "../authorization/authorizeAction";
import { personaById } from "../authorization/personas";
import { sha256Hex } from "../control-plane/registry/canonical";
import { registrySnapshot } from "../control-plane/registry/generated";
import { buildContextPack } from "../context/runtime";
import { recordedWalkthroughEvidence } from "../observability/recordedSummary.generated";
import type { WorkbenchActions } from "../state/store";

export const PRINCIPAL_REPLAY_ARGUMENTS = {
  path: "src/report.js",
  expected: "  return `Variance: ${actual - budget}`;",
  replacement:
    '  const difference = actual - budget;\n  const direction = difference >= 0 ? "over" : "under";\n  return `Variance: ${Math.abs(difference)} ${direction}`;',
} as const;

export function principalReplayRunId(): string {
  return `replay.${recordedWalkthroughEvidence?.runId ?? "recorded-sandbox-unavailable"}`;
}

export function isPrincipalReplayRequest(request: ApprovalRequest): boolean {
  return request.runId === principalReplayRunId();
}

export async function queuePrincipalApprovalReplay(
  actions: WorkbenchActions,
): Promise<ApprovalRequest> {
  const requestedAt = new Date().toISOString();
  const runId = principalReplayRunId();
  const targetPaths = [PRINCIPAL_REPLAY_ARGUMENTS.path];
  const approvedChangeTargets = ["src/**"];
  const context = await authorizeRegistryAction({
    snapshot: registrySnapshot,
    persona: personaById("synthetic-implementer"),
    stageId: "implement",
    toolId: "tool.repository.patch.controlled",
    targetPaths,
    approvedChangeTargets,
    networkAccess: false,
    evidenceFinalized: false,
    effectiveSubject: "synthetic-toy-repository",
    runId,
    sessionId: "session.browser.principal-walkthrough",
    now: requestedAt,
    expiresAt: new Date(Date.parse(requestedAt) + 30 * 60 * 1000).toISOString(),
    decisionId: "decision.browser.principal-walkthrough.patch",
  });
  if (context.decision.mode !== "REQUIRE_APPROVAL") {
    throw new Error(`Expected a human approval pause; received ${context.decision.reasonCode}.`);
  }
  const contextPack = await buildContextPack("synthetic-toy-repository", "implement");
  return actions.queueApproval({
    context,
    argumentsValue: PRINCIPAL_REPLAY_ARGUMENTS,
    targetPaths,
    changeTargetDigest: await sha256Hex(approvedChangeTargets),
    contextPackDigest: contextPack.packDigest,
    requestedAt,
  });
}
