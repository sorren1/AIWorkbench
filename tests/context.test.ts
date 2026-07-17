import { describe, expect, it } from "vitest";

import { contentHashInput, sha256Hex } from "../src/demo/control-plane/registry/canonical";
import { resolveStageExecutionManifest } from "../src/demo/control-plane/registry/lifecycle";
import { registrySnapshot } from "../src/demo/control-plane/registry/generated";
import {
  validateContextPack,
  validateContextRecord,
} from "../src/demo/control-plane/registry/validation";
import { artifactsFor } from "../src/demo/data/content";
import { issues } from "../src/demo/data/fixtures";
import type { ContextRecord, ContextSelectionInput } from "../src/demo/context/contracts";
import { buildContextPack, contextSelectionInput } from "../src/demo/context/runtime";
import {
  contextRecordHashInput,
  hasValidContextPackDigest,
  isContextPackCurrent,
  selectContextPack,
} from "../src/demo/context/selector";

async function revisedRecord(
  record: ContextRecord,
  patch: Partial<Pick<ContextRecord, "content" | "state" | "updatedAt" | "requiredScopes">>,
): Promise<ContextRecord> {
  const changed = { ...record, ...patch };
  return {
    ...changed,
    contentHash: await sha256Hex(contextRecordHashInput(changed)),
  };
}

function exclusion(pack: Awaited<ReturnType<typeof buildContextPack>>, recordId: string) {
  return pack.excludedRecords.find((candidate) => candidate.record.id === recordId);
}

