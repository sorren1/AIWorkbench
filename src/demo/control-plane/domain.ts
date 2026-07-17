import type { StageId } from "../data/types";

export type RegistryLifecycle =
  "draft" | "in_review" | "approved" | "rejected" | "deprecated" | "disabled";
export type ToolRisk = "read_only" | "bounded_write" | "privileged";
export type PolicyEffect = "allow" | "deny" | "require_approval";
export type MeasurementBasis =
  | "measured"
  | "provider_reported"
  | "calculated"
  | "estimated"
  | "simulated_fixture"
  | "not_available";

export type Provenance = {
  sourceRevision: string;
  authoredAt: string;
  authoredByPersona: string;
  contentDigest: string;
};

export type VersionReference = {
  id: string;
  version: string;
  digest: string;
};

export type StageAgentVersion = VersionReference & {
  stageId: StageId;
  purpose: string;
  lifecycle: RegistryLifecycle;
  capabilityCard: VersionReference;
  provenance: Provenance;
  supersedes: VersionReference | null;
};

export type ToolVersion = VersionReference & {
  lifecycle: RegistryLifecycle;
  risk: ToolRisk;
  inputSchemaRef: string;
  outputSchemaRef: string;
  boundary: string;
  approvalRuleRef: string | null;
  provenance: Provenance;
};

export type BudgetLimit = {
  amount: number;
  unit: "tokens" | "estimated_usd" | "iterations" | "tool_calls" | "retries" | "milliseconds";
};

export type CapabilityCard = VersionReference & {
  acceptedInputs: string[];
  emittedOutputs: string[];
  allowedTools: VersionReference[];
  deniedTools: VersionReference[];
  gatedTools: VersionReference[];
  contextScope: "run" | "issue" | "none";
  contextPolicyRef: string;
  modelAliases: string[];
  runtimeClasses: string[];
  fallbackRule: "none" | "same_class_only";
  credentialReferenceScope: string;
  budgets: BudgetLimit[];
  provenance: Provenance;
};

export type PolicyDecision = {
  id: string;
  actorPersona: string;
  resource: VersionReference;
  action: string;
  effect: PolicyEffect;
  reasonCode: string;
  policyVersion: string;
  inputsDigest: string;
  decidedAt: string;
};

export type ApprovalEventState =
  "pending" | "approved" | "rejected" | "expired" | "cancelled" | "executed" | "failed";

export type ApprovalEvent = {
  id: string;
  requestId: string;
  state: ApprovalEventState;
  actorPersona: string;
  reasonCode: string;
  recordedAt: string;
};

export type ApprovalRequest = {
  id: string;
  agentVersion: VersionReference;
  toolVersion: VersionReference;
  redactedArgumentsDigest: string;
  contextDigest: string;
  policyDecisionId: string;
  riskReason: string;
  requesterPersona: string;
  requiredApproverPersona: string;
  expiresAt: string;
  traceId: string;
  events: ApprovalEvent[];
};

export type RuntimeReceipt = {
  modelAlias: string;
  runtimeClass: string;
  credentialReference: string;
  fallbackDecision: string;
  providerStatus: "simulated" | "provider_reported" | "not_available";
  usageBasis: MeasurementBasis;
};

export type BudgetEntry = {
  limit: BudgetLimit;
  consumed: number;
  basis: MeasurementBasis;
};

export type BudgetLedger = {
  runId: string;
  entries: BudgetEntry[];
  stopReason: string | null;
};

export type TraceSpan = {
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  name: string;
  startedAtUnixNanos: string;
  endedAtUnixNanos: string;
  status: "unset" | "ok" | "error";
  timingBasis: MeasurementBasis;
  attributes: Record<string, string | number | boolean>;
};

export type EvidenceEnvelope = {
  id: string;
  sourceRevision: string;
  checkType: string;
  toolVersion: VersionReference;
  status: "pass" | "fail" | "unavailable" | "not_applicable";
  artifactDigest: string;
  traceId: string;
  artifactReference: string | null;
};
