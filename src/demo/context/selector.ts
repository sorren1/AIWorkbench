import { canonicalJson, hasValidContentHash, sha256Hex } from "../control-plane/registry/canonical";
import type { RegistryReference } from "../control-plane/registry/contracts";
import type {
  ContextExclusion,
  ContextExclusionReason,
  ContextFreshness,
  ContextInclusion,
  ContextPack,
  ContextRecord,
  ContextRecordSource,
  ContextSelectionInput,
} from "./contracts";

export function contextRecordHashInput(record: ContextRecord | ContextRecordSource): unknown {
  return Object.fromEntries(Object.entries(record).filter(([key]) => key !== "contentHash"));
}

export function contextPackHashInput(pack: Omit<ContextPack, "packDigest"> | ContextPack): unknown {
  return Object.fromEntries(Object.entries(pack).filter(([key]) => key !== "packDigest"));
}

export async function hasValidContextRecordHash(record: ContextRecord): Promise<boolean> {
  return (await sha256Hex(contextRecordHashInput(record))) === record.contentHash;
}

export async function hasValidContextPackDigest(pack: ContextPack): Promise<boolean> {
  return (await sha256Hex(contextPackHashInput(pack))) === pack.packDigest;
}

function reference(resource: {
  id: string;
  version: string;
  contentHash: string;
}): RegistryReference {
  return { id: resource.id, version: resource.version, contentHash: resource.contentHash };
}

function estimatedTokens(content: string): number {
  return Math.ceil(content.length / 4);
}

function utf8Bytes(content: string): number {
  return new TextEncoder().encode(content).byteLength;
}

function freshnessFor(
  record: ContextRecord,
  maximumAgeSeconds: number,
  evaluatedAt: string,
): ContextFreshness {
  const ageSeconds = Math.max(
    0,
    Math.floor((Date.parse(evaluatedAt) - Date.parse(record.updatedAt)) / 1000),
  );
  const recordTtl =
    record.freshnessPolicy.mode === "TTL" ? (record.freshnessPolicy.ttlSeconds ?? 0) : null;
  const effectiveTtlSeconds =
    recordTtl === null ? maximumAgeSeconds : Math.min(recordTtl, maximumAgeSeconds);
  if (record.state === "REVOKED") {
    return {
      recordId: record.id,
      status: "REVOKED",
      evaluatedAt,
      ageSeconds,
      effectiveTtlSeconds,
      explanation: "The record was explicitly revoked before selection.",
    };
  }
  if (record.state === "STALE" || ageSeconds > effectiveTtlSeconds) {
    return {
      recordId: record.id,
      status: "STALE",
      evaluatedAt,
      ageSeconds,
      effectiveTtlSeconds,
      explanation:
        record.state === "STALE"
          ? "The record is explicitly marked stale."
          : `The record age exceeds the effective ${effectiveTtlSeconds}s TTL.`,
    };
  }
  return {
    recordId: record.id,
    status: "FRESH",
    evaluatedAt,
    ageSeconds,
    effectiveTtlSeconds,
    explanation: `The record is within the effective ${effectiveTtlSeconds}s TTL.`,
  };
}

function stableRecordOrder(left: ContextRecord, right: ContextRecord): number {
  if (left.priority !== right.priority) return right.priority - left.priority;
  const updated = Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
  if (updated !== 0) return updated;
  return left.id.localeCompare(right.id);
}

