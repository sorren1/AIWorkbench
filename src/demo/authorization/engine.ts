import type { ApprovalPolicy, ApprovalPolicyMatcher } from "../control-plane/registry/contracts";
import type {
  AuthorizationDecision,
  AuthorizationReasonCode,
  AuthorizationRequest,
  DelegatedIdentityEnvelope,
  Scope,
  SyntheticPersona,
} from "./contracts";
import { isScope } from "./personas";

const STAGE_SCOPES: Readonly<Record<AuthorizationRequest["stageId"], readonly Scope[]>> = {
  intake: ["issue:read", "artifact:write", "registry:read", "tool:invoke"],
  spec: ["issue:read", "artifact:read", "artifact:write", "registry:read", "tool:invoke"],
  plan: ["issue:read", "artifact:read", "artifact:write", "registry:read", "tool:invoke"],
  targets: ["artifact:read", "artifact:write", "registry:read", "tool:invoke", "diff:review"],
  implement: [
    "artifact:read",
    "artifact:write",
    "registry:read",
    "tool:invoke",
    "sandbox:execute",
    "diff:review",
    "evidence:read",
  ],
  verify: [
    "artifact:read",
    "artifact:write",
    "registry:read",
    "tool:invoke",
    "sandbox:execute",
    "diff:review",
    "evidence:read",
  ],
  review: [
    "artifact:read",
    "registry:read",
    "tool:invoke",
    "diff:review",
    "validation:approve",
    "evidence:read",
  ],
};

const MODE_PRECEDENCE = { ALLOW: 0, NOTIFY: 1, REQUIRE_APPROVAL: 2, DENY: 3 } as const;

export function globMatches(value: string, pattern: string): boolean {
  const normalizedValue = value.replaceAll("\\", "/");
  const normalizedPattern = pattern.replaceAll("\\", "/");
  const escaped = normalizedPattern.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  const expression = escaped
    .replaceAll("**", "\u0000")
    .replaceAll("*", "[^/]*")
    .replaceAll("\u0000", ".*");
  return new RegExp(`^${expression}$`).test(normalizedValue);
}

function allPathsAllowed(paths: readonly string[], patterns: readonly string[]): boolean {
  if (paths.length === 0) return true;
  if (patterns.length === 0) return false;
  return paths.every((path) => patterns.some((pattern) => globMatches(path, pattern)));
}

function effectiveScopes(
  persona: SyntheticPersona,
  identity: DelegatedIdentityEnvelope,
  stageScopes: readonly Scope[],
): readonly Scope[] {
  const sets = [
    new Set(persona.scopes),
    new Set(identity.grantedScopes),
    new Set(stageScopes),
    ...identity.delegationChain.map((link) => new Set(link.grantedScopes)),
  ];
  return persona.scopes.filter((scope) => sets.every((set) => set.has(scope)));
}

function matcherMatches(
  matcher: ApprovalPolicyMatcher,
  request: AuthorizationRequest,
  insideBoundary: boolean,
): boolean {
  if (matcher.toolIds && !matcher.toolIds.some((pattern) => globMatches(request.tool.id, pattern)))
    return false;
  if (matcher.stages && !matcher.stages.includes(request.stageId)) return false;
  if (matcher.riskLevels && !matcher.riskLevels.some((risk) => risk === request.tool.riskLevel))
    return false;
  if (
    matcher.agentIds &&
    !matcher.agentIds.some((pattern) => globMatches(request.agent.id, pattern))
  )
    return false;
  if (
    matcher.pathPatterns &&
    request.targetPaths.length > 0 &&
    !allPathsAllowed(request.targetPaths, matcher.pathPatterns)
  )
    return false;
  if (
    matcher.pathBoundary &&
    matcher.pathBoundary !==
      (insideBoundary ? "INSIDE_APPROVED_TARGETS" : "OUTSIDE_APPROVED_TARGETS")
  )
    return false;
  if (matcher.networkAccess !== undefined && matcher.networkAccess !== request.networkAccess)
    return false;
  if (
    matcher.evidenceFinalized !== undefined &&
    matcher.evidenceFinalized !== request.evidenceFinalized
  )
    return false;
  return true;
}

function denied(
  request: AuthorizationRequest,
  reasonCode: AuthorizationReasonCode,
  explanation: string,
  scopes: readonly Scope[] = [],
  policy: ApprovalPolicy | null = null,
): AuthorizationDecision {
  return {
    decisionId: request.identity.policyDecisionId,
    allowed: false,
    mode: "DENY",
    reasonCode,
    explanation,
    effectiveScopes: scopes,
    matchedPolicy: policy,
    evaluatedAt: request.now,
  };
}

