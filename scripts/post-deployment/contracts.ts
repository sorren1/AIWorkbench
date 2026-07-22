import { z } from "zod";

export const PRODUCTION_RELATION = "TAGGED_EVIDENCE_CHILD_OF_AUDITED_COMMIT" as const;
export const LIGHTHOUSE_ROUTES = ["/", "/workbench/", "/workbench/demo/"] as const;
export const LIGHTHOUSE_PROFILES = ["desktop", "mobile"] as const;

const commitSchema = z.string().regex(/^[a-f0-9]{40}$/u, "Expected a full lowercase Git SHA.");
const resultStatusSchema = z.enum(["PASS", "FAIL", "NOT_RUN"]);
const scoreSchema = z.number().min(0).max(1);

const strictScoresSchema = z
  .object({
    performance: scoreSchema,
    accessibility: scoreSchema,
    "best-practices": scoreSchema,
    seo: scoreSchema,
  })
  .strict();

const toolVersionsSchema = z
  .object({
    node: z.string().min(1),
    playwright: z.string().min(1),
    axe: z.string().min(1),
    lhci: z.string().min(1),
    lighthouse: z.string().min(1),
  })
  .strict();

const workflowIdentitySchema = z
  .object({
    provider: z.enum(["GITHUB_ACTIONS", "LOCAL"]),
    repository: z.string().min(1),
    name: z.string().min(1),
    runId: z.string().min(1),
    runAttempt: z.number().int().positive(),
    runUrl: z.url().nullable(),
    sourceCommit: commitSchema,
  })
  .strict();

const bindingResultSchema = z
  .object({
    status: resultStatusSchema,
    url: z.url(),
    provider: z.literal("VERCEL").nullable(),
    relation: z.literal(PRODUCTION_RELATION).nullable(),
    verified: z.boolean(),
  })
  .strict();

const deploymentSuiteSchema = z
  .object({
    status: resultStatusSchema,
    command: z.string().min(1),
    browser: z.literal("chromium"),
    tests: z
      .object({
        total: z.number().int().nonnegative(),
        passed: z.number().int().nonnegative(),
        failed: z.number().int().nonnegative(),
        skipped: z.number().int().nonnegative(),
      })
      .strict(),
    controls: z
      .object({
        browser: resultStatusSchema,
        accessibility: resultStatusSchema,
        network: resultStatusSchema,
        headers: resultStatusSchema,
        cache: resultStatusSchema,
      })
      .strict(),
  })
  .strict();

const lighthouseProfileSchema = z
  .object({
    status: z.literal("PASS"),
    scores: strictScoresSchema,
  })
  .strict();

const lighthouseResultSchema = z
  .object({
    status: resultStatusSchema,
    command: z.string().min(1),
    routes: z.array(
      z
        .object({
          path: z.enum(LIGHTHOUSE_ROUTES),
          profiles: z
            .object({
              desktop: lighthouseProfileSchema,
              mobile: lighthouseProfileSchema,
            })
            .strict(),
        })
        .strict(),
    ),
  })
  .strict();

const failureSchema = z
  .object({
    stage: z.enum([
      "CANDIDATE",
      "BINDING",
      "CANONICAL_IDENTITY",
      "DEPLOYMENT_SUITE",
      "LIGHTHOUSE",
      "SUMMARY",
    ]),
    code: z.string().regex(/^[A-Z0-9_]+$/u),
  })
  .strict();

export const postDeploymentSummarySchema = z
  .object({
    schemaVersion: z.literal(1),
    recordType: z.literal("PRODUCTION_POST_DEPLOYMENT_VERIFICATION"),
    environment: z.literal("PRODUCTION"),
    generatedAt: z.iso.datetime({ offset: true }),
    canonicalOrigin: z.url(),
    deployedCommit: commitSchema,
    releaseTag: z.string().regex(/^v\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u),
    auditedCommit: commitSchema,
    identitySource: z.enum(["DEPLOYMENT_BINDING", "REQUESTED_CANDIDATE_UNVERIFIED"]),
    workflow: workflowIdentitySchema,
    tools: toolVersionsSchema,
    binding: bindingResultSchema,
    deploymentSuite: deploymentSuiteSchema,
    lighthouse: lighthouseResultSchema,
    overall: z.enum(["PASS", "FAIL"]),
    failure: failureSchema.nullable(),
  })
  .strict();