function exclusionReason(
  record: ContextRecord,
  freshness: ContextFreshness,
  input: ContextSelectionInput,
  hashValid: boolean,
): { reasonCode: ContextExclusionReason; reason: string } | null {
  const agentId = input.agent?.id ?? "human.seed";
  if (!hashValid)
    return {
      reasonCode: "CONTENT_HASH_INVALID",
      reason: "The record body or metadata no longer matches its SHA-256 content hash.",
    };
  if (freshness.status === "REVOKED")
    return { reasonCode: "REVOKED", reason: freshness.explanation };
  if (freshness.status === "STALE") return { reasonCode: "STALE", reason: freshness.explanation };
  if (!input.memoryPolicy.allowedSensitivities.includes(record.sensitivity))
    return {
      reasonCode: "SENSITIVITY_DENIED",
      reason: `${record.sensitivity} is outside ${input.memoryPolicy.id}.`,
    };
  if (!record.allowedStages.includes(input.stageId))
    return {
      reasonCode: "STAGE_INCOMPATIBLE",
      reason: `The record is not authorized for the ${input.stageId} stage.`,
    };
  if (!record.allowedPersonas.includes(input.persona.id))
    return {
      reasonCode: "PERSONA_DENIED",
      reason: `${input.persona.id} is outside the record's persona allow-list.`,
    };
  if (!record.allowedAgents.includes(agentId))
    return {
      reasonCode: "AGENT_DENIED",
      reason: `${agentId} is outside the record's agent allow-list.`,
    };
  const missingScopes = record.requiredScopes.filter(
    (scope) => !input.persona.scopes.includes(scope),
  );
  if (missingScopes.length > 0)
    return {
      reasonCode: "SCOPE_DENIED",
      reason: `The delegated persona lacks ${missingScopes.join(", ")}.`,
    };
  if (
    (record.recordType === "PRIOR_FAILURE" || record.recordType === "PRIOR_FIX") &&
    !input.memoryPolicy.priorRunEpisodicMemoryPermitted
  )
    return {
      reasonCode: "EPISODIC_MEMORY_DENIED",
      reason: `${input.memoryPolicy.id} does not permit prior failure/fix records.`,
    };
  if (!input.memoryPolicy.allowedRecordTypes.includes(record.recordType))
    return {
      reasonCode: "RECORD_TYPE_DENIED",
      reason: `${record.recordType} is not allowed by ${input.memoryPolicy.id}.`,
    };
  if (!input.memoryPolicy.allowedSourceTypes.includes(record.source.type))
    return {
      reasonCode: "SOURCE_TYPE_DENIED",
      reason: `${record.source.type} sources are not allowed by ${input.memoryPolicy.id}.`,
    };
  if (!record.tags.some((tag) => input.requiredTags.includes(tag)))
    return {
      reasonCode: "TAG_MISMATCH",
      reason: `No record tag matched the deterministic query: ${input.requiredTags.join(", ")}.`,
    };
  return null;
}

