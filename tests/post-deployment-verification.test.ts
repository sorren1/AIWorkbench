import { describe, expect, it } from "vitest";

import {
  bindingUrlFor,
  parseDeploymentBinding,
  summarizeDeploymentReport,
  summarizeLighthouseResults,
  validateCanonicalSecurityTxt,
  validateDeploymentBinding,
  validatePostDeploymentSummary,
  type PostDeploymentSummary,
  type ProductionCandidate,
} from "../scripts/post-deployment/contracts";

const deployedCommit = "b".repeat(40);
const auditedCommit = "a".repeat(40);
const candidate: ProductionCandidate = {
  canonicalOrigin: "https://portfolio.example",
  deployedCommit,
  releaseTag: "v1.2.3",
  auditedCommit,
};
const bindingUrl = bindingUrlFor(candidate.canonicalOrigin);
const binding = {
  schemaVersion: 1,
  provider: "VERCEL",
  releaseTag: candidate.releaseTag,
  auditedCommit,
  evidenceParentCommit: auditedCommit,
  evidenceCommit: deployedCommit,
  deployedCommit,
  relation: "TAGGED_EVIDENCE_CHILD_OF_AUDITED_COMMIT",
  codeql: {
    runUrl: "https://github.com/example/repository/actions/runs/123",
    sourceCommit: auditedCommit,
    releaseBlockingFindings: 0,
  },
  verified: true,
} as const;

const deploymentTitles = [
  "serves every public route directly and uses the custom 404",
  "keeps the custom 404 functional at nested missing routes",
  "ordinary deployment requests have no toolbar injection and satisfy CSP on every route",
  "renders every public page with its Workbench-scoped assets",
  "the explicit toolbar-skip request path remains independently verified",
  "redirects legacy public pages into the Workbench namespace",
  "publishes a current RFC 9116 security.txt with private reporting",
  "configured Production canonical security.txt resolves on the expected origin",
  "applies security headers and the intended static cache policy",
  "emits canonical metadata only for the configured production domain",
  "has no serious accessibility findings or unintended runtime origins",
  "publishes the configured source link without an unsafe opener",
] as const;

function deploymentReport(failedTitle?: string): unknown {
  return {
    stats: {
      expected: failedTitle ? deploymentTitles.length - 1 : deploymentTitles.length,
      unexpected: failedTitle ? 1 : 0,
      flaky: 0,
      skipped: 0,
    },
    suites: [
      {
        specs: deploymentTitles.map((title) => ({ title, ok: title !== failedTitle })),
      },
    ],
  };
}

function lighthouseSummary(omit?: {
  readonly profile: "desktop" | "mobile";
  readonly path: string;
}) {
  const scores = {
    performance: 0.99,
    accessibility: 1,
    "best-practices": 1,
    seo: 1,
  };
  return Object.fromEntries(
    (["desktop", "mobile"] as const).map((profile) => [
      profile,
      ["/", "/workbench/", "/workbench/demo/"]
        .filter((path) => omit?.profile !== profile || omit.path !== path)
        .map((path) => ({
          url: new URL(path, `${candidate.canonicalOrigin}/`).toString(),
          summary: scores,
        })),
    ]),
  );
}

function validSummary(): PostDeploymentSummary {
  return {
    schemaVersion: 1,
    recordType: "PRODUCTION_POST_DEPLOYMENT_VERIFICATION",
    environment: "PRODUCTION",
    generatedAt: "2026-07-21T12:00:00.000Z",
    canonicalOrigin: candidate.canonicalOrigin,
    deployedCommit,
    releaseTag: candidate.releaseTag,
    auditedCommit,
    identitySource: "DEPLOYMENT_BINDING",
    workflow: {
      provider: "GITHUB_ACTIONS",
      repository: "example/repository",
      name: "Commit-bound production verification",
      runId: "123",
      runAttempt: 1,
      runUrl: "https://github.com/example/repository/actions/runs/123",
      sourceCommit: "c".repeat(40),
    },
    tools: {
      node: "v22.18.0",
      playwright: "1.61.1",
      axe: "4.12.1",
      lhci: "0.15.1",
      lighthouse: "12.8.2",
    },
    binding: {
      status: "PASS",
      url: bindingUrl,
      provider: "VERCEL",
      relation: "TAGGED_EVIDENCE_CHILD_OF_AUDITED_COMMIT",
      verified: true,
    },
    deploymentSuite: summarizeDeploymentReport(deploymentReport(), 0),
    lighthouse: summarizeLighthouseResults(lighthouseSummary(), candidate.canonicalOrigin, 0),
    overall: "PASS",
    failure: null,
  };
}

describe("commit-bound post-deployment verification", () => {
  it("accepts only the exact complete binding and candidate relation", () => {
    expect(validateDeploymentBinding(binding, candidate, bindingUrl)).toEqual(binding);
    expect(validatePostDeploymentSummary(validSummary(), { requireHosted: true }).overall).toBe(
      "PASS",
    );
  });

  it("fails closed on a deployed SHA mismatch", () => {
    expect(() =>
      validateDeploymentBinding(
        { ...binding, deployedCommit: "d".repeat(40) },
        candidate,
        bindingUrl,
      ),
    ).toThrow("BINDING:CANDIDATE_BINDING_MISMATCH");
  });

  it("fails closed when the binding is fetched from the wrong canonical origin", () => {
    expect(() =>
      validateDeploymentBinding(
        binding,
        candidate,
        "https://other.example/security/deployment-binding.json",
      ),
    ).toThrow("BINDING:UNEXPECTED_BINDING_ORIGIN");
    expect(() =>
      validateCanonicalSecurityTxt(
        "Canonical: https://other.example/.well-known/security.txt\n",
        candidate.canonicalOrigin,
      ),
    ).toThrow("CANONICAL_IDENTITY:WRONG_CANONICAL_ORIGIN");
  });

  it("fails closed on missing or malformed deployment binding data", () => {
    expect(() => parseDeploymentBinding("", candidate, bindingUrl)).toThrow(
      "BINDING:MALFORMED_BINDING",
    );
    expect(() => parseDeploymentBinding("{}", candidate, bindingUrl)).toThrow(
      "BINDING:MALFORMED_BINDING",
    );
  });

  it("records a failed deployment assertion as a failed suite", () => {
    const result = summarizeDeploymentReport(
      deploymentReport("applies security headers and the intended static cache policy"),
      1,
    );
    expect(result.status).toBe("FAIL");
    expect(result.tests.failed).toBe(1);
    expect(result.controls.headers).toBe("FAIL");
    expect(result.controls.cache).toBe("FAIL");
  });

  it("fails closed when deployment output is missing", () => {
    expect(() => summarizeDeploymentReport({}, 0)).toThrow(
      "DEPLOYMENT_SUITE:MISSING_OR_MALFORMED_TEST_OUTPUT",
    );
  });

  it("fails closed on an incomplete Lighthouse route/profile set", () => {
    expect(() =>
      summarizeLighthouseResults(
        lighthouseSummary({ profile: "mobile", path: "/workbench/demo/" }),
        candidate.canonicalOrigin,
        0,
      ),
    ).toThrow("LIGHTHOUSE:INCOMPLETE_LIGHTHOUSE_ROUTE_PROFILE_SET");
  });

  it("rejects attempted inclusion of sensitive raw fields", () => {
    const summary: unknown = { ...validSummary(), responseHeaders: { "set-cookie": "secret" } };
    expect(() => validatePostDeploymentSummary(summary)).toThrow(
      "SUMMARY:DISALLOWED_SENSITIVE_FIELD",
    );
  });
});
