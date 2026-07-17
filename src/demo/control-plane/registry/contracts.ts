import type { StageId } from "../../data/types";
import type {
  ContextRecordType,
  ContextSensitivity,
  ContextSourceType,
} from "../../context/contracts";

export const REGISTRY_STATUSES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "REJECTED",
  "DEPRECATED",
] as const;

export type RegistryStatus = (typeof REGISTRY_STATUSES)[number];
export type ToolRiskLevel = "READ_ONLY" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type IdempotencySemantics = "IDEMPOTENT" | "IDEMPOTENT_WITH_KEY" | "NOT_IDEMPOTENT";
export type ProviderCategory =
  "PROVIDER_NEUTRAL_SIMULATED" | "LOCAL_DETERMINISTIC" | "OPENAI_COMPATIBLE_LOCAL_GATEWAY";
export type ModelTask = "ARTIFACT_DRAFT" | "CODE_CHANGE" | "INDEPENDENT_REVIEW";
export type ApprovalMode = "ALLOW" | "NOTIFY" | "REQUIRE_APPROVAL" | "DENY";

export type ApprovalMetadata = {
  readonly approvedBy: string;
  readonly approvedAt: string;
  readonly approvalPolicyId: string;
  readonly decisionRecordId: string;
};

export type SchemaReference = {
  readonly $ref: string;
};

export type JsonSchema = Record<string, unknown>;

export type AgentCard = {
  readonly kind: "AgentCard";
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly owner: string;
  readonly status: RegistryStatus;
  readonly stageId: Exclude<StageId, "seed">;
  readonly capabilities: readonly string[];
  readonly skills: readonly string[];
  readonly inputSchema: SchemaReference;
  readonly outputSchema: SchemaReference;
  readonly allowedToolIds: readonly string[];
  readonly allowedWritePaths: readonly string[];
  readonly modelPolicyId: string;
  readonly memoryPolicyId: string;
  readonly approvalPolicyIds: readonly string[];
  readonly maxDurationMs: number;
  readonly maxToolCalls: number;
  readonly maxRepairAttempts: number;
  readonly tokenBudget?: {
    readonly maxInputTokens: number;
    readonly maxOutputTokens: number;
    readonly basis: "ESTIMATED";
  };
  readonly costBudget?: {
    readonly maxEstimatedUsd: number;
    readonly basis: "ESTIMATED";
  };
  readonly sourceCommit: string;
  readonly contentHash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly approval?: ApprovalMetadata;
};

export type ToolDescriptor = {
  readonly kind: "ToolDescriptor";
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly status: RegistryStatus;
  readonly riskLevel: ToolRiskLevel;
  readonly inputSchema: JsonSchema;
  readonly outputSchema: JsonSchema;
  readonly sideEffects: readonly string[];
  readonly requiredScopes: readonly string[];
  readonly allowedStages: readonly Exclude<StageId, "seed">[];
  readonly timeoutMs: number;
  readonly idempotency: IdempotencySemantics;
  readonly networkRequired: boolean;
  readonly filesystemBoundary: {
    readonly mode: "NONE" | "READ_ONLY" | "BOUNDED_WRITE";
    readonly allowedPaths: readonly string[];
  };
  readonly approvalPolicyId: string | null;
  readonly sourceImplementation: {
    readonly module: string;
    readonly exportName: string;
  };
  readonly sourceCommit: string;
  readonly contentHash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly approval?: ApprovalMetadata;
};

export type ModelPolicy = {
  readonly kind: "ModelPolicy";
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly status: RegistryStatus;
  readonly providerCategory: ProviderCategory;
  readonly preferredModelId: string;
  readonly allowedProviderIds: readonly string[];
  readonly allowedModelIds: readonly string[];
  readonly fallbackOrder: readonly string[];
  readonly reasoningProfile: "LOW" | "BALANCED" | "HIGH";
  readonly temperature: number | null;
  readonly maximumInputTokens: number;
  readonly maximumOutputTokens: number;
  readonly maximumCostUsd: number;
  readonly maximumLatencyMs: number;
  readonly allowedStages: readonly Exclude<StageId, "seed">[];
  readonly allowedTasks: readonly ModelTask[];
  readonly independentReview: {
    readonly required: boolean;
    readonly modelId: string | null;
  };
  readonly executionMode: "OFFLINE_ONLY" | "EXPLICIT_LOCAL_PROFILE";
  readonly sourceCommit: string;
  readonly contentHash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly approval?: ApprovalMetadata;
};

