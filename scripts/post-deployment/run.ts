import { spawn, spawnSync } from "node:child_process";
import { appendFile, mkdir, open, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import {
  bindingUrlFor,
  parseDeploymentBinding,
  summarizeDeploymentReport,
  summarizeLighthouseResults,
  validateCandidate,
  validateCanonicalSecurityTxt,
  validatePostDeploymentSummary,
  VerificationFailure,
  type DeploymentSuiteResult,
  type PostDeploymentSummary,
  type ProductionCandidate,
  type ToolVersions,
  type WorkflowIdentity,
} from "./contracts";

const root = resolve(import.meta.dirname, "../..");
const evidenceRoot = resolve(root, ".security-reports/post-deployment");
const detailsRoot = resolve(evidenceRoot, "details");
const summaryPath = process.env.POST_DEPLOYMENT_SUMMARY_PATH
  ? resolve(root, process.env.POST_DEPLOYMENT_SUMMARY_PATH)
  : resolve(evidenceRoot, "post-deployment-summary.json");

function requiredEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new VerificationFailure("CANDIDATE", `MISSING_${name}`);
  return value;
}

function readCandidate(): ProductionCandidate {
  return validateCandidate({
    canonicalOrigin: requiredEnvironment("DEPLOYMENT_BASE_URL"),
    deployedCommit: requiredEnvironment("EXPECTED_DEPLOYED_SHA"),
    releaseTag: requiredEnvironment("EXPECTED_RELEASE_TAG"),
    auditedCommit: requiredEnvironment("EXPECTED_AUDITED_SHA"),
  });
}

function localHead(): string {
  const result = spawnSync(
    "git",
    ["-c", `safe.directory=${root.replaceAll("\\", "/")}`, "rev-parse", "HEAD"],
    { cwd: root, encoding: "utf8" },
  );
  const value = result.stdout.trim();
  if (result.status !== 0 || !/^[a-f0-9]{40}$/u.test(value)) {
    throw new VerificationFailure("SUMMARY", "SOURCE_COMMIT_UNAVAILABLE");
  }
  return value;
}

function workflowIdentity(): WorkflowIdentity {
  if (process.env.GITHUB_ACTIONS === "true") {
    const repository = requiredEnvironment("GITHUB_REPOSITORY");
    const runId = requiredEnvironment("GITHUB_RUN_ID");
    const attempt = Number.parseInt(requiredEnvironment("GITHUB_RUN_ATTEMPT"), 10);
    if (!Number.isSafeInteger(attempt) || attempt < 1) {
      throw new VerificationFailure("SUMMARY", "INVALID_WORKFLOW_IDENTITY");
    }
    return {
      provider: "GITHUB_ACTIONS",
      repository,
      name: requiredEnvironment("GITHUB_WORKFLOW"),
      runId,
      runAttempt: attempt,
      runUrl: `https://github.com/${repository}/actions/runs/${runId}`,
      sourceCommit: requiredEnvironment("GITHUB_SHA"),
    };
  }

  return {
    provider: "LOCAL",
    repository: "LOCAL",
    name: "local-post-deployment-verification",
    runId: `local-${Date.now()}`,
    runAttempt: 1,
    runUrl: null,
    sourceCommit: localHead(),
  };
}

type PackageManifest = {
  readonly devDependencies?: Readonly<Record<string, string>>;
};

type PackageLock = {
  readonly packages?: Readonly<Record<string, { readonly version?: string }>>;
};

async function toolVersions(): Promise<ToolVersions> {
  const manifest = JSON.parse(
    await readFile(resolve(root, "package.json"), "utf8"),
  ) as PackageManifest;
  const lock = JSON.parse(
    await readFile(resolve(root, "package-lock.json"), "utf8"),
  ) as PackageLock;
  const version = (name: string): string => {
    const direct = manifest.devDependencies?.[name];
    const installed = lock.packages?.[`node_modules/${name}`]?.version;
    const value = installed ?? direct;
    if (!value) throw new VerificationFailure("SUMMARY", "TOOL_VERSION_UNAVAILABLE");
    return value;
  };
  return {
    node: process.version,
    playwright: version("@playwright/test"),
    axe: version("@axe-core/playwright"),
    lhci: version("@lhci/cli"),
    lighthouse: version("lighthouse"),
  };
}

const notRunControls = {
  browser: "NOT_RUN",
  accessibility: "NOT_RUN",
  network: "NOT_RUN",
  headers: "NOT_RUN",
  cache: "NOT_RUN",
} as const;

