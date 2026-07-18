import type {
  ApprovalMode,
  ApprovalPolicy,
  RegistryReference,
} from "../control-plane/registry/contracts";
import type { StageId } from "../data/types";

export const SCOPES = [
  "issue:read",
  "artifact:read",
  "artifact:write",
  "registry:read",
  "registry:manage",
  "tool:invoke",
  "sandbox:execute",
  "diff:review",
  "validation:approve",
  "policy:manage",
  "evidence:read",
] as const;

export type Scope = (typeof SCOPES)[number];
export type PersonaId =
  | "synthetic-implementer"
  | "synthetic-code-reviewer"
  | "synthetic-validator"
  | "synthetic-platform-admin"
  | "synthetic-auditor";

export type SyntheticPersona = {
  readonly id: PersonaId;
  readonly name: string;
  readonly shortName: string;
  readonly description: string;
  readonly scopes: readonly Scope[];
};

export type DelegationLink = {
  readonly delegator: PersonaId;
  readonly delegate: string;
  readonly grantedScopes: readonly Scope[];
  readonly delegatedAt: string;
  readonly expiresAt: string;
};

export type DelegatedIdentityEnvelope = {
  readonly envelopeVersion: 1;
  readonly initiatingHumanActor: PersonaId;
  readonly effectiveSubject: string;
  readonly executingAgent: RegistryReference;
  readonly grantedScopes: readonly Scope[];
  readonly delegationChain: readonly DelegationLink[];
  readonly runId: string;
  readonly sessionId: string;
  readonly expiresAt: string;
  readonly policyDecisionId: string;
};

export type AuthorizationRequest = {
  readonly persona: SyntheticPersona;
  readonly identity: DelegatedIdentityEnvelope;
  readonly stageId: Exclude<StageId, "seed">;
  readonly agent: {
    readonly id: string;
    readonly version: string;
    readonly contentHash: string;
    readonly status: string;
    readonly stageId: Exclude<StageId, "seed">;
    readonly allowedToolIds: readonly string[];
    readonly allowedWritePaths: readonly string[];
  };
  readonly tool: {
    readonly id: string;
    readonly version: string;
    readonly contentHash: string;
    readonly status: string;
    readonly riskLevel: string;
    readonly requiredScopes: readonly string[];
    readonly allowedStages: readonly Exclude<StageId, "seed">[];
    readonly networkRequired: boolean;
    readonly filesystemBoundary: {
      readonly mode: "NONE" | "READ_ONLY" | "BOUNDED_WRITE";
      readonly allowedPaths: readonly string[];
    };
  };
  readonly targetPaths: readonly string[];
  readonly approvedChangeTargets: readonly string[];
  readonly networkAccess: boolean;
  readonly evidenceFinalized: boolean;
  readonly registryIntegrity: {
    readonly agentHashValid: boolean;
    readonly toolHashValid: boolean;
  };
  readonly now: string;
};

export type AuthorizationReasonCode =
  | "POLICY_ALLOW"
  | "POLICY_NOTIFY"
  | "POLICY_REQUIRES_APPROVAL"
  | "POLICY_DENY"
  | "IDENTITY_EXPIRED"
  | "IDENTITY_ACTOR_MISMATCH"
  | "DELEGATION_SCOPE_ESCALATION"
  | "REGISTRY_RESOURCE_NOT_APPROVED"
  | "REGISTRY_HASH_INVALID"
  | "AGENT_STAGE_MISMATCH"
  | "TOOL_NOT_ALLOWED_FOR_AGENT"
  | "TOOL_NOT_ALLOWED_FOR_STAGE"
  | "MISSING_REQUIRED_SCOPE"
  | "MISSING_TARGET_PATHS"
  | "RESOURCE_BOUNDARY_DENY"
  | "NO_MATCHING_POLICY";

export type AuthorizationDecision = {
  readonly decisionId: string;
  readonly allowed: boolean;
  readonly mode: ApprovalMode;
  readonly reasonCode: AuthorizationReasonCode;
  readonly explanation: string;
  readonly effectiveScopes: readonly Scope[];
  readonly matchedPolicy: ApprovalPolicy | null;
  readonly evaluatedAt: string;
};

export const APPROVAL_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
  "INVALIDATED",
] as const;
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type ApprovalEventType = "REQUESTED" | "APPROVED" | "REJECTED" | "EXPIRED" | "INVALIDATED";

export type ApprovalBinding = {
  readonly proposedArgumentsHash: string;
  readonly agent: RegistryReference;
  readonly tool: RegistryReference;
  readonly changeTargetDigest: string;
  readonly contextPackDigest: string;
};

export type ApprovalRequest = {
  readonly schemaVersion: 1;
  readonly requestId: string;
  readonly runId: string;
  readonly stage: Exclude<StageId, "seed">;
  readonly agent: RegistryReference;
  readonly tool: RegistryReference;
  readonly proposedToolArgumentsHash: string;
  readonly targetPaths: readonly string[];
  readonly requesterActor: PersonaId;
  readonly effectiveSubject: string;
  readonly identityEnvelope: DelegatedIdentityEnvelope;
  readonly policy: {
    readonly id: string;
    readonly version: string;
    readonly contentHash: string;
  };
  readonly binding: ApprovalBinding;
  readonly status: ApprovalStatus;
  readonly requestedAt: string;
  readonly expiresAt: string;
  readonly decidedAt?: string;
  readonly decisionActor?: PersonaId;
  readonly decisionReason?: string;
  readonly decisionContentHash?: string;
};

export type ApprovalEvent = {
  readonly schemaVersion: 1;
  readonly eventId: string;
  readonly requestId: string;
  readonly sequence: number;
  readonly type: ApprovalEventType;
  readonly timestamp: string;
  readonly actor: PersonaId;
  readonly reason: string;
  readonly previousEventHash: string | null;
  readonly contentHash: string;
};

export type ApprovalStore = {
  readonly version: 1;
  readonly requests: Readonly<Record<string, ApprovalRequest>>;
  readonly events: readonly ApprovalEvent[];
};

export type ResumeBinding = ApprovalBinding;

export type ApprovalResumeDecision =
  | { readonly allowed: true; readonly reasonCode: "BOUND_APPROVAL_CURRENT" }
  | {
      readonly allowed: false;
      readonly reasonCode:
        | "APPROVAL_NOT_APPROVED"
        | "APPROVAL_EXPIRED"
        | "APPROVAL_CACHE_EXPIRED"
        | "APPROVAL_BINDING_MISMATCH"
        | "APPROVER_NO_LONGER_AUTHORIZED";
      readonly detail: string;
    };