export async function selectContextPack(input: ContextSelectionInput): Promise<ContextPack> {
  if (input.memoryPolicy.status !== "APPROVED") {
    throw new Error(`Context selection denied: ${input.memoryPolicy.id} is not approved.`);
  }
  if (input.memoryPolicy.retrievalMode !== "DETERMINISTIC_RULES") {
    throw new Error("Context selection denied: only deterministic retrieval is implemented.");
  }
  if (!(await hasValidContentHash(input.memoryPolicy))) {
    throw new Error("Context selection denied: memory-policy content hash is invalid.");
  }
  if (input.agent) {
    if (input.agent.status !== "APPROVED" || input.agent.stageId !== input.stageId) {
      throw new Error(`Context selection denied: agent is not approved for ${input.stageId}.`);
    }
    if (!(await hasValidContentHash(input.agent))) {
      throw new Error("Context selection denied: agent content hash is invalid.");
    }
    if (input.agent.memoryPolicyId !== input.memoryPolicy.id) {
      throw new Error(
        `Context selection denied: ${input.agent.id} is bound to ${input.agent.memoryPolicyId}, not ${input.memoryPolicy.id}.`,
      );
    }
  } else if (input.stageId !== "seed") {
    throw new Error("Only the human-selected seed stage may omit an agent card.");
  }

  const ordered = [...input.candidates].sort(stableRecordOrder);
  const hashResults = await Promise.all(ordered.map(hasValidContextRecordHash));
  const includedRecords: ContextInclusion[] = [];
  const excludedRecords: ContextExclusion[] = [];
  const freshnessResults: ContextFreshness[] = [];
  let characters = 0;
  let bytes = 0;
  let tokens = 0;

  ordered.forEach((record, index) => {
    const freshness = freshnessFor(
      record,
      input.memoryPolicy.freshness.maximumAgeSeconds,
      input.createdAt,
    );
    freshnessResults.push(freshness);
    const recordCharacters = record.content.length;
    const recordBytes = utf8Bytes(record.content);
    const recordTokens = estimatedTokens(record.content);
    const base = {
      record,
      freshness,
      estimatedCharacters: recordCharacters,
      estimatedTokens: recordTokens,
    };
    const denied = exclusionReason(record, freshness, input, hashResults[index] ?? false);
    if (denied) {
      excludedRecords.push({ ...base, ...denied });
      return;
    }
    if (
      bytes + recordBytes > input.memoryPolicy.maximumContextBytes ||
      tokens + recordTokens > input.memoryPolicy.maximumEstimatedTokens
    ) {
      excludedRecords.push({
        ...base,
        reasonCode: "OVER_BUDGET",
        reason: `Including this record would exceed ${input.memoryPolicy.maximumContextBytes} bytes or ${input.memoryPolicy.maximumEstimatedTokens} estimated tokens.`,
      });
      return;
    }
    characters += recordCharacters;
    bytes += recordBytes;
    tokens += recordTokens;
    includedRecords.push({
      ...base,
      reasonCode: "SELECTED",
      reason: `Matched ${input.stageId}, ${input.persona.id}, the approved agent, policy source/type limits, and tag priority rules.`,
    });
  });

  const overBudget = excludedRecords
    .filter((record) => record.reasonCode === "OVER_BUDGET")
    .map((record) => record.record.id);
  const source = {
    schemaVersion: 1 as const,
    classification: "SYNTHETIC_PUBLIC_CONTEXT_PACK" as const,
    packId: `context-pack.${input.runId}.${input.stageId}`,
    runId: input.runId,
    stageId: input.stageId,
    agentCard: input.agent ? reference(input.agent) : null,
    ...(input.agent ? {} : { agentNotApplicableReason: "HUMAN_SELECTED_SEED_STAGE" as const }),
    memoryPolicy: reference(input.memoryPolicy),
    selection: {
      strategy: "DETERMINISTIC_RULES" as const,
      ruleVersion: input.memoryPolicy.selectionRuleVersion,
      query: {
        requiredTags: [...input.requiredTags].sort(),
        tagMatch: "ANY" as const,
        personaId: input.persona.id,
        grantedScopes: [...input.persona.scopes].sort(),
      },
      candidateRecordIds: ordered.map((record) => record.id),
      ordering: "PRIORITY_DESC_UPDATED_DESC_ID_ASC" as const,
    },
    includedRecords,
    excludedRecords,
    freshnessResults,
    estimate: {
      characters,
      utf8Bytes: bytes,
      estimatedTokens: tokens,
      tokenEstimateBasis: "CEILING_CHARACTERS_DIVIDED_BY_FOUR" as const,
    },
    truncation: {
      occurred: overBudget.length > 0,
      excludedRecordIds: overBudget,
      reason:
        overBudget.length > 0
          ? "Lower-priority eligible records were excluded before exceeding the configured byte/token budget."
          : null,
    },
    createdAt: input.createdAt,
  };
  return { ...source, packDigest: await sha256Hex(contextPackHashInput(source)) };
}

export async function isContextPackCurrent(
  pack: ContextPack,
  currentInput: ContextSelectionInput,
): Promise<boolean> {
  if (!(await hasValidContextPackDigest(pack))) return false;
  const rebuilt = await selectContextPack({ ...currentInput, createdAt: pack.createdAt });
  return rebuilt.packDigest === pack.packDigest && canonicalJson(rebuilt) === canonicalJson(pack);
}

export function includedContextRemainsFresh(
  pack: ContextPack,
  maximumAgeSeconds: number,
  evaluatedAt: string,
): boolean {
  return pack.includedRecords.every(
    ({ record }) => freshnessFor(record, maximumAgeSeconds, evaluatedAt).status === "FRESH",
  );
}