const deploymentBindingSchema = z
  .object({
    schemaVersion: z.literal(1),
    provider: z.literal("VERCEL"),
    releaseTag: z.string().min(1),
    auditedCommit: commitSchema,
    evidenceParentCommit: commitSchema,
    evidenceCommit: commitSchema,
    deployedCommit: commitSchema,
    relation: z.literal(PRODUCTION_RELATION),
    codeql: z
      .object({
        runUrl: z.url(),
        sourceCommit: commitSchema,
        releaseBlockingFindings: z.literal(0),
      })
      .strict(),
    verified: z.literal(true),
  })
  .strict();

export type ProductionCandidate = {
  readonly canonicalOrigin: string;
  readonly deployedCommit: string;
  readonly releaseTag: string;
  readonly auditedCommit: string;
};

export type VerifiedHostedBinding = z.infer<typeof deploymentBindingSchema>;
export type PostDeploymentSummary = z.infer<typeof postDeploymentSummarySchema>;
export type WorkflowIdentity = z.infer<typeof workflowIdentitySchema>;
export type ToolVersions = z.infer<typeof toolVersionsSchema>;
export type DeploymentSuiteResult = z.infer<typeof deploymentSuiteSchema>;
export type LighthouseResult = z.infer<typeof lighthouseResultSchema>;
export type FailureStage = NonNullable<PostDeploymentSummary["failure"]>["stage"];

export class VerificationFailure extends Error {
  readonly stage: FailureStage;
  readonly code: string;

  constructor(stage: FailureStage, code: string) {
    super(`${stage}:${code}`);
    this.name = "VerificationFailure";
    this.stage = stage;
    this.code = code;
  }
}

const sensitiveFieldNames = new Set([
  "authorization",
  "cookie",
  "setcookie",
  "requestbody",
  "requestheaders",
  "responsebody",
  "responseheaders",
  "html",
  "screenshot",
  "stderr",
  "stdout",
  "token",
  "trace",
]);

function normalizedFieldName(name: string): string {
  return name.toLowerCase().replaceAll(/[-_]/gu, "");
}

export function assertNoSensitiveSummaryFields(value: unknown, path = "summary"): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertNoSensitiveSummaryFields(entry, `${path}[${index}]`));
    return;
  }
  if (typeof value !== "object" || value === null) return;

  for (const [name, entry] of Object.entries(value)) {
    if (sensitiveFieldNames.has(normalizedFieldName(name))) {
      throw new VerificationFailure("SUMMARY", "DISALLOWED_SENSITIVE_FIELD");
    }
    assertNoSensitiveSummaryFields(entry, `${path}.${name}`);
  }
}

export function normalizeProductionOrigin(input: string): string {
  let parsed: URL;
  try {
    parsed = new URL(input);
  } catch {
    throw new VerificationFailure("CANDIDATE", "INVALID_CANONICAL_ORIGIN");
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.username !== "" ||
    parsed.password !== "" ||
    parsed.port !== "" ||
    parsed.pathname !== "/" ||
    parsed.search !== "" ||
    parsed.hash !== "" ||
    parsed.hostname.endsWith(".vercel.app")
  ) {
    throw new VerificationFailure("CANDIDATE", "INVALID_CANONICAL_ORIGIN");
  }
  return parsed.origin;
}