export function evaluateAuthorization(
  request: AuthorizationRequest,
  policies: readonly ApprovalPolicy[],
): AuthorizationDecision {
  if (Date.parse(request.identity.expiresAt) <= Date.parse(request.now)) {
    return denied(request, "IDENTITY_EXPIRED", "The delegated identity envelope has expired.");
  }
  if (request.identity.initiatingHumanActor !== request.persona.id) {
    return denied(
      request,
      "IDENTITY_ACTOR_MISMATCH",
      "The selected persona does not match the initiating human actor.",
    );
  }
  if (
    request.identity.executingAgent.id !== request.agent.id ||
    request.identity.executingAgent.version !== request.agent.version ||
    request.identity.executingAgent.contentHash !== request.agent.contentHash
  ) {
    return denied(
      request,
      "IDENTITY_ACTOR_MISMATCH",
      "The executing agent does not match the identity envelope.",
    );
  }
  const personaScopeSet = new Set(request.persona.scopes);
  const delegationEscalated =
    request.identity.grantedScopes.some((scope) => !personaScopeSet.has(scope)) ||
    request.identity.delegationChain.some((link) =>
      link.grantedScopes.some((scope) => !personaScopeSet.has(scope)),
    );
  if (delegationEscalated) {
    return denied(
      request,
      "DELEGATION_SCOPE_ESCALATION",
      "Delegation attempted to grant authority absent from the initiating persona.",
    );
  }
  if (request.agent.status !== "APPROVED" || request.tool.status !== "APPROVED") {
    return denied(
      request,
      "REGISTRY_RESOURCE_NOT_APPROVED",
      "Only approved agent and tool versions can be authorized.",
    );
  }
  if (!request.registryIntegrity.agentHashValid || !request.registryIntegrity.toolHashValid) {
    return denied(
      request,
      "REGISTRY_HASH_INVALID",
      "Agent or tool content no longer matches its approved hash.",
    );
  }
  if (request.agent.stageId !== request.stageId) {
    return denied(
      request,
      "AGENT_STAGE_MISMATCH",
      `Agent ${request.agent.id} is not registered for ${request.stageId}.`,
    );
  }
  if (!request.agent.allowedToolIds.includes(request.tool.id)) {
    return denied(
      request,
      "TOOL_NOT_ALLOWED_FOR_AGENT",
      `${request.tool.id} is not declared by ${request.agent.id}.`,
    );
  }
  if (!request.tool.allowedStages.includes(request.stageId)) {
    return denied(
      request,
      "TOOL_NOT_ALLOWED_FOR_STAGE",
      `${request.tool.id} is not allowed during ${request.stageId}.`,
    );
  }

  const scopes = effectiveScopes(request.persona, request.identity, STAGE_SCOPES[request.stageId]);
  const requiredScopes = request.tool.requiredScopes.filter(isScope);
  const unknownScopes = request.tool.requiredScopes.filter((scope) => !isScope(scope));
  const missingScopes = requiredScopes.filter((scope) => !scopes.includes(scope));
  if (unknownScopes.length > 0 || missingScopes.length > 0) {
    const missing = [...unknownScopes, ...missingScopes].join(", ");
    return denied(
      request,
      "MISSING_REQUIRED_SCOPE",
      `Missing required scope${missing.includes(",") ? "s" : ""}: ${missing}.`,
      scopes,
    );
  }

  const writeBoundaryRequired = request.tool.filesystemBoundary.mode === "BOUNDED_WRITE";
  const insideBoundary =
    !writeBoundaryRequired ||
    (allPathsAllowed(request.targetPaths, request.tool.filesystemBoundary.allowedPaths) &&
      allPathsAllowed(request.targetPaths, request.agent.allowedWritePaths) &&
      allPathsAllowed(request.targetPaths, request.approvedChangeTargets));

  const matching = policies
    .filter((policy) => policy.enabled && matcherMatches(policy.matcher, request, insideBoundary))
    .sort((left, right) => MODE_PRECEDENCE[right.mode] - MODE_PRECEDENCE[left.mode]);
  const policy = matching[0] ?? null;
  if (!policy)
    return denied(
      request,
      "NO_MATCHING_POLICY",
      "No enabled policy authorizes this exact action.",
      scopes,
    );
  if (!insideBoundary) {
    return denied(
      request,
      "RESOURCE_BOUNDARY_DENY",
      "The target path is outside the intersection of the agent, tool, and approved change-target boundaries.",
      scopes,
      policy,
    );
  }
  if (policy.mode === "DENY") {
    return denied(request, "POLICY_DENY", `Denied by ${policy.id}.`, scopes, policy);
  }
  if (policy.mode === "REQUIRE_APPROVAL") {
    return {
      decisionId: request.identity.policyDecisionId,
      allowed: false,
      mode: policy.mode,
      reasonCode: "POLICY_REQUIRES_APPROVAL",
      explanation: `${policy.id} requires a bound decision from ${policy.requiredApproverPersonas.join(", ")}.`,
      effectiveScopes: scopes,
      matchedPolicy: policy,
      evaluatedAt: request.now,
    };
  }
  return {
    decisionId: request.identity.policyDecisionId,
    allowed: true,
    mode: policy.mode,
    reasonCode: policy.mode === "NOTIFY" ? "POLICY_NOTIFY" : "POLICY_ALLOW",
    explanation: `${policy.mode === "NOTIFY" ? "Allowed with notification" : "Allowed"} by ${policy.id}.`,
    effectiveScopes: scopes,
    matchedPolicy: policy,
    evaluatedAt: request.now,
  };
}
