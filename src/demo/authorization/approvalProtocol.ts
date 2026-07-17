import { canonicalJson, sha256Hex } from "../control-plane/registry/canonical";
import type { ApprovalPolicy } from "../control-plane/registry/contracts";
import type {
  ApprovalBinding,
  ApprovalEvent,
  ApprovalEventType,
  ApprovalRequest,
  ApprovalResumeDecision,
  ApprovalStatus,
  ApprovalStore,
  AuthorizationDecision,
  DelegatedIdentityEnvelope,
  PersonaId,
  ResumeBinding,
  SyntheticPersona,
} from "./contracts";

export const EMPTY_APPROVAL_STORE: ApprovalStore = { version: 1, requests: {}, events: [] };

function addSeconds(timestamp: string, seconds: number): string {
  return new Date(Date.parse(timestamp) + seconds * 1000).toISOString();
}

function eventHashInput(event: Omit<ApprovalEvent, "contentHash">): unknown {
  return event;
}

async function createEvent(options: {
  readonly requestId: string;
  readonly sequence: number;
  readonly type: ApprovalEventType;
  readonly timestamp: string;
  readonly actor: PersonaId;
  readonly reason: string;
  readonly previousEventHash: string | null;
}): Promise<ApprovalEvent> {
  const source = {
    schemaVersion: 1 as const,
    eventId: `event.${options.requestId}.${options.sequence}`,
    ...options,
  };
  return { ...source, contentHash: await sha256Hex(eventHashInput(source)) };
}

function replaceRequest(
  store: ApprovalStore,
  request: ApprovalRequest,
  event: ApprovalEvent,
): ApprovalStore {
  return {
    version: 1,
    requests: { ...store.requests, [request.requestId]: request },
    events: [...store.events, event],
  };
}

export async function proposedArgumentsHash(argumentsValue: unknown): Promise<string> {
  return sha256Hex(argumentsValue);
}

export async function createBoundApprovalRequest(options: {
  readonly requestId: string;
  readonly identity: DelegatedIdentityEnvelope;
  readonly decision: AuthorizationDecision;
  readonly tool: ApprovalBinding["tool"];
  readonly stage: ApprovalRequest["stage"];
  readonly argumentsValue: unknown;
  readonly targetPaths: readonly string[];
  readonly changeTargetDigest: string;
  readonly contextPackDigest: string;
  readonly requestedAt: string;
}): Promise<{ readonly request: ApprovalRequest; readonly event: ApprovalEvent }> {
  const policy = options.decision.matchedPolicy;
  if (options.decision.mode !== "REQUIRE_APPROVAL" || !policy) {
    throw new Error("An approval request can only be created from REQUIRE_APPROVAL policy output.");
  }
  const argumentsHash = await proposedArgumentsHash(options.argumentsValue);
  const binding: ApprovalBinding = {
    proposedArgumentsHash: argumentsHash,
    agent: options.identity.executingAgent,
    tool: options.tool,
    changeTargetDigest: options.changeTargetDigest,
    contextPackDigest: options.contextPackDigest,
  };
  const request: ApprovalRequest = {
    schemaVersion: 1,
    requestId: options.requestId,
    runId: options.identity.runId,
    stage: options.stage,
    agent: options.identity.executingAgent,
    tool: options.tool,
    proposedToolArgumentsHash: argumentsHash,
    targetPaths: options.targetPaths,
    requesterActor: options.identity.initiatingHumanActor,
    effectiveSubject: options.identity.effectiveSubject,
    identityEnvelope: options.identity,
    policy: { id: policy.id, version: policy.version, contentHash: policy.contentHash },
    binding,
    status: "PENDING",
    requestedAt: options.requestedAt,
    expiresAt: addSeconds(options.requestedAt, policy.timeoutSeconds),
  };
  const event = await createEvent({
    requestId: request.requestId,
    sequence: 1,
    type: "REQUESTED",
    timestamp: options.requestedAt,
    actor: request.requesterActor,
    reason: options.decision.explanation,
    previousEventHash: null,
  });
  return { request, event };
}

export function addApprovalRequest(
  store: ApprovalStore,
  created: { readonly request: ApprovalRequest; readonly event: ApprovalEvent },
): ApprovalStore {
  if (store.requests[created.request.requestId]) {
    throw new Error(`Approval request already exists: ${created.request.requestId}`);
  }
  return replaceRequest(store, created.request, created.event);
}

function decisionEventType(
  status: Extract<ApprovalStatus, "APPROVED" | "REJECTED">,
): ApprovalEventType {
  return status;
}