export function validateCandidate(input: ProductionCandidate): ProductionCandidate {
  const candidateSchema = z
    .object({
      canonicalOrigin: z.string().min(1),
      deployedCommit: commitSchema,
      releaseTag: z.string().regex(/^v\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/u),
      auditedCommit: commitSchema,
    })
    .strict();
  const result = candidateSchema.safeParse(input);
  if (!result.success) throw new VerificationFailure("CANDIDATE", "INVALID_CANDIDATE");
  return {
    ...result.data,
    canonicalOrigin: normalizeProductionOrigin(result.data.canonicalOrigin),
  };
}

export function bindingUrlFor(origin: string): string {
  return new URL("/security/deployment-binding.json", `${origin}/`).toString();
}

export function validateDeploymentBinding(
  input: unknown,
  candidate: ProductionCandidate,
  fetchedUrl: string,
): VerifiedHostedBinding {
  const expectedBindingUrl = bindingUrlFor(candidate.canonicalOrigin);
  if (fetchedUrl !== expectedBindingUrl) {
    throw new VerificationFailure("BINDING", "UNEXPECTED_BINDING_ORIGIN");
  }
  const parsed = deploymentBindingSchema.safeParse(input);
  if (!parsed.success) throw new VerificationFailure("BINDING", "MALFORMED_BINDING");

  const binding = parsed.data;
  if (
    binding.deployedCommit !== candidate.deployedCommit ||
    binding.evidenceCommit !== candidate.deployedCommit ||
    binding.releaseTag !== candidate.releaseTag ||
    binding.auditedCommit !== candidate.auditedCommit ||
    binding.evidenceParentCommit !== candidate.auditedCommit ||
    binding.codeql.sourceCommit !== candidate.auditedCommit
  ) {
    throw new VerificationFailure("BINDING", "CANDIDATE_BINDING_MISMATCH");
  }
  return binding;
}

export function parseDeploymentBinding(
  contents: string,
  candidate: ProductionCandidate,
  fetchedUrl: string,
): VerifiedHostedBinding {
  let payload: unknown;
  try {
    payload = JSON.parse(contents) as unknown;
  } catch {
    throw new VerificationFailure("BINDING", "MALFORMED_BINDING");
  }
  return validateDeploymentBinding(payload, candidate, fetchedUrl);
}

export function validateCanonicalSecurityTxt(contents: string, canonicalOrigin: string): void {
  const expected = new URL("/.well-known/security.txt", `${canonicalOrigin}/`).toString();
  const values = contents
    .split(/\r?\n/gu)
    .filter((line) => line.startsWith("Canonical:"))
    .map((line) => line.slice("Canonical:".length).trim());
  if (values.length !== 1 || values[0] !== expected) {
    throw new VerificationFailure("CANONICAL_IDENTITY", "WRONG_CANONICAL_ORIGIN");
  }
}

type ReportSpec = {
  readonly title: string;
  readonly ok: boolean;
};

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectReportSpecs(suites: unknown): ReportSpec[] {
  if (!Array.isArray(suites)) return [];
  const collected: ReportSpec[] = [];
  for (const suite of suites) {
    if (!isRecord(suite)) continue;
    if (Array.isArray(suite.specs)) {
      for (const spec of suite.specs) {
        if (isRecord(spec) && typeof spec.title === "string" && typeof spec.ok === "boolean") {
          collected.push({ title: spec.title, ok: spec.ok });
        }
      }
    }
    collected.push(...collectReportSpecs(suite.suites));
  }
  return collected;
}

const deploymentControlTitles = {
  browser: [
    "serves every public route directly and uses the custom 404",
    "keeps the custom 404 functional at nested missing routes",
    "renders every public page with its Workbench-scoped assets",
    "redirects legacy public pages into the Workbench namespace",
    "emits canonical metadata only for the configured production domain",
    "publishes the configured source link without an unsafe opener",
  ],
  accessibility: ["has no serious accessibility findings or unintended runtime origins"],
  network: [
    "ordinary deployment requests have no toolbar injection and satisfy CSP on every route",
    "the explicit toolbar-skip request path remains independently verified",
    "has no serious accessibility findings or unintended runtime origins",
  ],
  headers: [
    "ordinary deployment requests have no toolbar injection and satisfy CSP on every route",
    "publishes a current RFC 9116 security.txt with private reporting",
    "configured Production canonical security.txt resolves on the expected origin",
    "applies security headers and the intended static cache policy",
  ],
  cache: ["applies security headers and the intended static cache policy"],
} as const;

