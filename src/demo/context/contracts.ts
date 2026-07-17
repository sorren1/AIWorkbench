import type { PersonaId, Scope } from "../authorization/contracts";
import type {
  AgentCard,
  MemoryPolicy,
  RegistryReference,
} from "../control-plane/registry/contracts";
import type { StageId } from "../data/types";

export const CONTEXT_RECORD_TYPES = [
  "ARCHITECTURE_DECISION",
  "ENGINEERING_CONVENTION",
  "DOMAIN_RULE",
  "ISSUE_EVIDENCE",
  "PRIOR_FAILURE",
  "PRIOR_FIX",
  "USER_PREFERENCE",
  "CUSTOM",
] as const;

export const CONTEXT_SOURCE_TYPES = [
  "REPOSITORY",
  "ISSUE_FIXTURE",
  "DOCUMENTATION",
  "EVIDENCE",
  "USER_CONFIGURATION",
  "PRIOR_RUN",
  "CUSTOM",
] as const;

export const CONTEXT_SENSITIVITIES = [
  "PUBLIC",
  "SYNTHETIC",
  "RESTRICTED_SYNTHETIC",
  "SECRET",
] as const;

export type ContextRecordType = (typeof CONTEXT_RECORD_TYPES)[number];
export type ContextSourceType = (typeof CONTEXT_SOURCE_TYPES)[number];
export type ContextSensitivity = (typeof CONTEXT_SENSITIVITIES)[number];
export type ContextRecordState = "ACTIVE" | "STALE" | "REVOKED";

export type ContextRecord = {
  readonly schemaVersion: 1;
  readonly id: string;
  readonly recordType: ContextRecordType;
  readonly title: string;
  readonly content: string;
  readonly source: {
    readonly type: ContextSourceType;
    readonly classification: "PUBLIC" | "SYNTHETIC";
    readonly reference: string;
    readonly sourceCommit?: string;
    readonly sourceVersion?: string;
  };
  readonly contentHash: string;
  readonly sensitivity: ContextSensitivity;
  readonly allowedStages: readonly StageId[];
  readonly allowedPersonas: readonly PersonaId[];
  readonly allowedAgents: readonly string[];
  readonly requiredScopes: readonly Scope[];
  readonly priority: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly freshnessPolicy: {
    readonly mode: "TTL" | "NEVER_EXPIRES";
    readonly ttlSeconds?: number;
  };
  readonly state: ContextRecordState;
  readonly tags: readonly string[];
  readonly citations?: readonly {
    readonly label: string;
    readonly reference: string;
  }[];
};

export type ContextRecordSource = Omit<ContextRecord, "contentHash">;

export type ContextFreshness = {
  readonly recordId: string;
  readonly status: "FRESH" | "STALE" | "REVOKED";
  readonly evaluatedAt: string;
  readonly ageSeconds: number;
  readonly effectiveTtlSeconds: number | null;
  readonly explanation: string;
};

export type ContextInclusion = {
  readonly record: ContextRecord;
  readonly reasonCode: "SELECTED";
  readonly reason: string;
  readonly freshness: ContextFreshness;
  readonly estimatedCharacters: number;
  readonly estimatedTokens: number;
};

export type ContextExclusionReason =
  | "CONTENT_HASH_INVALID"
  | "REVOKED"
  | "STALE"
  | "SENSITIVITY_DENIED"
  | "RECORD_TYPE_DENIED"
  | "SOURCE_TYPE_DENIED"
  | "STAGE_INCOMPATIBLE"
  | "PERSONA_DENIED"
  | "AGENT_DENIED"
  | "SCOPE_DENIED"
  | "EPISODIC_MEMORY_DENIED"
  | "TAG_MISMATCH"
  | "OVER_BUDGET";

export type ContextExclusion = {
  readonly record: ContextRecord;
  readonly reasonCode: ContextExclusionReason;
  readonly reason: string;
  readonly freshness: ContextFreshness;
  readonly estimatedCharacters: number;
  readonly estimatedTokens: number;
};

export type ContextPack = {
  readonly schemaVersion: 1;
  readonly classification: "SYNTHETIC_PUBLIC_CONTEXT_PACK";
  readonly packId: string;
  readonly runId: string;
  readonly stageId: StageId;
  readonly agentCard: RegistryReference | null;
  readonly agentNotApplicableReason?: "HUMAN_SELECTED_SEED_STAGE";
  readonly memoryPolicy: RegistryReference;
  readonly selection: {
    readonly strategy: "DETERMINISTIC_RULES";
    readonly ruleVersion: string;
    readonly query: {
      readonly requiredTags: readonly string[];
      readonly tagMatch: "ANY";
      readonly personaId: PersonaId;
      readonly grantedScopes: readonly Scope[];
    };
    readonly candidateRecordIds: readonly string[];
    readonly ordering: "PRIORITY_DESC_UPDATED_DESC_ID_ASC";
  };
  readonly includedRecords: readonly ContextInclusion[];
  readonly excludedRecords: readonly ContextExclusion[];
  readonly freshnessResults: readonly ContextFreshness[];
  readonly estimate: {
    readonly characters: number;
    readonly utf8Bytes: number;
    readonly estimatedTokens: number;
    readonly tokenEstimateBasis: "CEILING_CHARACTERS_DIVIDED_BY_FOUR";
  };
  readonly truncation: {
    readonly occurred: boolean;
    readonly excludedRecordIds: readonly string[];
    readonly reason: string | null;
  };
  readonly packDigest: string;
  readonly createdAt: string;
};

export type ContextSelectionInput = {
  readonly runId: string;
  readonly stageId: StageId;
  readonly agent: AgentCard | null;
  readonly memoryPolicy: MemoryPolicy;
  readonly persona: {
    readonly id: PersonaId;
    readonly scopes: readonly Scope[];
  };
  readonly candidates: readonly ContextRecord[];
  readonly requiredTags: readonly string[];
  readonly createdAt: string;
};
