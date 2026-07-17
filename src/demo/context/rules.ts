import type { PersonaId } from "../authorization/contracts";
import type { StageId } from "../data/types";

export const CONTEXT_SELECTION_RULE_VERSION = "deterministic-context-v1";
export const DEMO_CONTEXT_CREATED_AT = "2026-07-17T18:00:00.000Z";

export const CONTEXT_TAGS_BY_STAGE: Readonly<Record<StageId, readonly string[]>> = {
  seed: ["issue"],
  intake: ["issue", "governance"],
  spec: ["issue", "domain", "engineering"],
  plan: ["issue", "architecture", "engineering"],
  targets: ["issue", "architecture", "engineering"],
  implement: ["issue", "architecture", "engineering", "failure"],
  verify: ["issue", "testing", "failure", "evidence"],
  review: ["issue", "review", "evidence", "governance"],
};

export function personaForContextStage(stageId: StageId): PersonaId {
  if (stageId === "review") return "synthetic-code-reviewer";
  if (stageId === "verify") return "synthetic-validator";
  return "synthetic-implementer";
}