const playwrightReportSchema = z.looseObject({
  stats: z.looseObject({
    expected: z.number().int().nonnegative(),
    unexpected: z.number().int().nonnegative(),
    flaky: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
  }),
  suites: z.array(z.unknown()),
});

export function summarizeDeploymentReport(input: unknown, exitCode: number): DeploymentSuiteResult {
  const report = playwrightReportSchema.safeParse(input);
  if (!report.success) {
    throw new VerificationFailure("DEPLOYMENT_SUITE", "MISSING_OR_MALFORMED_TEST_OUTPUT");
  }
  const specs = collectReportSpecs(report.data.suites);
  const specResults = new Map(specs.map((spec) => [spec.title, spec.ok]));
  const controls = Object.fromEntries(
    Object.entries(deploymentControlTitles).map(([control, titles]) => {
      const results = titles.map((title) => specResults.get(title));
      if (results.some((result) => result === undefined)) {
        throw new VerificationFailure("DEPLOYMENT_SUITE", "INCOMPLETE_DEPLOYMENT_TEST_SET");
      }
      return [control, results.every(Boolean) ? "PASS" : "FAIL"];
    }),
  ) as DeploymentSuiteResult["controls"];
  const stats = report.data.stats;
  const total = stats.expected + stats.unexpected + stats.flaky + stats.skipped;
  const failed = stats.unexpected + stats.flaky;
  const passed = stats.expected;
  const status =
    exitCode === 0 &&
    failed === 0 &&
    stats.skipped === 0 &&
    Object.values(controls).every((x) => x === "PASS")
      ? "PASS"
      : "FAIL";
  return {
    status,
    command: "npm run test:deployment -- --reporter=json",
    browser: "chromium",
    tests: { total, passed, failed, skipped: stats.skipped },
    controls,
  };
}

const lighthouseManifestEntrySchema = z.looseObject({
  url: z.url(),
  summary: strictScoresSchema,
});

const lighthouseSummarySchema = z
  .object({
    desktop: z.array(lighthouseManifestEntrySchema),
    mobile: z.array(lighthouseManifestEntrySchema),
  })
  .strict();

export function summarizeLighthouseResults(
  input: unknown,
  canonicalOrigin: string,
  exitCode: number,
): LighthouseResult {
  if (exitCode !== 0) throw new VerificationFailure("LIGHTHOUSE", "LIGHTHOUSE_ASSERTION_FAILED");
  const parsed = lighthouseSummarySchema.safeParse(input);
  if (!parsed.success) {
    throw new VerificationFailure("LIGHTHOUSE", "MISSING_OR_MALFORMED_LIGHTHOUSE_OUTPUT");
  }

  const routeProfiles = new Map<string, z.infer<typeof lighthouseProfileSchema>>();
  for (const profile of LIGHTHOUSE_PROFILES) {
    for (const entry of parsed.data[profile]) {
      const url = new URL(entry.url);
      if (
        url.origin !== canonicalOrigin ||
        url.search !== "" ||
        url.hash !== "" ||
        !LIGHTHOUSE_ROUTES.some((route) => route === url.pathname)
      ) {
        throw new VerificationFailure("LIGHTHOUSE", "UNEXPECTED_LIGHTHOUSE_ORIGIN_OR_ROUTE");
      }
      const key = `${profile}:${url.pathname}`;
      if (routeProfiles.has(key)) {
        throw new VerificationFailure("LIGHTHOUSE", "DUPLICATE_LIGHTHOUSE_ROUTE_PROFILE");
      }
      routeProfiles.set(key, { status: "PASS", scores: entry.summary });
    }
  }

  const routes = LIGHTHOUSE_ROUTES.map((path) => {
    const desktop = routeProfiles.get(`desktop:${path}`);
    const mobile = routeProfiles.get(`mobile:${path}`);
    if (!desktop || !mobile) {
      throw new VerificationFailure("LIGHTHOUSE", "INCOMPLETE_LIGHTHOUSE_ROUTE_PROFILE_SET");
    }
    return { path, profiles: { desktop, mobile } };
  });
  if (routeProfiles.size !== LIGHTHOUSE_ROUTES.length * LIGHTHOUSE_PROFILES.length) {
    throw new VerificationFailure("LIGHTHOUSE", "INCOMPLETE_LIGHTHOUSE_ROUTE_PROFILE_SET");
  }
  return {
    status: "PASS",
    command: "npm run performance:audit",
    routes,
  };
}