function initialSummary(
  candidate: ProductionCandidate,
  workflow: WorkflowIdentity,
  tools: ToolVersions,
): PostDeploymentSummary {
  return {
    schemaVersion: 1,
    recordType: "PRODUCTION_POST_DEPLOYMENT_VERIFICATION",
    environment: "PRODUCTION",
    generatedAt: new Date().toISOString(),
    canonicalOrigin: candidate.canonicalOrigin,
    deployedCommit: candidate.deployedCommit,
    releaseTag: candidate.releaseTag,
    auditedCommit: candidate.auditedCommit,
    identitySource: "REQUESTED_CANDIDATE_UNVERIFIED",
    workflow,
    tools,
    binding: {
      status: "NOT_RUN",
      url: bindingUrlFor(candidate.canonicalOrigin),
      provider: null,
      relation: null,
      verified: false,
    },
    deploymentSuite: {
      status: "NOT_RUN",
      command: "npm run test:deployment -- --reporter=json",
      browser: "chromium",
      tests: { total: 0, passed: 0, failed: 0, skipped: 0 },
      controls: notRunControls,
    },
    lighthouse: {
      status: "NOT_RUN",
      command: "npm run performance:audit",
      routes: [],
    },
    overall: "FAIL",
    failure: null,
  };
}

async function fetchPublicText(
  url: string,
  stage: "BINDING" | "CANONICAL_IDENTITY",
  expectedContentType: RegExp,
): Promise<{ readonly contents: string; readonly responseUrl: string }> {
  let response: Response;
  try {
    response = await fetch(url, {
      redirect: "manual",
      headers: { accept: stage === "BINDING" ? "application/json" : "text/plain" },
      signal: AbortSignal.timeout(30_000),
    });
  } catch {
    throw new VerificationFailure(stage, "PUBLIC_FETCH_FAILED");
  }
  if (response.status >= 300 && response.status < 400) {
    throw new VerificationFailure(stage, "UNEXPECTED_REDIRECT");
  }
  if (!response.ok) throw new VerificationFailure(stage, "UNEXPECTED_HTTP_STATUS");
  if (response.url !== url) throw new VerificationFailure(stage, "UNEXPECTED_RESPONSE_ORIGIN");
  if (!expectedContentType.test(response.headers.get("content-type") ?? "")) {
    throw new VerificationFailure(stage, "UNEXPECTED_CONTENT_TYPE");
  }
  const contents = await response.text();
  if (contents.length === 0 || contents.length > 128 * 1024) {
    throw new VerificationFailure(stage, "INVALID_RESPONSE_SIZE");
  }
  return { contents, responseUrl: response.url };
}

async function runCommand(
  executable: string,
  args: readonly string[],
  environment: NodeJS.ProcessEnv,
  logPath: string,
): Promise<number> {
  await mkdir(dirname(logPath), { recursive: true });
  const log = await open(logPath, "w");
  try {
    const child = spawn(executable, args, {
      cwd: root,
      env: environment,
      shell: process.platform === "win32",
      stdio: ["ignore", log.fd, log.fd],
    });
    return await new Promise<number>((accept, reject) => {
      child.once("error", reject);
      child.once("exit", (code) => accept(code ?? 1));
    });
  } finally {
    await log.close();
  }
}

async function readJson(path: string, stage: "DEPLOYMENT_SUITE" | "LIGHTHOUSE"): Promise<unknown> {
  try {
    return JSON.parse(await readFile(path, "utf8")) as unknown;
  } catch {
    const code =
      stage === "DEPLOYMENT_SUITE"
        ? "MISSING_OR_MALFORMED_TEST_OUTPUT"
        : "MISSING_OR_MALFORMED_LIGHTHOUSE_OUTPUT";
    throw new VerificationFailure(stage, code);
  }
}

async function runDeploymentSuite(candidate: ProductionCandidate): Promise<DeploymentSuiteResult> {
  const reportPath = resolve(detailsRoot, "playwright-report.json");
  const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";
  const exitCode = await runCommand(
    npmExecutable,
    ["run", "test:deployment", "--", "--reporter=json"],
    {
      ...process.env,
      DEPLOYMENT_BASE_URL: candidate.canonicalOrigin,
      EXPECTED_CANONICAL_URL: candidate.canonicalOrigin,
      PLAYWRIGHT_JSON_OUTPUT_FILE: reportPath,
    },
    resolve(detailsRoot, "playwright-command.log"),
  );
  return summarizeDeploymentReport(await readJson(reportPath, "DEPLOYMENT_SUITE"), exitCode);
}

async function runLighthouse(
  candidate: ProductionCandidate,
): Promise<PostDeploymentSummary["lighthouse"]> {
  const npmExecutable = process.platform === "win32" ? "npm.cmd" : "npm";
  const exitCode = await runCommand(
    npmExecutable,
    ["run", "performance:audit"],
    { ...process.env, LIGHTHOUSE_BASE_URL: candidate.canonicalOrigin },
    resolve(detailsRoot, "lighthouse-command.log"),
  );
  const report = await readJson(resolve(root, ".lighthouseci/summary.json"), "LIGHTHOUSE");
  return summarizeLighthouseResults(report, candidate.canonicalOrigin, exitCode);
}

