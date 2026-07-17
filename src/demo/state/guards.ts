import type { Issue, PullRequestData, ValidationData, ValidationStatus } from "../data/types";
import { stageDefs } from "../data/fixtures";
import type { PullRequestOverride, ValidationOverride } from "./store";

export type GovernanceBlockerCode =
  | "VERIFY_NOT_PASSED"
  | "REQUIRED_CHECKS_NOT_PASSED"
  | "DIFF_NOT_REVIEWED"
  | "REVIEW_CHECKLIST_INCOMPLETE"
  | "BOUND_APPROVAL_REQUIRED"
  | "VALIDATION_PERSONA_REQUIRED"
  | "VALIDATION_SCENARIOS_INCOMPLETE"
  | "VALIDATION_EVIDENCE_INCOMPLETE";

export type GovernanceGate = {
  readonly code: GovernanceBlockerCode;
  readonly label: string;
  readonly met: boolean;
  readonly detail: string;
};

export type GovernanceDecision = {
  readonly allowed: boolean;
  readonly gates: readonly GovernanceGate[];
  readonly blockers: readonly GovernanceGate[];
};

function decision(gates: readonly GovernanceGate[]): GovernanceDecision {
  const blockers = gates.filter((gate) => !gate.met);
  return { allowed: blockers.length === 0, gates, blockers };
}

function stageStatus(issue: Issue, stageId: string) {
  const index = stageDefs.findIndex((stage) => stage.id === stageId);
  return index >= 0 ? issue.s[index] : undefined;
}

export function verifyPassed(issue: Issue): boolean {
  return stageStatus(issue, "verify") === "done" && !issue.flags.failedVerification;
}

function requiredChecksPassed(pullRequest: PullRequestData): boolean {
  return pullRequest.checks
    .filter((check) => check.status !== "required")
    .every((check) => check.status === "pass");
}

function effectiveChecklistComplete(
  pullRequest: PullRequestData,
  override: PullRequestOverride,
): boolean {
  return pullRequest.checklist.every((item) => override.checklist?.[item.label] ?? item.done);
}

export function evaluateValidationApproval(input: {
  readonly issue: Issue;
  readonly pullRequest: PullRequestData;
  readonly override: PullRequestOverride;
}): GovernanceDecision {
  return decision([
    {
      code: "VERIFY_NOT_PASSED",
      label: "Verify stage",
      met: verifyPassed(input.issue),
      detail: verifyPassed(input.issue) ? "passed" : "failed, stale, or incomplete",
    },
    {
      code: "REQUIRED_CHECKS_NOT_PASSED",
      label: "Required checks",
      met: requiredChecksPassed(input.pullRequest),
      detail: requiredChecksPassed(input.pullRequest) ? "all passed" : "one or more open",
    },
    {
      code: "DIFF_NOT_REVIEWED",
      label: "Changed-file review",
      met: input.override.diffReviewed === true,
      detail: input.override.diffReviewed ? "reviewed" : "not reviewed",
    },
    {
      code: "REVIEW_CHECKLIST_INCOMPLETE",
      label: "Reviewer checklist",
      met: effectiveChecklistComplete(input.pullRequest, input.override),
      detail: effectiveChecklistComplete(input.pullRequest, input.override)
        ? "complete"
        : "incomplete",
    },
  ]);
}

export function evaluateValidationCompletion(input: {
  readonly issue: Issue;
  readonly approvedForValidation: boolean;
  readonly personaCanApprove: boolean;
  readonly scenarioStatuses: readonly ValidationStatus[];
}): GovernanceDecision {
  const scenariosPassed =
    input.scenarioStatuses.length > 0 &&
    input.scenarioStatuses.every((status) => status === "Passed");
  return decision([
    {
      code: "VERIFY_NOT_PASSED",
      label: "Verify stage",
      met: verifyPassed(input.issue),
      detail: verifyPassed(input.issue) ? "passed" : "failed, stale, or incomplete",
    },
    {
      code: "BOUND_APPROVAL_REQUIRED",
      label: "Bound human approval",
      met: input.approvedForValidation,
      detail: input.approvedForValidation ? "consumed" : "required",
    },
    {
      code: "VALIDATION_PERSONA_REQUIRED",
      label: "Separation of duties",
      met: input.personaCanApprove,
      detail: input.personaCanApprove ? "validator authorized" : "validator persona required",
    },
    {
      code: "VALIDATION_SCENARIOS_INCOMPLETE",
      label: "Validation scenarios",
      met: scenariosPassed,
      detail: scenariosPassed ? "all passed" : "incomplete or failed",
    },
  ]);
}

export function evaluateReleaseReadiness(input: {
  readonly issue: Issue;
  readonly pullRequest: PullRequestData;
  readonly pullRequestOverride: PullRequestOverride;
  readonly validation: ValidationData;
  readonly validationOverride?: ValidationOverride;
}): GovernanceDecision {
  const approval = evaluateValidationApproval({
    issue: input.issue,
    pullRequest: input.pullRequest,
    override: input.pullRequestOverride,
  });
  const validationDecision = input.validationOverride?.decision ?? input.validation.decision;
  const evidenceStatus =
    input.validationOverride?.evidenceStatus ?? input.validation.evidenceStatus;
  return decision([
    ...approval.gates,
    {
      code: "BOUND_APPROVAL_REQUIRED",
      label: "Human review gate",
      met:
        input.pullRequestOverride.reviewer === "approved" &&
        input.pullRequestOverride.approvedForValidation === true,
      detail:
        input.pullRequestOverride.reviewer === "approved" &&
        input.pullRequestOverride.approvedForValidation === true
          ? "approved"
          : "pending",
    },
    {
      code: "VALIDATION_EVIDENCE_INCOMPLETE",
      label: "Final validation evidence",
      met: validationDecision === "Passed" && evidenceStatus === "Complete",
      detail:
        validationDecision === "Passed" && evidenceStatus === "Complete"
          ? "complete for tested commit"
          : "required before merge",
    },
  ]);
}
