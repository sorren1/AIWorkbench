import { createHash } from "node:crypto";
import { copyFile, lstat, mkdir, mkdtemp, open, readFile, rm, writeFile } from "node:fs/promises";
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
  type RuntimeImageSummary,
  type SarifFinding,
  type SupplyChainSuppression,
} from "./contracts";
import {
  analyzeComposeConfig,
  analyzeLanguageCoverage,
  analyzeLiteLlmDockerfile,
  analyzeSandboxDockerfile,
} from "./containerPolicy";
import { createSarif, sanitizeSarif, sarifFindings, sha256File, writeJson } from "./reporting";
import { versionAtLeast } from "./versionPolicy";

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
const composeSyntheticEnvironment = {
  LITELLM_DB_PASSWORD: "synthetic-config-validation",
  LITELLM_MASTER_KEY: "sk-synthetic-config-validation",
  LITELLM_SALT_KEY: "sk-synthetic-salt-validation",
  MODEL_GATEWAY_UPSTREAM_API_KEY: "sk-synthetic-config-validation",
  MODEL_GATEWAY_PRIMARY_MODEL: "synthetic/provider-primary",
  MODEL_GATEWAY_FALLBACK_MODEL: "synthetic/provider-fallback",
  MODEL_GATEWAY_REVIEW_MODEL: "synthetic/provider-review",
} as const;

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
  matchedSuppressionIds: Set<string>,
): boolean {
  const path = normalizePath(finding.path);
  const matching = entries.filter(
    (entry) =>
      entry.scanner === scanner &&
      entry.ruleId === finding.ruleId &&
      normalizePath(entry.path) === path,
  );
  for (const entry of matching) matchedSuppressionIds.add(entry.id);
  return matching.length > 0;
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
  const candidates = result.stdout
    .split("\0")
    .filter((path) => path.length > 0)
    .sort();
  const present: string[] = [];
  for (const path of candidates) {
    const metadata = await lstat(resolve(root, path)).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    });
    if (metadata) present.push(path);
  }
  return present;
}