async function writeSummary(summary: PostDeploymentSummary, requireHosted: boolean): Promise<void> {
  const validated = validatePostDeploymentSummary(summary, { requireHosted });
  await mkdir(dirname(summaryPath), { recursive: true });
  await writeFile(summaryPath, `${JSON.stringify(validated, null, 2)}\n`, "utf8");

  const jobSummaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (jobSummaryPath) {
    const artifactName =
      process.env.POST_DEPLOYMENT_ARTIFACT_NAME ??
      `post-deployment-verification-${validated.deployedCommit}-${validated.workflow.runId}`;
    await appendFile(
      jobSummaryPath,
      [
        "## Commit-bound Production verification",
        "",
        `- Result: **${validated.overall}**`,
        `- Canonical origin: ${validated.canonicalOrigin}`,
        `- Deployed commit: \`${validated.deployedCommit}\``,
        `- Release tag: \`${validated.releaseTag}\``,
        `- Audited commit: \`${validated.auditedCommit}\``,
        `- Live binding: ${validated.binding.url}`,
        `- Sanitized artifact: \`${artifactName}\``,
        "",
      ].join("\n"),
      "utf8",
    );
  }
}

let summary: PostDeploymentSummary | null = null;
const requireHosted = process.env.POST_DEPLOYMENT_REQUIRE_HOSTED === "1";

try {
  const candidate = readCandidate();
  summary = initialSummary(candidate, workflowIdentity(), await toolVersions());

  const bindingResponse = await fetchPublicText(
    summary.binding.url,
    "BINDING",
    /^application\/json(?:\s*;|$)/iu,
  );
  const binding = parseDeploymentBinding(
    bindingResponse.contents,
    candidate,
    bindingResponse.responseUrl,
  );
  summary = {
    ...summary,
    deployedCommit: binding.deployedCommit,
    releaseTag: binding.releaseTag,
    auditedCommit: binding.auditedCommit,
    identitySource: "DEPLOYMENT_BINDING",
    binding: {
      status: "PASS",
      url: summary.binding.url,
      provider: binding.provider,
      relation: binding.relation,
      verified: binding.verified,
    },
  };

  const securityTxtUrl = new URL(
    "/.well-known/security.txt",
    `${candidate.canonicalOrigin}/`,
  ).toString();
  const securityTxt = await fetchPublicText(
    securityTxtUrl,
    "CANONICAL_IDENTITY",
    /^text\/plain(?:\s*;|$)/iu,
  );
  validateCanonicalSecurityTxt(securityTxt.contents, candidate.canonicalOrigin);

  const deploymentSuite = await runDeploymentSuite(candidate);
  summary = { ...summary, deploymentSuite };
  if (deploymentSuite.status !== "PASS") {
    throw new VerificationFailure("DEPLOYMENT_SUITE", "DEPLOYMENT_TEST_FAILED");
  }

  const lighthouse = await runLighthouse(candidate);
  summary = {
    ...summary,
    lighthouse,
    overall: "PASS",
    failure: null,
    generatedAt: new Date().toISOString(),
  };
  await writeSummary(summary, requireHosted);
  process.stdout.write(
    `Production verification passed for ${summary.deployedCommit} at ${summary.canonicalOrigin}.\n`,
  );
} catch (error) {
  const failure =
    error instanceof VerificationFailure
      ? error
      : new VerificationFailure(summary ? "SUMMARY" : "CANDIDATE", "UNEXPECTED_FAILURE");
  if (summary) {
    let binding = summary.binding;
    let deploymentSuite = summary.deploymentSuite;
    let lighthouse = summary.lighthouse;
    if (failure.stage === "BINDING" && binding.status !== "PASS") {
      binding = { ...binding, status: "FAIL" };
    }
    if (failure.stage === "DEPLOYMENT_SUITE" && deploymentSuite.status === "NOT_RUN") {
      deploymentSuite = { ...deploymentSuite, status: "FAIL" };
    }
    if (failure.stage === "LIGHTHOUSE" && lighthouse.status === "NOT_RUN") {
      lighthouse = { ...lighthouse, status: "FAIL" };
    }
    summary = {
      ...summary,
      binding,
      deploymentSuite,
      lighthouse,
      overall: "FAIL",
      failure: { stage: failure.stage, code: failure.code },
      generatedAt: new Date().toISOString(),
    };
    try {
      await writeSummary(summary, requireHosted);
    } catch {
      process.stderr.write(
        "Post-deployment verification could not write a valid sanitized summary.\n",
      );
    }
  }
  process.stderr.write(`Post-deployment verification failed closed: ${failure.message}.\n`);
  process.exitCode = 1;
}
