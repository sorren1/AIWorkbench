import { describe, expect, it } from "vitest";

import {
  resolveDeploymentBinding,
  type ReleaseDeploymentIdentity,
} from "../src/site/deploymentBinding";

const auditedCommit = "a".repeat(40);
const evidenceCommit = "b".repeat(40);
const identity: ReleaseDeploymentIdentity = {
  releaseTag: "v1.0.1",
  auditedCommit,
  evidenceParentCommit: auditedCommit,
  codeqlRunUrl: "https://github.com/sorren1/AIWorkbench/actions/runs/1234",
  codeqlSourceCommit: auditedCommit,
};

describe("Vercel release binding", () => {
  it("does not invent a deployment identity for local builds", () => {
    expect(resolveDeploymentBinding({}, identity)).toBeNull();
  });

  it("fails closed when Vercel does not provide an exact approved commit binding", () => {
    expect(() => resolveDeploymentBinding({ VERCEL: "1" }, identity)).toThrow(
      "VERCEL_GIT_COMMIT_SHA",
    );
    expect(() =>
      resolveDeploymentBinding(
        {
          VERCEL: "1",
          VERCEL_GIT_COMMIT_SHA: evidenceCommit,
          APPROVED_DEPLOYMENT_COMMIT_SHA: "c".repeat(40),
          APPROVED_AUDITED_COMMIT_SHA: auditedCommit,
          APPROVED_RELEASE_TAG: "v1.0.1",
        },
        identity,
      ),
    ).toThrow("does not match APPROVED_DEPLOYMENT_COMMIT_SHA");
  });

  it("publishes the verified deployed commit only when every binding matches", () => {
    expect(
      resolveDeploymentBinding(
        {
          VERCEL: "1",
          VERCEL_GIT_COMMIT_SHA: evidenceCommit,
          APPROVED_DEPLOYMENT_COMMIT_SHA: evidenceCommit,
          APPROVED_AUDITED_COMMIT_SHA: auditedCommit,
          APPROVED_RELEASE_TAG: "v1.0.1",
        },
        identity,
      ),
    ).toMatchObject({
      releaseTag: "v1.0.1",
      auditedCommit,
      evidenceCommit,
      deployedCommit: evidenceCommit,
      verified: true,
    });
  });
});