async function treeDigest(paths: readonly string[]): Promise<string> {
  const hash = createHash("sha256");
  for (const path of paths) {
    const absolute = resolve(root, path);
    const handle = await open(absolute, "r");
    try {
      const stat = await handle.stat();
      if (!stat.isFile()) {
        throw new Error(`Supply-chain input must be a regular file: ${path}`);
      }
      hash.update(path.replaceAll("\\", "/"));
      hash.update("\0");
      hash.update(await handle.readFile());
      hash.update("\0");
    } finally {
      await handle.close();
    }
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
  matchedSuppressionIds: Set<string>,
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
  return findings.filter(
    (finding) => !isSuppressed(suppressions, "gitleaks", finding, matchedSuppressionIds),
  );
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

async function runEslint(
  suppressions: readonly SupplyChainSuppression[],
  matchedSuppressionIds: Set<string>,
): Promise<SarifFinding[]> {
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
  return findings.filter(
    (finding) => !isSuppressed(suppressions, "eslint", finding, matchedSuppressionIds),
  );
}

async function runContainerPolicy(
  paths: readonly string[],
  tooling: z.infer<typeof toolingSchema>,
  suppressions: readonly SupplyChainSuppression[],
  matchedSuppressionIds: Set<string>,
): Promise<SarifFinding[]> {
  const compose = await command(
    "docker",
    ["compose", "-f", "ops/model-gateway/compose.yaml", "config", "--format", "json"],
    {
      env: composeSyntheticEnvironment,
    },
  );
  if (compose.exitCode !== 0) throw new Error("Docker Compose configuration validation failed.");
  const findings = [
    ...analyzeComposeConfig(JSON.parse(compose.stdout) as unknown, {
      expectedImages: {
        database: tooling.postgres.image,
        gateway: tooling.liteLlm.image,
      },
      locallyBuiltServices: ["gateway"],
    }),
    ...(await analyzeSandboxDockerfile(root, tooling)),
    ...(await analyzeLiteLlmDockerfile(root, tooling)),
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
  return findings.filter(
    (finding) => !isSuppressed(suppressions, "container-policy", finding, matchedSuppressionIds),
  );
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

async function runNpmAudit(
  suppressions: readonly SupplyChainSuppression[],
  matchedSuppressionIds: Set<string>,
): Promise<{
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
    findings: findings.filter(
      (finding) => !isSuppressed(suppressions, "npm-audit", finding, matchedSuppressionIds),
    ),
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

type RuntimeImageScan = {
  readonly role: RuntimeImageSummary["role"];
  readonly displayName: string;
  readonly reference: string;
  readonly imageId: string;
  readonly sarifArtifact: string;
  readonly sbomArtifact: string;
  readonly bom: z.infer<typeof bomSchema>;
  readonly findings: readonly SarifFinding[];
};

async function inspectImageId(reference: string): Promise<string> {
  const inspect = await command("docker", ["image", "inspect", reference, "--format", "{{.Id}}"]);
  const imageId = inspect.stdout.trim();
  if (inspect.exitCode !== 0 || !/^sha256:[a-f0-9]{64}$/.test(imageId)) {
    throw new Error(`Runtime image did not resolve to a content ID: ${reference}`);
  }
  return imageId;
}

async function scanRuntimeImage(input: {
  readonly role: RuntimeImageSummary["role"];
  readonly displayName: string;
  readonly reference: string;
  readonly imageId: string;
  readonly artifactPrefix: string;
  readonly tooling: z.infer<typeof toolingSchema>;
  readonly suppressions: readonly SupplyChainSuppression[];
  readonly matchedSuppressionIds: Set<string>;
}): Promise<RuntimeImageScan> {
  const mounts = [
    "/var/run/docker.sock:/var/run/docker.sock",
    `${reportsRoot}:/reports`,
    "ai-delivery-workbench-trivy-cache:/root/.cache/trivy",
  ];
  const vulnerabilityReport = `${input.artifactPrefix}.sarif`;
  const sbomArtifact = `${input.artifactPrefix}.cdx.json`;
  const vulnerability = await dockerRun(
    input.tooling.trivy.image,
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
      input.tooling.policy.containerFailureSeverities.join(","),
      "--format",
      "sarif",
      "--output",
      `/reports/${vulnerabilityReport}`,
      input.imageId,
    ],
    mounts,
  );
  if (vulnerability.exitCode !== 0) throw new Error("Trivy container vulnerability scan failed.");
  const sbom = await dockerRun(
    input.tooling.trivy.image,
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
      `/reports/${sbomArtifact}`,
      input.imageId,
    ],
    mounts,
  );
  if (sbom.exitCode !== 0) throw new Error("Trivy container SBOM generation failed.");
  const bom = bomSchema.parse(await readJson(resolve(reportsRoot, sbomArtifact)));
  const reportPath = resolve(reportsRoot, vulnerabilityReport);
  await sanitizeSarif(reportPath);
  const target = input.reference.includes("@sha256:") ? input.reference : input.imageId;
  const findings = sarifFindings(await readJson(reportPath), `image:${target}`).map((finding) => ({
    ...finding,
    path:
      finding.path === `image:${input.imageId}`
        ? `image:${target}`
        : `image:${target}/${finding.path.replace(/^\/+/, "")}`,
  }));
  return {
    role: input.role,
    displayName: input.displayName,
    reference: input.reference,
    imageId: input.imageId,
    sarifArtifact: vulnerabilityReport,
    sbomArtifact,
    bom,
    findings: findings.filter(
      (finding) => !isSuppressed(input.suppressions, "trivy", finding, input.matchedSuppressionIds),
    ),
  };
}

async function buildAndScanSandbox(
  tooling: z.infer<typeof toolingSchema>,
  suppressions: readonly SupplyChainSuppression[],
  matchedSuppressionIds: Set<string>,
): Promise<RuntimeImageScan> {
  const build = await command("docker", [
    "build",
    "--pull",
    "--tag",
    tooling.sandbox.image,
    "ops/sandbox",
  ]);
  if (build.exitCode !== 0) throw new Error("Sandbox runtime image build failed.");
  const imageId = await inspectImageId(tooling.sandbox.image);
  return scanRuntimeImage({
    role: "sandbox",
    displayName: "Sandbox",
    reference: tooling.sandbox.image,
    imageId,
    artifactPrefix: "sandbox-image",
    tooling,
    suppressions,
    matchedSuppressionIds,
  });
}

const cosignClaimSchema = z.array(
  z.object({
    critical: z.object({
      image: z.object({ "docker-manifest-digest": z.string() }),
      type: z.string(),
    }),
  }),
);

async function verifyLiteLlmSignature(tooling: z.infer<typeof toolingSchema>): Promise<void> {
  const publicKeyPath = resolve(root, tooling.liteLlm.cosignPublicKey);
  if ((await sha256File(publicKeyPath)) !== tooling.liteLlm.cosignPublicKeySha256) {
    throw new Error("LiteLLM Cosign public key does not match its pinned digest.");
  }
  const pull = await command("docker", ["pull", tooling.liteLlm.upstreamImage]);
  if (pull.exitCode !== 0) throw new Error("Pinned LiteLLM upstream image pull failed.");
  const verification = await dockerRun(
    tooling.cosign.image,
    ["verify", "--key", "/keys/litellm-cosign.pub", tooling.liteLlm.upstreamImage],
    [`${dirname(publicKeyPath)}:/keys:ro`],
  );
  if (verification.exitCode !== 0) throw new Error("LiteLLM Cosign verification failed.");
  const claims = cosignClaimSchema.parse(JSON.parse(verification.stdout) as unknown);
  const expectedDigest = tooling.liteLlm.upstreamImage.split("@")[1];
  if (
    claims.length === 0 ||
    claims.some((claim) => claim.critical.image["docker-manifest-digest"] !== expectedDigest) ||
    !claims.some((claim) => claim.critical.type === "https://sigstore.dev/cosign/sign/v1")
  ) {
    throw new Error("LiteLLM Cosign claims do not bind the configured upstream digest.");
  }
  await writeJson(resolve(reportsRoot, "litellm-signature.json"), {
    schemaVersion: 1,
    verified: true,
    image: tooling.liteLlm.upstreamImage,
    digest: expectedDigest,
    verifier: { version: tooling.cosign.version, image: tooling.cosign.image },
    publicKey: {
      path: tooling.liteLlm.cosignPublicKey,
      sha256: tooling.liteLlm.cosignPublicKeySha256,
      source:
        "https://raw.githubusercontent.com/BerriAI/litellm/0112e53046018d726492c814b3644b7d376029d0/cosign.pub",
    },
    claimTypes: [...new Set(claims.map((claim) => claim.critical.type))].sort(),
    signatureCount: claims.length,
    transparencyLogVerified: verification.stderr.includes("transparency log was verified"),
  });
}

function liteLlmPackageFloorFindings(
  scan: RuntimeImageScan,
  tooling: z.infer<typeof toolingSchema>,
): SarifFinding[] {
  return Object.entries(tooling.liteLlm.minimumVersions).flatMap(([name, minimum]) => {
    const installed = scan.bom.components
      .filter((component) => component.name === name)
      .map((component) => component.version)
      .filter((version): version is string => version !== undefined);
    if (installed.length > 0 && installed.every((version) => versionAtLeast(version, minimum))) {
      return [];
    }
    return [
      {
        ruleId: "CONTAINER-PACKAGE-MINIMUM",
        level: "error" as const,
        message: `${name} must be ${minimum} or newer; found ${installed.join(", ") || "nothing"}.`,
        path: `image:${scan.imageId}/package:${name}`,
      },
    ];
  });
}

async function buildAndScanLiteLlm(
  tooling: z.infer<typeof toolingSchema>,
  suppressions: readonly SupplyChainSuppression[],
  matchedSuppressionIds: Set<string>,
): Promise<RuntimeImageScan> {
  await verifyLiteLlmSignature(tooling);
  const build = await command(
    "docker",
    ["compose", "-f", "ops/model-gateway/compose.yaml", "build", "--pull", "gateway"],
    { env: composeSyntheticEnvironment },
  );
  if (build.exitCode !== 0) throw new Error("Patched LiteLLM runtime image build failed.");
  const imageId = await inspectImageId(tooling.liteLlm.image);
  const user = await command("docker", [
    "image",
    "inspect",
    imageId,
    "--format",
    "{{.Config.User}}",
  ]);
  if (user.exitCode !== 0 || user.stdout.trim() !== "65534") {
    throw new Error("Patched LiteLLM runtime image is not configured for numeric user 65534.");
  }
  const scan = await scanRuntimeImage({
    role: "litellm",
    displayName: "LiteLLM gateway",
    reference: tooling.liteLlm.image,
    imageId,
    artifactPrefix: "litellm-image",
    tooling,
    suppressions,
    matchedSuppressionIds,
  });
  const packageFindings = liteLlmPackageFloorFindings(scan, tooling);
  return { ...scan, findings: [...scan.findings, ...packageFindings] };
}

async function pullAndScanPostgres(
  tooling: z.infer<typeof toolingSchema>,
  suppressions: readonly SupplyChainSuppression[],
  matchedSuppressionIds: Set<string>,
): Promise<RuntimeImageScan> {
  const pull = await command("docker", ["pull", tooling.postgres.image]);
  if (pull.exitCode !== 0) throw new Error("Pinned PostgreSQL runtime image pull failed.");
  const imageId = await inspectImageId(tooling.postgres.image);
  return scanRuntimeImage({
    role: "postgresql",
    displayName: "PostgreSQL database",
    reference: tooling.postgres.image,
    imageId,
    artifactPrefix: "postgres-image",
    tooling,
    suppressions,
    matchedSuppressionIds,
  });
}

async function scannerMetadata(
  tooling: z.infer<typeof toolingSchema>,
  runtimeImages: readonly RuntimeImageScan[],
): Promise<Record<string, unknown>> {
  const [docker, eslint, cyclone, gitleaks, trivy, cosign] = await Promise.all([
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
    dockerRun(tooling.cosign.image, ["version"]),
  ]);
  if ([docker, eslint, cyclone, gitleaks, trivy, cosign].some((result) => result.exitCode !== 0)) {
    throw new Error("Scanner version collection failed.");
  }
  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    scanners: {
      gitleaks: { version: gitleaks.stdout.trim(), image: tooling.gitleaks.image },
      eslint: { version: eslint.stdout.trim() },
      trivy: { version: trivy.stdout.trim(), image: tooling.trivy.image },
      cosign: { version: cosign.stdout.trim(), image: tooling.cosign.image },
      cycloneDxNpm: { version: cyclone.stdout.trim() },
      codeql: { version: tooling.codeql.version, actionSha: tooling.codeql.actionSha },
      npmAudit: { version: process.env.npm_config_user_agent?.split(" ")[0] ?? "npm" },
      containerPolicy: { version: "1.0.0", dockerCompose: docker.stdout.trim() },
    },
    targets: {
      sandboxBaseImage: tooling.sandbox.baseImage,
      liteLlmUpstreamImage: tooling.liteLlm.upstreamImage,
      runtimeImages: runtimeImages.map((image) => ({
        role: image.role,
        reference: image.reference,
        scannedDigest: image.imageId,
      })),
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
  const suppressionSelectors = new Set<string>();
  const matchedSuppressionIds = new Set<string>();
  const today = new Date().toISOString().slice(0, 10);
  let expired = 0;
  for (const entry of suppressionDocument.entries) {
    if (suppressionIds.has(entry.id)) throw new Error(`Duplicate suppression ID: ${entry.id}`);
    suppressionIds.add(entry.id);
    const selector = `${entry.scanner}\0${entry.ruleId}\0${normalizePath(entry.path)}`;
    if (suppressionSelectors.has(selector)) {
      throw new Error(`Duplicate suppression selector: ${entry.scanner}/${entry.ruleId}`);
    }
    suppressionSelectors.add(selector);
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
      matchedSuppressionIds,
    );
    const worktreeSecrets = await runGitleaks(
      tooling.gitleaks.image,
      "dir",
      "/scan",
      "gitleaks-worktree.sarif",
      scanInput,
      suppressionDocument.entries,
      matchedSuppressionIds,
    );
    const eslintFindings = await runEslint(suppressionDocument.entries, matchedSuppressionIds);
    const containerPolicyFindings = await runContainerPolicy(
      paths,
      tooling,
      suppressionDocument.entries,
      matchedSuppressionIds,
    );
    const npmAudit = await runNpmAudit(suppressionDocument.entries, matchedSuppressionIds);
    const licenses = await generateNpmSboms();
    const sandbox = await buildAndScanSandbox(
      tooling,
      suppressionDocument.entries,
      matchedSuppressionIds,
    );
    const liteLlm = await buildAndScanLiteLlm(
      tooling,
      suppressionDocument.entries,
      matchedSuppressionIds,
    );
    const postgres = await pullAndScanPostgres(
      tooling,
      suppressionDocument.entries,
      matchedSuppressionIds,
    );
    const runtimeImageScans = [sandbox, liteLlm, postgres] as const;

    const blocking = [
      ...historySecrets,
      ...worktreeSecrets,
      ...eslintFindings,
      ...containerPolicyFindings,
      ...npmAudit.findings,
      ...licenses.licenseFindings,
      ...runtimeImageScans.flatMap((image) => image.findings),
    ];
    const unusedSuppressions = suppressionDocument.entries.filter(
      (entry) => !matchedSuppressionIds.has(entry.id),
    );
    await writeJson(resolve(reportsRoot, "suppression-report.json"), {
      schemaVersion: 1,
      active: suppressionDocument.entries,
      applied: [...matchedSuppressionIds].sort(),
      unused: unusedSuppressions.map((entry) => entry.id),
      expired,
      unsuppressedFindingCount: blocking.length,
    });
    const metadata = await scannerMetadata(tooling, runtimeImageScans);
    await writeJson(resolve(reportsRoot, "scanner-metadata.json"), metadata);

    if (unusedSuppressions.length > 0) {
      throw new Error(
        `Supply-chain policy rejected ${unusedSuppressions.length} unused suppression(s).`,
      );
    }
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
    const releaseTag = process.env.RELEASE_TAG?.trim();
    const auditedReleaseCommit = process.env.AUDITED_RELEASE_COMMIT_SHA?.trim();
    const codeqlRunUrl = process.env.CODEQL_RUN_URL?.trim();
    const codeqlRunCommit = process.env.CODEQL_RUN_COMMIT_SHA?.trim();
    const codeqlFindingCount = process.env.CODEQL_FINDING_COUNT?.trim();
    if (recordSummary) {
      if (statusResult.stdout.trim().length > 0) {
        throw new Error(
          "Public release evidence can be recorded only from a clean audited commit.",
        );
      }
      if (!releaseTag?.match(/^v[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/u)) {
        throw new Error("RELEASE_TAG must identify the new public release tag.");
      }
      if (!auditedReleaseCommit?.match(/^[a-f0-9]{40}$/u)) {
        throw new Error("AUDITED_RELEASE_COMMIT_SHA must be a full commit SHA.");
      }
      if (auditedReleaseCommit !== baseCommit) {
        throw new Error("AUDITED_RELEASE_COMMIT_SHA must equal the clean checked-out commit.");
      }
      if (!codeqlRunCommit?.match(/^[a-f0-9]{40}$/u) || codeqlRunCommit !== baseCommit) {
        throw new Error("CODEQL_RUN_COMMIT_SHA must equal the audited release commit.");
      }
      if (
        !codeqlRunUrl?.match(
          /^https:\/\/github\.com\/sorren1\/AIWorkbench\/actions\/runs\/[0-9]+$/u,
        )
      ) {
        throw new Error("CODEQL_RUN_URL must be an immutable hosted workflow-run URL.");
      }
      if (codeqlFindingCount !== "0") {
        throw new Error("CODEQL_FINDING_COUNT must be exactly zero before evidence is recorded.");
      }
    }
    const generatedAt = new Date().toISOString();
    const runtimeImages = [
      {
        role: "sandbox",
        displayName: sandbox.displayName,
        reference: sandbox.reference,
        scannedDigest: sandbox.imageId,
        sbomArtifact: sandbox.sbomArtifact,
        provenance: {
          status: "DIGEST_PINNED_BUILD",
          detail: `Built locally from ${tooling.sandbox.baseImage}.`,
        },
      },
      {
        role: "litellm",
        displayName: liteLlm.displayName,
        reference: liteLlm.reference,
        scannedDigest: liteLlm.imageId,
        sbomArtifact: liteLlm.sbomArtifact,
        provenance: {
          status: "VERIFIED_UPSTREAM_SIGNATURE",
          detail: `Derived from Cosign-verified ${tooling.liteLlm.upstreamImage}; the local patch is hash-locked and the exact result is scanned.`,
        },
      },
      {
        role: "postgresql",
        displayName: postgres.displayName,
        reference: postgres.reference,
        scannedDigest: postgres.imageId,
        sbomArtifact: postgres.sbomArtifact,
        provenance: {
          status: "DIGEST_PINNED",
          detail:
            "Pulled from the Docker Official Image digest; no vendor Cosign key is published for this image.",
        },
      },
    ] satisfies RuntimeImageSummary[];
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
        target:
          "TypeScript/JavaScript sources, Compose configuration, and both runtime Dockerfiles",
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
        label: "Runtime container vulnerability scans",
        status: "PASSED",
        scanner: "Trivy",
        version: tooling.trivy.version,
        target: runtimeImages.map((image) => image.scannedDigest).join(", "),
        findingCount: 0,
        detail:
          "The exact sandbox, LiteLLM, and PostgreSQL runtime image IDs were scanned; all unsuppressed high and critical findings are release-blocking.",
      }),
      control({
        id: "image-provenance",
        label: "Runtime image signature and provenance policy",
        status: "PASSED",
        scanner: "Cosign + digest/build policy",
        version: `${tooling.cosign.version} / 1.0.0`,
        target: tooling.liteLlm.upstreamImage,
        findingCount: 0,
        detail:
          "LiteLLM's pinned upstream digest was verified with its commit-pinned public key; local builds and the PostgreSQL pull remain content-addressed.",
      }),
      control({
        id: "sbom",
        label: "CycloneDX software bills of materials",
        status: "PASSED",
        scanner: "CycloneDX npm + Trivy",
        version: `${tooling.cycloneDxNpm.version} / ${tooling.trivy.version}`,
        target: "Locked npm graphs and all three runtime images",
        findingCount: 0,
        detail:
          "Validated CycloneDX JSON artifacts were generated for the two npm graphs and each exact runtime image.",
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
        status: recordSummary ? "PASSED" : "CONFIGURED_NOT_RUN",
        scanner: "GitHub CodeQL",
        version: `${tooling.codeql.version} @ ${tooling.codeql.actionSha.slice(0, 12)}`,
        target: "JavaScript/TypeScript",
        findingCount: recordSummary ? 0 : null,
        detail: recordSummary
          ? "The hosted workflow analyzed the audited release commit and its retained SARIF contained zero release-blocking results."
          : "The hosted workflow is configured, but no successful GitHub run was supplied to this local validation.",
        ...(recordSummary && codeqlRunUrl && codeqlRunCommit
          ? { evidenceUrl: codeqlRunUrl, sourceCommit: codeqlRunCommit }
          : {}),
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
      { kind: "SARIF", name: "litellm-image.sarif" },
      { kind: "SARIF", name: "postgres-image.sarif" },
      { kind: "SBOM", name: "npm-production.cdx.json" },
      { kind: "SBOM", name: "npm-all.cdx.json" },
      { kind: "SBOM", name: "sandbox-image.cdx.json" },
      { kind: "SBOM", name: "litellm-image.cdx.json" },
      { kind: "SBOM", name: "postgres-image.cdx.json" },
      { kind: "PROVENANCE", name: "litellm-signature.json" },
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
      schemaVersion: 3,
      generatedAt,
      source: {
        baseCommit,
        revisionKind: statusResult.stdout.trim().length === 0 ? "COMMIT" : "WORKTREE",
        treeDigest: sourceTreeDigest,
      },
      release:
        recordSummary && releaseTag && auditedReleaseCommit
          ? { tag: releaseTag, auditedCommit: auditedReleaseCommit }
          : null,
      evidence:
        recordSummary && auditedReleaseCommit
          ? {
              parentCommit: auditedReleaseCommit,
              commitPolicy: "DIRECT_CHILD_SUMMARY_ONLY",
              allowedPaths: ["public/security/release-summary.json"],
            }
          : null,
      deployment: {
        provider: "VERCEL",
        commitEnvironment: "VERCEL_GIT_COMMIT_SHA",
        approvedCommitEnvironment: "APPROVED_DEPLOYMENT_COMMIT_SHA",
        relation: "TAGGED_EVIDENCE_CHILD_OF_AUDITED_COMMIT",
      },
      controls,
      artifacts,
      suppressions: { active: suppressionDocument.entries.length, expired },
      runtimeImages,
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
      "| Runtime image | Reference | Scanned digest | Provenance |",
      "| --- | --- | --- | --- |",
      ...runtimeImages.map(
        (image) =>
          `| ${image.displayName} | ${image.reference} | ${image.scannedDigest} | ${image.provenance.status} |`,
      ),
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
      `Supply-chain evidence passed: ${controls.filter((item) => item.status === "PASSED").length} controls passed, ${summary.suppressions.active} suppressions, ${runtimeImages.length} runtime images scanned.\n`,
    );
  } finally {
    await rm(scanInput, { force: true, recursive: true });
  }
}

await main();