describe("governed context packs", () => {
  it("emits schema-valid records and an inspectable deterministic pack", async () => {
    const input = contextSelectionInput("FIN-1150", "implement");
    const pack = await selectContextPack(input);

    expect(input.candidates.every((record) => validateContextRecord(record).valid)).toBe(true);
    expect(validateContextPack(pack)).toEqual({ valid: true, value: pack });
    await expect(hasValidContextPackDigest(pack)).resolves.toBe(true);
    expect(pack.selection).toMatchObject({
      strategy: "DETERMINISTIC_RULES",
      ruleVersion: "deterministic-context-v1",
      ordering: "PRIORITY_DESC_UPDATED_DESC_ID_ASC",
    });
    expect(pack.includedRecords.length).toBeGreaterThan(0);
    expect(pack.excludedRecords.length).toBeGreaterThan(0);
  });

  it("shows TTL, revocation, sensitivity, source, persona, agent, stage, and scope exclusions", async () => {
    const implementPack = await buildContextPack("FIN-1150", "implement");
    const reviewPack = await buildContextPack("FIN-1150", "review");
    const intakePack = await buildContextPack("FIN-1150", "intake");

    expect(exclusion(implementPack, "context.revoked.prompt-injection")?.reasonCode).toBe(
      "REVOKED",
    );
    expect(exclusion(implementPack, "context.stale.legacy-convention")?.reasonCode).toBe("STALE");
    expect(exclusion(implementPack, "context.expired.short-ttl")?.reasonCode).toBe("STALE");
    expect(exclusion(implementPack, "context.security.restricted-synthetic")?.reasonCode).toBe(
      "SENSITIVITY_DENIED",
    );
    expect(exclusion(implementPack, "context.custom.unsupported-source")?.reasonCode).toBe(
      "SOURCE_TYPE_DENIED",
    );
    expect(exclusion(implementPack, "context.evidence.validator-only")?.reasonCode).toBe(
      "PERSONA_DENIED",
    );
    expect(exclusion(reviewPack, "context.review.agent-mismatch")?.reasonCode).toBe("AGENT_DENIED");
    expect(exclusion(intakePack, "context.preference.reduced-motion")?.reasonCode).toBe(
      "STAGE_INCOMPATIBLE",
    );

    const baseInput = contextSelectionInput("FIN-1150", "implement");
    const base = baseInput.candidates.find(
      (record) => record.id === "context.preference.reduced-motion",
    );
    if (!base) throw new Error("Scope test fixture is missing.");
    const scopeRestricted = await revisedRecord(
      {
        ...base,
        allowedStages: ["implement"],
        allowedAgents: ["agent.implementation"],
        allowedPersonas: ["synthetic-implementer"],
        tags: ["engineering"],
      },
      { requiredScopes: ["validation:approve"] },
    );
    const pack = await selectContextPack({
      ...baseInput,
      candidates: [scopeRestricted],
    });
    expect(pack.excludedRecords[0]?.reasonCode).toBe("SCOPE_DENIED");
  });

  it("orders candidates predictably and enforces estimated-token and byte budgets", async () => {
    const first = await buildContextPack("FIN-1150", "implement");
    const second = await buildContextPack("FIN-1150", "implement");

    expect(second).toEqual(first);
    const priorities = first.includedRecords.map(({ record }) => record.priority);
    expect(priorities).toEqual([...priorities].sort((left, right) => right - left));
    expect(first.selection.candidateRecordIds).toEqual(
      contextSelectionInput("FIN-1150", "implement")
        .candidates.slice()
        .sort((left, right) => {
          if (left.priority !== right.priority) return right.priority - left.priority;
          const updated = Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
          return updated === 0 ? left.id.localeCompare(right.id) : updated;
        })
        .map((record) => record.id),
    );
    expect(first.truncation.occurred).toBe(true);
    expect(first.truncation.excludedRecordIds).toContain(
      "context.engineering.over-budget-reference",
    );
    expect(first.estimate.estimatedTokens).toBeLessThanOrEqual(475);
    expect(first.estimate.utf8Bytes).toBeLessThanOrEqual(1900);
  });

  it("allows prior failure/fix records only under the explicit implementation episodic policy", async () => {
    const implementation = await buildContextPack("FIN-1150", "implement");
    expect(implementation.includedRecords.map(({ record }) => record.recordType)).toEqual(
      expect.arrayContaining(["PRIOR_FAILURE", "PRIOR_FIX"]),
    );

    const input = contextSelectionInput("FIN-1150", "implement");
    const issuePolicy = contextSelectionInput("FIN-1150", "spec").memoryPolicy;
    if (!input.agent) throw new Error("Implementation agent fixture is missing.");
    const reboundAgentSource = { ...input.agent, memoryPolicyId: issuePolicy.id };
    const reboundAgent = {
      ...reboundAgentSource,
      contentHash: await sha256Hex(contentHashInput(reboundAgentSource)),
    };
    const denied = await selectContextPack({
      ...input,
      agent: reboundAgent,
      memoryPolicy: issuePolicy,
    });
    expect(
      denied.excludedRecords
        .filter(
          ({ record }) =>
            record.recordType === "PRIOR_FAILURE" || record.recordType === "PRIOR_FIX",
        )
        .every(({ reasonCode }) => reasonCode === "EPISODIC_MEMORY_DENIED"),
    ).toBe(true);
  });

  it("invalidates a pack after selected-record or policy changes", async () => {
    const input = contextSelectionInput("FIN-1150", "spec");
    const pack = await selectContextPack(input);
    const selected = pack.includedRecords[0]?.record;
    if (!selected) throw new Error("Selected context fixture is missing.");
    const changedRecord = await revisedRecord(selected, {
      content: `${selected.content} Synthetic revision.`,
    });
    const changedInput: ContextSelectionInput = {
      ...input,
      candidates: input.candidates.map((record) =>
        record.id === changedRecord.id ? changedRecord : record,
      ),
    };
    await expect(isContextPackCurrent(pack, changedInput)).resolves.toBe(false);

    const changedPolicySource = {
      ...input.memoryPolicy,
      maximumEstimatedTokens: input.memoryPolicy.maximumEstimatedTokens - 1,
    };
    const changedPolicy = {
      ...changedPolicySource,
      contentHash: await sha256Hex(contentHashInput(changedPolicySource)),
    };
    await expect(
      isContextPackCurrent(pack, { ...input, memoryPolicy: changedPolicy }),
    ).resolves.toBe(false);
  });

  it("binds artifacts and executable stage manifests to the exact pack digest", async () => {
    const issue = issues.find((candidate) => candidate.key === "FIN-1150");
    if (!issue) throw new Error("FIN-1150 fixture is missing.");
    const pack = await buildContextPack(issue.key, "spec");
    const artifact = artifactsFor(issue, new Map([["spec", pack.packDigest]])).find(
      (candidate) => candidate.stageId === "spec",
    );
    expect(artifact?.contextPackDigest).toBe(pack.packDigest);
    expect(artifact?.body).toContain(pack.packDigest);

    const decision = await resolveStageExecutionManifest(
      registrySnapshot,
      "spec",
      ["tool.issue.read"],
      pack.packDigest,
      pack.createdAt,
    );
    expect(decision.allowed && decision.manifest.contextPackDigest).toBe(pack.packDigest);
  });
});
