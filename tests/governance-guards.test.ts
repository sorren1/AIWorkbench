import { describe, expect, it } from "vitest";

import { prFor, validationFor } from "../src/demo/data/content";
import {
  evaluateReleaseReadiness,
  evaluateValidationApproval,
  evaluateValidationCompletion,
} from "../src/demo/state/guards";
import { createInitialState } from "../src/demo/state/store";

function issue(key: string) {
  const selected = createInitialState().issues[key];
  if (!selected) throw new Error(`Missing synthetic issue ${key}`);
  return selected;
}

describe("workflow governance guards", () => {
  it("blocks PR and validation readiness after failed Verify", () => {
    const failed = issue("FIN-1301");
    const pullRequest = prFor(failed);
    const checklist = Object.fromEntries(pullRequest.checklist.map((item) => [item.label, true]));
    const result = evaluateValidationApproval({
      issue: failed,
      pullRequest,
      override: { diffReviewed: true, checklist },
    });

    expect(result.allowed).toBe(false);
    expect(result.blockers.map((blocker) => blocker.code)).toContain("VERIFY_NOT_PASSED");
  });

  it("blocks validation approval until the diff is reviewed and required checks pass", () => {
    const ready = issue("FIN-1077");
    const pullRequest = prFor(ready);
    const missingDiff = evaluateValidationApproval({ issue: ready, pullRequest, override: {} });
    expect(missingDiff.blockers.map((blocker) => blocker.code)).toContain("DIFF_NOT_REVIEWED");

    const failedChecks = evaluateValidationApproval({
      issue: ready,
      pullRequest: {
        ...pullRequest,
        checks: pullRequest.checks.map((check, index) =>
          index === 0 ? { ...check, status: "fail" } : check,
        ),
      },
      override: {
        diffReviewed: true,
        checklist: Object.fromEntries(pullRequest.checklist.map((item) => [item.label, true])),
      },
    });
    expect(failedChecks.blockers.map((blocker) => blocker.code)).toContain(
      "REQUIRED_CHECKS_NOT_PASSED",
    );
  });

  it("blocks the final validation decision without approval, persona, and passing scenarios", () => {
    const ready = issue("FIN-1077");
    const result = evaluateValidationCompletion({
      issue: ready,
      approvedForValidation: false,
      personaCanApprove: false,
      scenarioStatuses: ["Failed"],
    });
    expect(result.allowed).toBe(false);
    expect(result.blockers.map((blocker) => blocker.code)).toEqual([
      "BOUND_APPROVAL_REQUIRED",
      "VALIDATION_PERSONA_REQUIRED",
      "VALIDATION_SCENARIOS_INCOMPLETE",
    ]);
  });

  it("keeps release readiness blocked until validation evidence is complete", () => {
    const ready = issue("FIN-1077");
    const pullRequest = prFor(ready);
    const validation = validationFor(ready);
    const pullRequestOverride = {
      diffReviewed: true,
      checklist: Object.fromEntries(pullRequest.checklist.map((item) => [item.label, true])),
      reviewer: "approved",
      approvedForValidation: true,
    } as const;
    const blocked = evaluateReleaseReadiness({
      issue: ready,
      pullRequest,
      pullRequestOverride,
      validation,
    });
    expect(blocked.allowed).toBe(false);
    expect(blocked.blockers.map((blocker) => blocker.code)).toContain(
      "VALIDATION_EVIDENCE_INCOMPLETE",
    );

    const readyForRelease = evaluateReleaseReadiness({
      issue: ready,
      pullRequest,
      pullRequestOverride,
      validation,
      validationOverride: { decision: "Passed", evidenceStatus: "Complete" },
    });
    expect(readyForRelease.allowed).toBe(true);
  });
});
