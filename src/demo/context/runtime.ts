import { personaById } from "../authorization/personas";
import { registrySnapshot } from "../control-plane/registry/generated";
import type { StageId } from "../data/types";
import type { ContextPack, ContextRecord, ContextSelectionInput } from "./contracts";
import { contextRecords } from "./generated";
import { CONTEXT_TAGS_BY_STAGE, DEMO_CONTEXT_CREATED_AT, personaForContextStage } from "./rules";
import { selectContextPack } from "./selector";

export function contextRecordsForSubject(subject: string): readonly ContextRecord[] {
  const subjectRecordId = `context.issue.${subject.toLocaleLowerCase()}`;
  return contextRecords.filter(
    (record) => !record.id.startsWith("context.issue.fin-") || record.id === subjectRecordId,
  );
}

export function contextSelectionInput(
  subject: string,
  stageId: StageId,
  options: {
    readonly runId?: string;
    readonly createdAt?: string;
    readonly candidates?: readonly ContextRecord[];
  } = {},
): ContextSelectionInput {
  const agent =
    stageId === "seed"
      ? null
      : (registrySnapshot.agents.find((candidate) => candidate.stageId === stageId) ?? null);
  if (stageId !== "seed" && !agent)
    throw new Error(`No approved agent is registered for ${stageId}.`);
  const memoryPolicyId = agent?.memoryPolicyId ?? "memory.policy.issue-bounded";
  const memoryPolicy = registrySnapshot.memoryPolicies.find(
    (candidate) => candidate.id === memoryPolicyId,
  );
  if (!memoryPolicy)
    throw new Error(`No approved context policy is registered as ${memoryPolicyId}.`);
  const persona = personaById(personaForContextStage(stageId));
  return {
    runId: options.runId ?? `run.browser.${subject.toLocaleLowerCase()}`,
    stageId,
    agent,
    memoryPolicy,
    persona,
    candidates: options.candidates ?? contextRecordsForSubject(subject),
    requiredTags: CONTEXT_TAGS_BY_STAGE[stageId],
    createdAt: options.createdAt ?? DEMO_CONTEXT_CREATED_AT,
  };
}

export function buildContextPack(
  subject: string,
  stageId: StageId,
  options?: Parameters<typeof contextSelectionInput>[2],
): Promise<ContextPack> {
  return selectContextPack(contextSelectionInput(subject, stageId, options));
}
