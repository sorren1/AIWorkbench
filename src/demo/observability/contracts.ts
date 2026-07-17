import type { BudgetResult, RunAccounting } from "../../../tools/local-sandbox/budgets";
import type { NormalizedTraceArtifact } from "../../../tools/local-sandbox/telemetry";

export type RecordedRunTrace = {
  readonly trace: NormalizedTraceArtifact;
  readonly evidence: {
    readonly runId: string;
    readonly status: "SUCCEEDED" | "FAILED";
    readonly sourceCommit: string;
    readonly sourceWorkingTree: "CLEAN" | "MODIFIED";
    readonly testedRepositoryTreeDigest: string | null;
    readonly evidenceDigest: string;
    readonly traceArtifact: string;
    readonly traceArtifactSha256: string;
    readonly evidenceArtifact: string;
    readonly evidenceMarkdownArtifact: string;
    readonly sandboxProvider: string;
    readonly change: {
      readonly path: string;
      readonly expectedTextSha256: string;
      readonly replacementTextSha256: string;
      readonly changedFiles: readonly string[];
      readonly unifiedDiff: string;
      readonly unifiedDiffSha256: string;
    };
    readonly budget: BudgetResult;
    readonly accounting: RunAccounting;
    readonly approval: {
      readonly requestId: string;
      readonly policyId: string;
      readonly outcome: "PREAPPROVED_SYNTHETIC_FIXTURE";
      readonly waitDurationMs: number;
      readonly measurement: "MEASURED";
    };
  };
};

export type RecordedWalkthroughEvidence = {
  readonly runId: string;
  readonly sourceCommit: string;
  readonly sourceWorkingTree: "CLEAN" | "MODIFIED";
  readonly sandboxProvider: string;
  readonly approvalOutcome: "PREAPPROVED_SYNTHETIC_FIXTURE";
  readonly change: {
    readonly path: string;
    readonly expectedTextSha256: string;
    readonly replacementTextSha256: string;
    readonly unifiedDiff: string;
    readonly unifiedDiffSha256: string;
  };
};