export async function decideApprovalRequest(options: {
  readonly store: ApprovalStore;
  readonly requestId: string;
  readonly status: Extract<ApprovalStatus, "APPROVED" | "REJECTED">;
  readonly actor: SyntheticPersona;
  readonly reason: string;
  readonly decidedAt: string;
  readonly policy: ApprovalPolicy;
}): Promise<ApprovalStore> {
  const request = options.store.requests[options.requestId];
  if (!request) throw new Error(`Unknown approval request: ${options.requestId}`);
  if (request.status !== "PENDING") throw new Error(`Approval request is ${request.status}.`);
  if (Date.parse(request.expiresAt) <= Date.parse(options.decidedAt)) {
    return transitionApprovalRequest({
      store: options.store,
      requestId: request.requestId,
      status: "EXPIRED",
      actor: options.actor.id,
      reason: "Approval timeout elapsed before a decision was recorded.",
      timestamp: options.decidedAt,
    });
  }
  if (!options.policy.requiredApproverPersonas.includes(options.actor.id)) {
    throw new Error(`${options.actor.id} is not an allowed approver for ${options.policy.id}.`);
  }
  const missingScopes = options.policy.requiredApproverScopes.filter(
    (scope) => !options.actor.scopes.some((candidate) => candidate === scope),
  );
  if (missingScopes.length > 0)
    throw new Error(`Approver is missing scope: ${missingScopes.join(", ")}.`);
  if (options.policy.forbidSelfApproval && request.requesterActor === options.actor.id) {
    throw new Error("Self-approval is forbidden by policy.");
  }
  if (options.policy.reasonRequired && !options.reason.trim()) {
    throw new Error("A decision reason is required by policy.");
  }
  const prior = options.store.events.filter((event) => event.requestId === request.requestId);
  const previousEventHash = prior.at(-1)?.contentHash ?? null;
  const event = await createEvent({
    requestId: request.requestId,
    sequence: prior.length + 1,
    type: decisionEventType(options.status),
    timestamp: options.decidedAt,
    actor: options.actor.id,
    reason: options.reason.trim(),
    previousEventHash,
  });
  const decided: ApprovalRequest = {
    ...request,
    status: options.status,
    decidedAt: options.decidedAt,
    decisionActor: options.actor.id,
    decisionReason: options.reason.trim(),
    decisionContentHash: event.contentHash,
  };
  return replaceRequest(options.store, decided, event);
}

export async function transitionApprovalRequest(options: {
  readonly store: ApprovalStore;
  readonly requestId: string;
  readonly status: Extract<ApprovalStatus, "EXPIRED" | "INVALIDATED">;
  readonly actor: PersonaId;
  readonly reason: string;
  readonly timestamp: string;
}): Promise<ApprovalStore> {
  const request = options.store.requests[options.requestId];
  if (!request) throw new Error(`Unknown approval request: ${options.requestId}`);
  const prior = options.store.events.filter((event) => event.requestId === request.requestId);
  const event = await createEvent({
    requestId: request.requestId,
    sequence: prior.length + 1,
    type: options.status,
    timestamp: options.timestamp,
    actor: options.actor,
    reason: options.reason,
    previousEventHash: prior.at(-1)?.contentHash ?? null,
  });
  return replaceRequest(
    options.store,
    {
      ...request,
      status: options.status,
      decidedAt: options.timestamp,
      decisionActor: options.actor,
      decisionReason: options.reason,
      decisionContentHash: event.contentHash,
    },
    event,
  );
}

function sameBinding(left: ApprovalBinding, right: ResumeBinding): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

export function validateApprovalForResume(options: {
  readonly request: ApprovalRequest;
  readonly binding: ResumeBinding;
  readonly policy: ApprovalPolicy;
  readonly approver: SyntheticPersona | null;
  readonly now: string;
}): ApprovalResumeDecision {
  if (options.request.status !== "APPROVED") {
    return {
      allowed: false,
      reasonCode: "APPROVAL_NOT_APPROVED",
      detail: `Approval is ${options.request.status}.`,
    };
  }
  if (Date.parse(options.request.expiresAt) <= Date.parse(options.now)) {
    return {
      allowed: false,
      reasonCode: "APPROVAL_EXPIRED",
      detail: "The approval request has expired.",
    };
  }
  if (options.policy.decisionCacheTtlSeconds !== undefined && options.request.decidedAt) {
    const cacheExpires =
      Date.parse(options.request.decidedAt) + options.policy.decisionCacheTtlSeconds * 1000;
    if (cacheExpires <= Date.parse(options.now)) {
      return {
        allowed: false,
        reasonCode: "APPROVAL_CACHE_EXPIRED",
        detail: "The cached decision TTL elapsed.",
      };
    }
  }
  if (!sameBinding(options.request.binding, options.binding)) {
    return {
      allowed: false,
      reasonCode: "APPROVAL_BINDING_MISMATCH",
      detail: "Arguments, agent, tool, change targets, or context pack changed after approval.",
    };
  }
  if (
    !options.approver ||
    !options.policy.requiredApproverPersonas.includes(options.approver.id) ||
    options.policy.requiredApproverScopes.some(
      (scope) => !options.approver?.scopes.some((candidate) => candidate === scope),
    )
  ) {
    return {
      allowed: false,
      reasonCode: "APPROVER_NO_LONGER_AUTHORIZED",
      detail: "The recorded decision actor no longer satisfies the approval policy.",
    };
  }
  return { allowed: true, reasonCode: "BOUND_APPROVAL_CURRENT" };
}

export async function verifyApprovalEventLog(events: readonly ApprovalEvent[]): Promise<boolean> {
  const byRequest = new Map<string, ApprovalEvent[]>();
  for (const event of events) {
    const current = byRequest.get(event.requestId) ?? [];
    current.push(event);
    byRequest.set(event.requestId, current);
  }
  for (const requestEvents of byRequest.values()) {
    const sorted = [...requestEvents].sort((left, right) => left.sequence - right.sequence);
    let previous: string | null = null;
    for (const event of sorted) {
      const { contentHash: _contentHash, ...source } = event;
      void _contentHash;
      if (
        event.previousEventHash !== previous ||
        (await sha256Hex(eventHashInput(source))) !== event.contentHash
      )
        return false;
      previous = event.contentHash;
    }
  }
  return true;
}
