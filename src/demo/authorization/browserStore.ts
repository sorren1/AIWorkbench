import { EMPTY_APPROVAL_STORE } from "./approvalProtocol";
import type {
  ApprovalEvent,
  ApprovalRequest,
  ApprovalStatus,
  ApprovalStore,
  DelegatedIdentityEnvelope,
  PersonaId,
  Scope,
} from "./contracts";
import { DEFAULT_PERSONA_ID, isPersonaId, isScope } from "./personas";

export const AUTHORIZATION_STORAGE_KEY = "ai-delivery-workbench.authorization.v1";

export type BrowserAuthorizationState = {
  readonly version: 1;
  readonly personaId: PersonaId;
  readonly approvalStore: ApprovalStore;
};

export function createBaselineAuthorizationState(): BrowserAuthorizationState {
  return { version: 1, personaId: DEFAULT_PERSONA_ID, approvalStore: EMPTY_APPROVAL_STORE };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isScopeArray(value: unknown): value is Scope[] {
  return isStringArray(value) && value.every(isScope);
}

function isApprovalStatus(value: unknown): value is ApprovalStatus {
  return (
    value === "PENDING" ||
    value === "APPROVED" ||
    value === "REJECTED" ||
    value === "EXPIRED" ||
    value === "INVALIDATED"
  );
}

function isRegistryReference(value: unknown): boolean {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.version === "string" &&
    typeof value.contentHash === "string"
  );
}

function isIdentityEnvelope(value: unknown): value is DelegatedIdentityEnvelope {
  return (
    isRecord(value) &&
    value.envelopeVersion === 1 &&
    typeof value.initiatingHumanActor === "string" &&
    isPersonaId(value.initiatingHumanActor) &&
    typeof value.effectiveSubject === "string" &&
    isRegistryReference(value.executingAgent) &&
    isScopeArray(value.grantedScopes) &&
    Array.isArray(value.delegationChain) &&
    value.delegationChain.every(
      (link) =>
        isRecord(link) &&
        typeof link.delegator === "string" &&
        isPersonaId(link.delegator) &&
        typeof link.delegate === "string" &&
        isScopeArray(link.grantedScopes) &&
        typeof link.delegatedAt === "string" &&
        typeof link.expiresAt === "string",
    ) &&
    typeof value.runId === "string" &&
    typeof value.sessionId === "string" &&
    typeof value.expiresAt === "string" &&
    typeof value.policyDecisionId === "string"
  );
}

function isApprovalRequest(value: unknown): value is ApprovalRequest {
  if (!isRecord(value)) return false;
  return (
    value.schemaVersion === 1 &&
    typeof value.requestId === "string" &&
    typeof value.runId === "string" &&
    (value.stage === "intake" ||
      value.stage === "spec" ||
      value.stage === "plan" ||
      value.stage === "targets" ||
      value.stage === "implement" ||
      value.stage === "verify" ||
      value.stage === "review") &&
    isRegistryReference(value.agent) &&
    isRegistryReference(value.tool) &&
    typeof value.proposedToolArgumentsHash === "string" &&
    isStringArray(value.targetPaths) &&
    typeof value.requesterActor === "string" &&
    isPersonaId(value.requesterActor) &&
    typeof value.effectiveSubject === "string" &&
    isIdentityEnvelope(value.identityEnvelope) &&
    isRecord(value.policy) &&
    typeof value.policy.id === "string" &&
    typeof value.policy.version === "string" &&
    typeof value.policy.contentHash === "string" &&
    isRecord(value.binding) &&
    typeof value.binding.proposedArgumentsHash === "string" &&
    isRegistryReference(value.binding.agent) &&
    isRegistryReference(value.binding.tool) &&
    typeof value.binding.changeTargetDigest === "string" &&
    typeof value.binding.contextPackDigest === "string" &&
    isApprovalStatus(value.status) &&
    typeof value.requestedAt === "string" &&
    typeof value.expiresAt === "string" &&
    (value.decidedAt === undefined || typeof value.decidedAt === "string") &&
    (value.decisionActor === undefined ||
      (typeof value.decisionActor === "string" && isPersonaId(value.decisionActor))) &&
    (value.decisionReason === undefined || typeof value.decisionReason === "string") &&
    (value.decisionContentHash === undefined || typeof value.decisionContentHash === "string")
  );
}

function isApprovalEvent(value: unknown): value is ApprovalEvent {
  return (
    isRecord(value) &&
    value.schemaVersion === 1 &&
    typeof value.eventId === "string" &&
    typeof value.requestId === "string" &&
    typeof value.sequence === "number" &&
    (value.type === "REQUESTED" ||
      value.type === "APPROVED" ||
      value.type === "REJECTED" ||
      value.type === "EXPIRED" ||
      value.type === "INVALIDATED") &&
    typeof value.timestamp === "string" &&
    typeof value.actor === "string" &&
    isPersonaId(value.actor) &&
    typeof value.reason === "string" &&
    (value.previousEventHash === null || typeof value.previousEventHash === "string") &&
    typeof value.contentHash === "string"
  );
}

function isApprovalStore(value: unknown): value is ApprovalStore {
  return (
    isRecord(value) &&
    value.version === 1 &&
    isRecord(value.requests) &&
    Object.values(value.requests).every(isApprovalRequest) &&
    Array.isArray(value.events) &&
    value.events.every(isApprovalEvent)
  );
}

export function readBrowserAuthorizationState(storage: Storage): BrowserAuthorizationState {
  const fallback = createBaselineAuthorizationState();
  const raw = storage.getItem(AUTHORIZATION_STORAGE_KEY);
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isRecord(parsed) || parsed.version !== 1) return fallback;
    if (typeof parsed.personaId !== "string" || !isPersonaId(parsed.personaId)) return fallback;
    if (!isApprovalStore(parsed.approvalStore)) return fallback;
    return { version: 1, personaId: parsed.personaId, approvalStore: parsed.approvalStore };
  } catch {
    return fallback;
  }
}

export function writeBrowserAuthorizationState(
  storage: Storage,
  state: BrowserAuthorizationState,
): void {
  storage.setItem(AUTHORIZATION_STORAGE_KEY, JSON.stringify(state));
}

export function clearBrowserAuthorizationState(storage: Storage): void {
  storage.removeItem(AUTHORIZATION_STORAGE_KEY);
}