function requireCompleteLighthouseResults(summary: PostDeploymentSummary): void {
  if (summary.lighthouse.routes.length !== LIGHTHOUSE_ROUTES.length) {
    throw new VerificationFailure("SUMMARY", "INCOMPLETE_LIGHTHOUSE_ROUTE_PROFILE_SET");
  }
  const paths = summary.lighthouse.routes.map((route) => route.path);
  if (
    !LIGHTHOUSE_ROUTES.every((path) => paths.filter((candidate) => candidate === path).length === 1)
  ) {
    throw new VerificationFailure("SUMMARY", "INCOMPLETE_LIGHTHOUSE_ROUTE_PROFILE_SET");
  }
}

export function validatePostDeploymentSummary(
  input: unknown,
  options: { readonly requireHosted?: boolean } = {},
): PostDeploymentSummary {
  assertNoSensitiveSummaryFields(input);
  const parsed = postDeploymentSummarySchema.safeParse(input);
  if (!parsed.success) throw new VerificationFailure("SUMMARY", "INVALID_SUMMARY_SCHEMA");
  const summary = parsed.data;
  if (normalizeProductionOrigin(summary.canonicalOrigin) !== summary.canonicalOrigin) {
    throw new VerificationFailure("SUMMARY", "INVALID_CANONICAL_ORIGIN");
  }
  if (summary.binding.url !== bindingUrlFor(summary.canonicalOrigin)) {
    throw new VerificationFailure("SUMMARY", "UNEXPECTED_BINDING_ORIGIN");
  }
  if (options.requireHosted && summary.workflow.provider !== "GITHUB_ACTIONS") {
    throw new VerificationFailure("SUMMARY", "HOSTED_WORKFLOW_IDENTITY_REQUIRED");
  }
  if (summary.workflow.provider === "GITHUB_ACTIONS" && summary.workflow.runUrl === null) {
    throw new VerificationFailure("SUMMARY", "HOSTED_WORKFLOW_IDENTITY_REQUIRED");
  }

  if (summary.overall === "PASS") {
    requireCompleteLighthouseResults(summary);
    if (
      summary.identitySource !== "DEPLOYMENT_BINDING" ||
      summary.binding.status !== "PASS" ||
      summary.binding.provider !== "VERCEL" ||
      summary.binding.relation !== PRODUCTION_RELATION ||
      !summary.binding.verified ||
      summary.deploymentSuite.status !== "PASS" ||
      summary.lighthouse.status !== "PASS" ||
      summary.failure !== null ||
      Object.values(summary.deploymentSuite.controls).some((status) => status !== "PASS")
    ) {
      throw new VerificationFailure("SUMMARY", "INCONSISTENT_PASS_STATE");
    }
  } else if (summary.failure === null) {
    throw new VerificationFailure("SUMMARY", "FAILURE_REASON_REQUIRED");
  }
  return summary;
}
