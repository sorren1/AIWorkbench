import { createHash } from "node:crypto";
import { copyFile, lstat, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, relative, resolve } from "node:path";
import { spawn } from "node:child_process";

import { z } from "zod";

import {
  licensePolicySchema,
  suppressionSchema,
  toolingSchema,
  type ReleaseControlSummary,
  type ReleaseSummary,
  type SarifFinding,
  type SupplyChainSuppression,
} from "./contracts";
import {
  analyzeComposeConfig,
  analyzeLanguageCoverage,
  analyzeSandboxDockerfile,
} from "./containerPolicy";
import { createSarif, sanitizeSarif, sarifFindings, sha256File, writeJson } from "./reporting";

type CommandResult = {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
};

const root = resolve(import.meta.dirname, "../..");
const reportsRoot = resolve(root, ".security-reports");
const recordSummary = process.argv.includes("--record");
const npmCli =
  process.env.npm_execpath ?? resolve(dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");

async function command(
  executable: string,
  args: readonly string[],
  options: { readonly cwd?: string; readonly env?: Readonly<Record<string, string>> } = {},
): Promise<CommandResult> {
  return new Promise((accept, reject) => {
    const child = spawn(executable, args, {
      cwd: options.cwd ?? root,
      env: { ...process.env, ...options.env },
      shell: false,
      windowsHide: true,
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (code) => {
      accept({
        exitCode: code ?? 1,
        stdout: Buffer.concat(stdout).toString("utf8"),
        stderr: Buffer.concat(stderr).toString("utf8"),
      });
    });
  });
}

async function readJson(path: string): Promise<unknown> {
  return JSON.parse(await readFile(path, "utf8"));
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^file:\/\//, "");
}

function isSuppressed(
  entries: readonly SupplyChainSuppression[],
  scanner: SupplyChainSuppression["scanner"],
  finding: Pick<SarifFinding, "ruleId" | "path">,
): boolean {
  const path = normalizePath(finding.path);
  return entries.some(
    (entry) =>
      entry.scanner === scanner &&
      entry.ruleId === finding.ruleId &&
      normalizePath(entry.path) === path,
  );
}

async function trackedPaths(): Promise<string[]> {
  const result = await command("git", [
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
  ]);
  if (result.exitCode !== 0) throw new Error("Unable to enumerate supply-chain scan inputs.");
  return result.stdout
    .split("\0")
    .filter((path) => path.length > 0)
    .sort();
}

async function treeDigest(paths: readonly string[]): Promise<string> {
  const hash = createHash("sha256");
  for (const path of paths) {
    const absolute = resolve(root, path);
    const stat = await lstat(absolute);
    if (!stat.isFile() || stat.isSymbolicLink()) {
      throw new Error(`Supply-chain input must be a regular file: ${path}`);
    }
    hash.update(path.replaceAll("\\", "/"));
    hash.update("\0");
    hash.update(await readFile(absolute));
    hash.update("\0");
  }
  return hash.digest("hex");
}

async function copyScanInput(paths: readonly string[]): Promise<string> {
  const destination = await mkdtemp(resolve(tmpdir(), "adw-supply-chain-"));
  for (const path of paths) {
    const output = resolve(destination, path);
    await mkdir(dirname(output), { recursive: true });
    await copyFile(resolve(root, path), output);
  }
  return destination;
}

async function dockerRun(
  image: string,
  args: readonly string[],
  mounts: readonly string[] = [],
): Promise<CommandResult> {
  return command("docker", [
    "run",
    "--rm",
    ...mounts.flatMap((mount) => ["--volume", mount]),
    image,
    ...args,
  ]);
}

async function runGitleaks(
  image: string,
  mode: "git" | "dir",
  source: string,
  reportName: string,
  sourceMount: string,
  suppressions: readonly SupplyChainSuppression[],
): Promise<SarifFinding[]> {
  const result = await dockerRun(
    image,
    [
      mode,
      "--no-banner",
      "--no-color",
      "--redact=100",
      "--report-format",
      "sarif",
      "--report-path",
      `/reports/${reportName}`,
      "--timeout",
      "120",
      source,
    ],
    [`${sourceMount}:${source}:ro`, `${reportsRoot}:/reports`],
  );
  if (![0, 1].includes(result.exitCode)) {
    throw new Error(`Gitleaks ${mode} scan could not complete.`);
  }
  const reportPath = resolve(reportsRoot, reportName);
  await sanitizeSarif(reportPath);
  const findings = sarifFindings(await readJson(reportPath), source);
  return findings.filter((finding) => !isSuppressed(suppressions, "gitleaks", finding));
}

const eslintOutputSchema = z.array(
  z.object({
    filePath: z.string(),
    messages: z.array(
      z.object({
        ruleId: z.string().nullable(),
        severity: z.number(),
        message: z.string(),
        line: z.number().optional(),
        column: z.number().optional(),
      }),
    ),
  }),
);

async function runEslint(suppressions: readonly SupplyChainSuppression[]): Promise<SarifFinding[]> {
  const jsonPath = resolve(reportsRoot, "eslint.json");
  const eslint = resolve(root, "node_modules/eslint/bin/eslint.js");
  const result = await command(process.execPath, [
    eslint,
    ".",
    "--format",
    "json",
    "--output-file",
    jsonPath,
  ]);
  if (![0, 1].includes(result.exitCode))
    throw new Error("ESLint static analysis could not complete.");
  const parsed = eslintOutputSchema.parse(await readJson(jsonPath));
  const findings = parsed.flatMap((file) =>
    file.messages.map((message) => ({
      ruleId: message.ruleId ?? "eslint/configuration",
      level: message.severity >= 2 ? ("error" as const) : ("warning" as const),
      message: message.message,
      path: normalizePath(relative(root, file.filePath)),
      ...(message.line ? { line: message.line } : {}),
      ...(message.column ? { column: message.column } : {}),
    })),
  );
  const sarifPath = resolve(reportsRoot, "eslint.sarif");
  await writeJson(
    sarifPath,
    createSarif({
      name: "ESLint",
      version: "10.7.0",
      informationUri: "https://eslint.org/",
      findings,
    }),
  );
  await rm(jsonPath, { force: true });
  return findings.filter((finding) => !isSuppressed(suppressions, "eslint", finding));
}

async function runContainerPolicy(
  paths: readonly string[],
  tooling: z.infer<typeof toolingSchema>,
  suppressions: readonly SupplyChainSuppression[],
): Promise<SarifFinding[]> {
  const compose = await command(
    "docker",
    ["compose", "-f", "ops/model-gateway/compose.yaml", "config", "--format", "json"],
    {
      env: {
        LITELLM_DB_PASSWORD: "synthetic-config-validation",
        LITELLM_MASTER_KEY: "synthetic-config-validation",
        LITELLM_SALT_KEY: "synthetic-config-validation",
        MODEL_GATEWAY_UPSTREAM_API_KEY: "synthetic-config-validation",
        MODEL_GATEWAY_PRIMARY_MODEL: "synthetic/provider-primary",
        MODEL_GATEWAY_FALLBACK_MODEL: "synthetic/provider-fallback",
        MODEL_GATEWAY_REVIEW_MODEL: "synthetic/provider-review",
      },
    },
  );
  if (compose.exitCode !== 0) throw new Error("Docker Compose configuration validation failed.");
  const findings = [
    ...analyzeComposeConfig(JSON.parse(compose.stdout) as unknown),
    ...(await analyzeSandboxDockerfile(root, tooling)),
    ...analyzeLanguageCoverage(paths),
  ];
  const sarifPath = resolve(reportsRoot, "container-policy.sarif");
  await writeJson(
    sarifPath,
    createSarif({
      name: "AI Delivery Workbench container policy",
      version: "1.0.0",
      findings,
    }),
  );
  return findings.filter((finding) => !isSuppressed(suppressions, "container-policy", finding));
}

const auditSchema = z.object({
  vulnerabilities: z.record(
    z.string(),
    z.object({
      severity: z.string(),
      via: z.array(
        z.union([z.string(), z.looseObject({ source: z.union([z.string(), z.number()]) })]),
      ),
    }),
  ),
  metadata: z.object({
    vulnerabilities: z.object({
      info: z.number(),
      low: z.number(),
      moderate: z.number(),
      high: z.number(),
      critical: z.number(),
      total: z.number(),
    }),
  }),
});

async function runNpmAudit(suppressions: readonly SupplyChainSuppression[]): Promise<{
  readonly findings: SarifFinding[];
  readonly totals: z.infer<typeof auditSchema>["metadata"]["vulnerabilities"];
}> {
  const result = await command(process.execPath, [npmCli, "audit", "--json", "--audit-level=high"]);
  if (![0, 1].includes(result.exitCode))
    throw new Error("npm dependency audit could not complete.");
  const audit = auditSchema.parse(JSON.parse(result.stdout) as unknown);
  await writeJson(resolve(reportsRoot, "npm-audit.json"), audit);
  const findings = Object.entries(audit.vulnerabilities).flatMap(([name, vulnerability]) => {
    if (!(["high", "critical"] as const).includes(vulnerability.severity as "high" | "critical")) {
      return [];
    }
    const ruleIds = vulnerability.via.map((entry) =>
      typeof entry === "string" ? entry : String(entry.source),
    );
    return (ruleIds.length > 0 ? ruleIds : [`npm:${name}`]).map((ruleId) => ({
      ruleId,
      level: "error" as const,
      message: `${vulnerability.severity} dependency vulnerability in ${name}`,
      path: `package:${name}`,
    }));
  });
  return {
    findings: findings.filter((finding) => !isSuppressed(suppressions, "npm-audit", finding)),
    totals: audit.metadata.vulnerabilities,
  };
}

const bomSchema = z.object({
  bomFormat: z.literal("CycloneDX"),
  specVersion: z.string(),
  components: z.array(
    z.object({
      name: z.string(),
      version: z.string().optional(),
      scope: z.string().optional(),
      licenses: z
        .array(
          z.object({
            expression: z.string().optional(),
            license: z
              .object({ id: z.string().optional(), name: z.string().optional() })
              .optional(),
          }),
        )
        .optional(),
    }),
  ),
});

function componentLicenses(component: z.infer<typeof bomSchema>["components"][number]): string[] {
  return (component.licenses ?? []).map(
    (entry) => entry.expression ?? entry.license?.id ?? entry.license?.name ?? "NOASSERTION",
  );
}

async function generateNpmSboms(): Promise<{
  readonly componentCount: number;
  readonly licenseCount: number;
  readonly licenseFindings: SarifFinding[];
}> {
  const cli = resolve(root, "node_modules/@cyclonedx/cyclonedx-npm/bin/cyclonedx-npm-cli.js");
  const common = [
    cli,
    "--spec-version",
    "1.6",
    "--output-format",
    "JSON",
    "--output-reproducible",
    "--validate",
  ];
  const productionPath = resolve(reportsRoot, "npm-production.cdx.json");
  const allPath = resolve(reportsRoot, "npm-all.cdx.json");
  const production = await command(process.execPath, [
    ...common,
    "--omit",
    "dev",
    "--output-file",
    productionPath,
    "package.json",
  ]);
  const all = await command(process.execPath, [
    ...common,
    "--output-file",
    allPath,
    "package.json",
  ]);
  if (production.exitCode !== 0 || all.exitCode !== 0) {
    throw new Error("CycloneDX npm SBOM generation or validation failed.");
  }
  const bom = bomSchema.parse(await readJson(allPath));
  const licensePolicy = licensePolicySchema.parse(
    await readJson(resolve(root, "security/license-policy.json")),
  );
  const allowed = new Set(licensePolicy.allowedExpressions);
  const inventory = bom.components
    .map((component) => ({
      name: component.name,
      version: component.version ?? "unknown",
      scope: component.scope ?? "required",
      licenses: componentLicenses(component),
    }))
    .sort((left, right) =>
      `${left.name}@${left.version}`.localeCompare(`${right.name}@${right.version}`),
    );
  const licenseFindings = inventory.flatMap((component) => {
    if (component.licenses.length === 0 && licensePolicy.requireDeclaredLicense) {
      return [
        {
          ruleId: "LICENSE-NOT-DECLARED",
          level: "error" as const,
          message: `${component.name}@${component.version} does not declare a license.`,
          path: `package:${component.name}`,
        },
      ];
    }
    return component.licenses
      .filter(
        (license) => !allowed.has(license) || licensePolicy.deniedExpressions.includes(license),
      )
      .map((license) => ({
        ruleId: "LICENSE-NOT-ALLOWED",
        level: "error" as const,
        message: `${component.name}@${component.version} declares unapproved license ${license}.`,
        path: `package:${component.name}`,
      }));
  });
  await writeJson(resolve(reportsRoot, "license-inventory.json"), {
    schemaVersion: 1,
    policy: "security/license-policy.json",
    components: inventory,
  });
  await writeJson(
    resolve(reportsRoot, "license-policy.sarif"),
    createSarif({
      name: "AI Delivery Workbench license policy",
      version: "1.0.0",
      findings: licenseFindings,
    }),
  );
  return {
    componentCount: inventory.length,
    licenseCount: new Set(inventory.flatMap((component) => component.licenses)).size,
    licenseFindings,
  };
}

async function buildAndScanSandbox(
  tooling: z.infer<typeof toolingSchema>,
  suppressions: readonly SupplyChainSuppression[],
): Promise<{ readonly imageId: string; readonly findings: SarifFinding[] }> {
  const build = await command("docker", ["build", "--tag", tooling.sandbox.image, "ops/sandbox"]);
  if (build.exitCode !== 0) throw new Error("Sandbox runtime image build failed.");
  const inspect = await command("docker", [
    "image",
    "inspect",
    tooling.sandbox.image,
    "--format",
    "{{.Id}}",
  ]);
  const imageId = inspect.stdout.trim();
  if (inspect.exitCode !== 0 || !/^sha256:[a-f0-9]{64}$/.test(imageId)) {
    throw new Error("Sandbox runtime image did not resolve to a content ID.");
  }
  const mounts = [
    "/var/run/docker.sock:/var/run/docker.sock",
    `${reportsRoot}:/reports`,
    "ai-delivery-workbench-trivy-cache:/root/.cache/trivy",
  ];
  const vulnerabilityReport = "sandbox-image.sarif";
  const vulnerability = await dockerRun(
    tooling.trivy.image,
    [
      "image",
      "--quiet",
      "--timeout",
      "5m0s",
      "--image-src",
      "docker",
      "--scanners",
      "vuln",
      "--severity",
      tooling.policy.containerFailureSeverities.join(","),
      "--format",
      "sarif",
      "--output",
      `/reports/${vulnerabilityReport}`,
      imageId,
    ],
    mounts,
  );
  if (vulnerability.exitCode !== 0) throw new Error("Trivy container vulnerability scan failed.");
  const sbom = await dockerRun(
    tooling.trivy.image,
    [
      "image",
      "--quiet",
      "--timeout",
      "5m0s",
      "--image-src",
      "docker",
      "--format",
      "cyclonedx",
      "--output",
      "/reports/sandbox-image.cdx.json",
      imageId,
    ],
    mounts,
  );
  if (sbom.exitCode !== 0) throw new Error("Trivy container SBOM generation failed.");
  bomSchema.parse(await readJson(resolve(reportsRoot, "sandbox-image.cdx.json")));
  const reportPath = resolve(reportsRoot, vulnerabilityReport);
  await sanitizeSarif(reportPath);
  const findings = sarifFindings(await readJson(reportPath), `image:${imageId}`);
  return {
    imageId,
    findings: findings.filter((finding) => !isSuppressed(suppressions, "trivy", finding)),
  };
}

async function scannerMetadata(
  tooling: z.infer<typeof toolingSchema>,
  imageId: string,
): Promise<Record<string, unknown>> {
  const [docker, eslint, cyclone, gitleaks, trivy] = await Promise.all([
    command("docker", ["version", "--format", "{{.Client.Version}}|{{.Server.Version}}"]),
    command(process.execPath, [resolve(root, "node_modules/eslint/bin/eslint.js"), "--version"]),
    command(process.execPath, [
      resolve(root, "node_modules/@cyclonedx/cyclonedx-npm/bin/cyclonedx-npm-cli.js"),
      "--version",
    ]),
    dockerRun(tooling.gitleaks.image, ["version"]),
    dockerRun(
      tooling.trivy.image,
      ["--version"],
      ["ai-delivery-workbench-trivy-cache:/root/.cache/trivy"],
    ),
  ]);
  if ([docker, eslint, cyclone, gitleaks, trivy].some((result) => result.exitCode !== 0)) {
    throw new Error("Scanner version collection failed.");
  }
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    scanners: {
      gitleaks: { version: gitleaks.stdout.trim(), image: tooling.gitleaks.image },
      eslint: { version: eslint.stdout.trim() },
      trivy: { version: trivy.stdout.trim(), image: tooling.trivy.image },
      cycloneDxNpm: { version: cyclone.stdout.trim() },
      codeql: { version: tooling.codeql.version, actionSha: tooling.codeql.actionSha },
      npmAudit: { version: process.env.npm_config_user_agent?.split(" ")[0] ?? "npm" },
      containerPolicy: { version: "1.0.0", dockerCompose: docker.stdout.trim() },
    },
    targets: {
      sandboxImage: tooling.sandbox.image,
      sandboxImageId: imageId,
      sandboxBaseImage: tooling.sandbox.baseImage,
    },
  };
}

function control(input: ReleaseControlSummary): ReleaseControlSummary {
  return input;
}

async function main(): Promise<void> {
  await rm(reportsRoot, { force: true, recursive: true });
  await mkdir(reportsRoot, { recursive: true });
  const tooling = toolingSchema.parse(await readJson(resolve(root, "security/tooling.json")));
  const suppressionDocument = suppressionSchema.parse(
    await readJson(resolve(root, "security/suppressions.json")),
  );
  const suppressionIds = new Set<string>();
  const today = new Date().toISOString().slice(0, 10);
  let expired = 0;
  for (const entry of suppressionDocument.entries) {
    if (suppressionIds.has(entry.id)) throw new Error(`Duplicate suppression ID: ${entry.id}`);
    suppressionIds.add(entry.id);
    if (entry.expiresOn < today || entry.reviewOn > entry.expiresOn) expired += 1;
  }
  if (expired > 0) throw new Error("One or more supply-chain suppressions are expired or invalid.");

  const paths = await trackedPaths();
  const sourceTreeDigest = await treeDigest(
    paths.filter((path) => path !== "public/security/release-summary.json"),
  );
  const scanInput = await copyScanInput(paths);
  try {
    const historySecrets = await runGitleaks(
      tooling.gitleaks.image,
      "git",
      "/repo",
      "gitleaks-history.sarif",
      root,
      suppressionDocument.entries,
    );
    const worktreeSecrets = await runGitleaks(
      tooling.gitleaks.image,
      "dir",
      "/scan",
      "gitleaks-worktree.sarif",
      scanInput,
      suppressionDocument.entries,
    );
    const eslintFindings = await runEslint(suppressionDocument.entries);
    const containerPolicyFindings = await runContainerPolicy(
      paths,
      tooling,
      suppressionDocument.entries,
    );
    const npmAudit = await runNpmAudit(suppressionDocument.entries);
    const licenses = await generateNpmSboms();
    const sandbox = await buildAndScanSandbox(tooling, suppressionDocument.entries);

    const blocking = [
      ...historySecrets,
      ...worktreeSecrets,
      ...eslintFindings,
      ...containerPolicyFindings,
      ...npmAudit.findings,
      ...licenses.licenseFindings,
      ...sandbox.findings,
    ];
    await writeJson(resolve(reportsRoot, "suppression-report.json"), {
      schemaVersion: 1,
      active: suppressionDocument.entries,
      expired,
      unsuppressedFindingCount: blocking.length,
    });
    const metadata = await scannerMetadata(tooling, sandbox.imageId);
    await writeJson(resolve(reportsRoot, "scanner-metadata.json"), metadata);

    if (blocking.length > 0) {
      throw new Error(
        `Supply-chain policy failed with ${blocking.length} unsuppressed finding(s); inspect the private CI artifacts.`,
      );
    }

    const baseCommitResult = await command("git", ["rev-parse", "HEAD"]);
    const statusResult = await command("git", ["status", "--porcelain", "--untracked-files=all"]);
    if (baseCommitResult.exitCode !== 0 || statusResult.exitCode !== 0) {
      throw new Error("Unable to bind supply-chain summary to source state.");
    }
    const baseCommit = process.env.GITHUB_SHA ?? baseCommitResult.stdout.trim();
    const generatedAt = new Date().toISOString();
    const controls = [
      control({
        id: "secret-scan",
        label: "Tracked files and Git history secret scan",
        status: "PASSED",
        scanner: "Gitleaks",
        version: tooling.gitleaks.version,
        target: `${paths.length} source files plus reachable Git history`,
        findingCount: 0,
        detail:
          "Redacted SARIF reports were generated for history and the tracked worktree snapshot.",
      }),
      control({
        id: "static-analysis",
        label: "TypeScript, JavaScript, and container configuration static analysis",
        status: "PASSED",
        scanner: "ESLint + repository container policy",
        version: "10.7.0 / 1.0.0",
        target: "TypeScript/JavaScript sources, Compose configuration, and sandbox Dockerfile",
        findingCount: 0,
        detail:
          "Language coverage fails closed if unscanned Python, shell, PowerShell, or Dockerfile sources appear.",
      }),
      control({
        id: "dependency-scan",
        label: "Locked npm dependency vulnerability scan",
        status: "PASSED",
        scanner: "npm audit",
        version: process.env.npm_config_user_agent?.split(" ")[0] ?? "npm",
        target: "package-lock.json",
        findingCount: npmAudit.totals.high + npmAudit.totals.critical,
        detail: "The release gate fails all unsuppressed high and critical findings.",
      }),
      control({
        id: "container-scan",
        label: "Sandbox runtime container vulnerability scan",
        status: "PASSED",
        scanner: "Trivy",
        version: tooling.trivy.version,
        target: sandbox.imageId,
        findingCount: 0,
        detail: "The exact locally built image ID was scanned for high and critical findings.",
      }),
      control({
        id: "sbom",
        label: "CycloneDX software bills of materials",
        status: "PASSED",
        scanner: "CycloneDX npm + Trivy",
        version: `${tooling.cycloneDxNpm.version} / ${tooling.trivy.version}`,
        target: "Locked npm production graph and sandbox runtime image",
        findingCount: 0,
        detail:
          "Validated CycloneDX JSON artifacts were generated and retained outside the repository.",
      }),
      control({
        id: "license-policy",
        label: "Dependency license inventory and policy",
        status: "PASSED",
        scanner: "CycloneDX inventory + repository policy",
        version: "1.0.0",
        target: `${licenses.componentCount} npm components / ${licenses.licenseCount} license expressions`,
        findingCount: 0,
        detail: "Every inventoried npm component declared an allowed license expression.",
      }),
      control({
        id: "codeql",
        label: "GitHub CodeQL JavaScript/TypeScript analysis",
        status: "CONFIGURED_NOT_RUN",
        scanner: "GitHub CodeQL",
        version: `${tooling.codeql.version} @ ${tooling.codeql.actionSha.slice(0, 12)}`,
        target: "JavaScript/TypeScript",
        findingCount: null,
        detail:
          "The hosted workflow is configured, but no successful GitHub run was available to this local validation.",
      }),
      control({
        id: "python-shell",
        label: "Python and shell source analysis",
        status: "NOT_APPLICABLE",
        scanner: "Language coverage policy",
        version: "1.0.0",
        target: "Tracked source inventory",
        findingCount: null,
        detail:
          "No tracked Python, shell, or PowerShell source files are present; adding one fails the gate until a scanner is configured.",
      }),
    ] satisfies ReleaseControlSummary[];

    const artifactNames: readonly {
      readonly kind: ReleaseSummary["artifacts"][number]["kind"];
      readonly name: string;
    }[] = [
      { kind: "SARIF", name: "gitleaks-history.sarif" },
      { kind: "SARIF", name: "gitleaks-worktree.sarif" },
      { kind: "SARIF", name: "eslint.sarif" },
      { kind: "SARIF", name: "container-policy.sarif" },
      { kind: "SARIF", name: "license-policy.sarif" },
      { kind: "SARIF", name: "sandbox-image.sarif" },
      { kind: "SBOM", name: "npm-production.cdx.json" },
      { kind: "SBOM", name: "npm-all.cdx.json" },
      { kind: "SBOM", name: "sandbox-image.cdx.json" },
      { kind: "INVENTORY", name: "license-inventory.json" },
      { kind: "INVENTORY", name: "scanner-metadata.json" },
      { kind: "INVENTORY", name: "suppression-report.json" },
      { kind: "SUMMARY", name: "npm-audit.json" },
    ];
    const artifacts = await Promise.all(
      artifactNames.map(async (artifact) => ({
        ...artifact,
        sha256: await sha256File(resolve(reportsRoot, artifact.name)),
      })),
    );
    const summary: ReleaseSummary = {
      schemaVersion: 1,
      generatedAt,
      source: {
        baseCommit,
        revisionKind: statusResult.stdout.trim().length === 0 ? "COMMIT" : "WORKTREE",
        treeDigest: sourceTreeDigest,
      },
      controls,
      artifacts,
      suppressions: { active: suppressionDocument.entries.length, expired },
    };
    await writeJson(resolve(reportsRoot, "release-summary.json"), summary);
    const markdown = [
      "# Software supply-chain security summary",
      "",
      `Generated: ${generatedAt}`,
      `Source base commit: ${baseCommit}`,
      `Source state: ${summary.source.revisionKind}`,
      `Source tree digest: ${sourceTreeDigest}`,
      "",
      "| Control | Status | Scanner | Findings |",
      "| --- | --- | --- | ---: |",
      ...controls.map(
        (item) =>
          `| ${item.label} | ${item.status} | ${item.scanner} ${item.version} | ${item.findingCount ?? "n/a"} |`,
      ),
      "",
      `Active suppressions: ${summary.suppressions.active}`,
      "",
      "Detailed SARIF, SBOM, inventory, and scanner metadata files are retained as local/CI artifacts and are intentionally not committed.",
      "",
    ].join("\n");
    await writeFile(resolve(reportsRoot, "security-summary.md"), markdown, "utf8");
    if (recordSummary) {
      const publicPath = resolve(root, "public/security/release-summary.json");
      await mkdir(dirname(publicPath), { recursive: true });
      await writeJson(publicPath, summary);
    }
    process.stdout.write(
      `Supply-chain evidence passed: ${controls.filter((item) => item.status === "PASSED").length} controls passed, ${summary.suppressions.active} suppressions, sandbox ${sandbox.imageId.slice(0, 19)}.\n`,
    );
  } finally {
    await rm(scanInput, { force: true, recursive: true });
  }
}

await main();
