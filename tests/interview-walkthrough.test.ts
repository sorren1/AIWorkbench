import { describe, expect, it } from "vitest";

import { recordedRunTrace } from "../src/demo/observability/generated";
import { recordedWalkthroughEvidence } from "../src/demo/observability/recordedSummary.generated";
import { PRINCIPAL_REPLAY_ARGUMENTS } from "../src/demo/walkthrough/approvalReplay";
import {
  configurePrincipalWalkthroughUrl,
  PRINCIPAL_WALKTHROUGH_DURATION_SECONDS,
  PRINCIPAL_WALKTHROUGH_STEPS,
  principalWalkthroughStepIndex,
} from "../src/demo/walkthrough/principalWalkthrough";
import { sha256Bytes } from "../tools/local-sandbox/security";

describe("principal walkthrough contract", () => {
  it("has twelve named deep-linkable steps totaling exactly seven minutes", () => {
    expect(PRINCIPAL_WALKTHROUGH_STEPS).toHaveLength(12);
    expect(PRINCIPAL_WALKTHROUGH_DURATION_SECONDS).toBe(7 * 60);
    expect(new Set(PRINCIPAL_WALKTHROUGH_STEPS.map((step) => step.id)).size).toBe(12);

    for (const [index, step] of PRINCIPAL_WALKTHROUGH_STEPS.entries()) {
      const url = configurePrincipalWalkthroughUrl(
        new URL("https://portfolio.invalid/demo/?stale=1"),
        index,
      );
      expect(url.searchParams.get("walkthrough")).toBe("principal");
      expect(url.searchParams.get("tourStep")).toBe(step.id);
      expect(principalWalkthroughStepIndex(step.id)).toBe(index);
    }
  });

  it("binds the replayed patch fixture to the recorded evidence hashes", () => {
    expect(recordedRunTrace).not.toBeNull();
    expect(recordedWalkthroughEvidence).not.toBeNull();
    if (!recordedRunTrace || !recordedWalkthroughEvidence) return;
    expect(recordedWalkthroughEvidence.runId).toBe(recordedRunTrace.evidence.runId);
    expect(recordedWalkthroughEvidence.sourceCommit).toBe(recordedRunTrace.evidence.sourceCommit);
    expect(recordedWalkthroughEvidence.approvalOutcome).toBe(
      recordedRunTrace.evidence.approval.outcome,
    );
    expect(recordedRunTrace.evidence.sourceCommit).toMatch(/^[a-f0-9]{40}$/);
    expect(recordedWalkthroughEvidence.change.path).toBe(PRINCIPAL_REPLAY_ARGUMENTS.path);
    expect(sha256Bytes(PRINCIPAL_REPLAY_ARGUMENTS.expected)).toBe(
      recordedWalkthroughEvidence.change.expectedTextSha256,
    );
    expect(sha256Bytes(PRINCIPAL_REPLAY_ARGUMENTS.replacement)).toBe(
      recordedWalkthroughEvidence.change.replacementTextSha256,
    );
  });
});
