import { hasValidContentHash } from "../control-plane/registry/canonical";
import type { RegistrySnapshot } from "../control-plane/registry/contracts";
import type { StageId } from "../data/types";
import type { AuthorizationDecision, AuthorizationRequest, SyntheticPersona } from "./contracts";
import { evaluateAuthorization } from "./engine";
import { createDelegatedIdentityEnvelope } from "./identity";

export type AuthorizedActionContext = {
  readonly request: AuthorizationRequest;
  readonly decision: AuthorizationDecision;
};

export async function authorizeRegistryAction(options: {
  readonly snapshot: RegistrySnapshot;
  readonly persona: SyntheticPersona;
  readonly stageId: Exclude<StageId, "seed">;
  readonly toolId: string;
  readonly targetPaths: readonly string[];
  readonly approvedChangeTargets: readonly string[];
  readonly networkAccess: boolean;
  readonly evidenceFinalized: boolean;
  readonly effectiveSubject: string;
  readonly runId: string;
  readonly sessionId: string;
  readonly now: string;
  readonly expiresAt: string;
  readonly decisionId: string;
}): Promise<AuthorizedActionContext> {
  const agent = options.snapshot.agents.find((candidate) => candidate.stageId === options.stageId);
  if (!agent || agent.status !== "APPROVED" || !(await hasValidContentHash(agent))) {
    throw new Error(`Registry denied action: no current approved agent for ${options.stageId}.`);
  }
  const tool = options.snapshot.tools.find((candidate) => candidate.id === options.toolId);
  if (
    !tool ||
    tool.status !== "APPROVED" ||
    !(await hasValidContentHash(tool)) ||
    !agent.allowedToolIds.includes(tool.id) ||
    !tool.allowedStages.includes(options.stageId)
  ) {
    throw new Error(
      `Registry denied action: ${options.toolId} is not executable in ${options.stageId}.`,
    );
  }
  const modelPolicy = options.snapshot.modelPolicies.find(
    (policy) => policy.id === agent.modelPolicyId,
  );
  const memoryPolicy = options.snapshot.memoryPolicies.find(
    (policy) => policy.id === agent.memoryPolicyId,
  );
  if (
    !modelPolicy ||
    modelPolicy.status !== "APPROVED" ||
    !(await hasValidContentHash(modelPolicy)) ||
    !memoryPolicy ||
    memoryPolicy.status !== "APPROVED" ||
    !(await hasValidContentHash(memoryPolicy))
  ) {
    throw new Error("Registry denied action: model or memory policy is not current and approved.");
  }
  const agentReference = {
    id: agent.id,
    version: agent.version,
    contentHash: agent.contentHash,
  };
  const identity = createDelegatedIdentityEnvelope({
    persona: options.persona,
    agent: agentReference,
    effectiveSubject: options.effectiveSubject,
    runId: options.runId,
    sessionId: options.sessionId,
    policyDecisionId: options.decisionId,
    now: options.now,
    expiresAt: options.expiresAt,
  });
  const request: AuthorizationRequest = {
    persona: options.persona,
    identity,
    stageId: options.stageId,
    agent,
    tool,
    targetPaths: options.targetPaths,
    approvedChangeTargets: options.approvedChangeTargets,
    networkAccess: options.networkAccess,
    evidenceFinalized: options.evidenceFinalized,
    registryIntegrity: {
      agentHashValid: await hasValidContentHash(agent),
      toolHashValid: await hasValidContentHash(tool),
    },
    now: options.now,
  };
  return {
    request,
    decision: evaluateAuthorization(request, options.snapshot.approvalPolicies),
  };
}