export type MemoryPolicy = {
  readonly kind: "MemoryPolicy";
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly status: RegistryStatus;
  readonly allowedRecordTypes: readonly ContextRecordType[];
  readonly allowedSourceTypes: readonly ContextSourceType[];
  readonly allowedSensitivities: readonly ContextSensitivity[];
  readonly freshness: {
    readonly maximumAgeSeconds: number;
    readonly staleBehavior: "EXCLUDE";
  };
  readonly maximumContextBytes: number;
  readonly maximumEstimatedTokens: number;
  readonly priorRunEpisodicMemoryPermitted: boolean;
  readonly retrievalMode: "DETERMINISTIC_RULES";
  readonly selectionRuleVersion: string;
  readonly sourceCommit: string;
  readonly contentHash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly approval?: ApprovalMetadata;
};

export type ApprovalPolicyMatcher = {
  readonly toolIds?: readonly string[];
  readonly stages?: readonly Exclude<StageId, "seed">[];
  readonly riskLevels?: readonly ToolRiskLevel[];
  readonly agentIds?: readonly string[];
  readonly pathPatterns?: readonly string[];
  readonly pathBoundary?: "INSIDE_APPROVED_TARGETS" | "OUTSIDE_APPROVED_TARGETS";
  readonly networkAccess?: boolean;
  readonly evidenceFinalized?: boolean;
};

export type ApprovalPolicy = {
  readonly kind: "ApprovalPolicy";
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly description: string;
  readonly enabled: boolean;
  readonly matcher: ApprovalPolicyMatcher;
  readonly mode: ApprovalMode;
  readonly requiredApproverScopes: readonly string[];
  readonly requiredApproverPersonas: readonly string[];
  readonly timeoutSeconds: number;
  readonly decisionCacheTtlSeconds?: number;
  readonly forbidSelfApproval: boolean;
  readonly reasonRequired: boolean;
  readonly contentHash: string;
  readonly provenance: {
    readonly sourceCommit: string;
    readonly independentlyAuthored: true;
    readonly createdAt: string;
  };
};

export type RegistryResource = AgentCard | ToolDescriptor | ModelPolicy | MemoryPolicy;

export type AgentCardSource = Omit<AgentCard, "contentHash">;
export type ToolDescriptorSource = Omit<ToolDescriptor, "contentHash">;
export type ModelPolicySource = Omit<ModelPolicy, "contentHash">;
export type MemoryPolicySource = Omit<MemoryPolicy, "contentHash">;
export type ApprovalPolicySource = Omit<ApprovalPolicy, "contentHash">;
export type RegistryResourceSource =
  AgentCardSource | ToolDescriptorSource | ModelPolicySource | MemoryPolicySource;

export type RegistrySnapshot = {
  readonly schemaVersion: 4;
  readonly generatedAt: string;
  readonly classification: "SYNTHETIC_PUBLIC_PORTFOLIO_FIXTURE";
  readonly agents: readonly AgentCard[];
  readonly tools: readonly ToolDescriptor[];
  readonly modelPolicies: readonly ModelPolicy[];
  readonly memoryPolicies: readonly MemoryPolicy[];
  readonly approvalPolicies: readonly ApprovalPolicy[];
};

export type RegistryReference = {
  readonly id: string;
  readonly version: string;
  readonly contentHash: string;
};

export type StageExecutionManifest = {
  readonly manifestVersion: 1;
  readonly stageId: Exclude<StageId, "seed">;
  readonly agent: RegistryReference;
  readonly tools: readonly RegistryReference[];
  readonly modelPolicy: RegistryReference;
  readonly memoryPolicy: RegistryReference;
  readonly contextPackDigest: string;
  readonly resolvedAt: string;
};

export type RegistryDecision =
  | {
      readonly allowed: true;
      readonly reasonCode: "APPROVED_MANIFEST_RESOLVED";
      readonly manifest: StageExecutionManifest;
    }
  | {
      readonly allowed: false;
      readonly reasonCode:
        | "AGENT_NOT_FOUND"
        | "AGENT_SCHEMA_INVALID"
        | "AGENT_HASH_INVALID"
        | "AGENT_NOT_APPROVED"
        | "STAGE_MISMATCH"
        | "TOOL_NOT_FOUND"
        | "TOOL_SCHEMA_INVALID"
        | "TOOL_HASH_INVALID"
        | "TOOL_NOT_APPROVED"
        | "TOOL_NOT_ALLOWED_FOR_AGENT"
        | "TOOL_NOT_ALLOWED_FOR_STAGE"
        | "MODEL_POLICY_NOT_APPROVED"
        | "MEMORY_POLICY_NOT_APPROVED";
      readonly detail: string;
    };
