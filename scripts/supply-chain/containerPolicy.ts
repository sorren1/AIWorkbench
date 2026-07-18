import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

import type { SarifFinding, SupplyChainTooling } from "./contracts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finding(ruleId: string, message: string, path: string): SarifFinding {
  return { ruleId, level: "error", message, path };
}

type ComposePolicy = {
  readonly expectedImages: Readonly<Record<string, string>>;
  readonly locallyBuiltServices: readonly string[];
  readonly credentialServices?: Readonly<
    Record<
      string,
      {
        readonly user: string;
        readonly secretTargets: readonly string[];
        readonly writableVolumeTargets: readonly string[];
        readonly tmpfsTargets: readonly string[];
      }
    >
  >;
};

const credentialName =
  /(?:PASSWORD|PASSWD|SECRET|TOKEN|API_KEY|MASTER_KEY|SALT_KEY|DATABASE_URL|DATABASE_URI|CREDENTIAL)/iu;

function environmentEntries(value: unknown): [string, unknown][] {
  if (isRecord(value)) return Object.entries(value);
  if (!Array.isArray(value)) return [];
  return value.flatMap((entry): [string, unknown][] => {
    if (typeof entry !== "string") return [];
    const separator = entry.indexOf("=");
    return separator === -1
      ? [[entry, null]]
      : [[entry.slice(0, separator), entry.slice(separator + 1)]];
  });
}

function secretTarget(entry: unknown): string | null {
  if (typeof entry === "string") return entry;
  if (!isRecord(entry)) return null;
  if (typeof entry.target === "string") return entry.target;
  return typeof entry.source === "string" ? entry.source : null;
}

function serviceSecretTargets(value: JsonRecord): string[] {
  return Array.isArray(value.secrets)
    ? value.secrets.map(secretTarget).filter((target): target is string => target !== null)
    : [];
}

function serviceUsesCredentials(value: JsonRecord): boolean {
  if (serviceSecretTargets(value).length > 0) return true;
  if (environmentEntries(value.environment).some(([name]) => credentialName.test(name))) {
    return true;
  }
  return credentialName.test(JSON.stringify([value.command, value.entrypoint]));
}

function tmpfsTarget(entry: unknown): string | null {
  if (typeof entry === "string") return entry.split(":", 1)[0] ?? null;
  if (!isRecord(entry)) return null;
  return typeof entry.target === "string" ? entry.target : null;
}

function volumeMount(
  entry: unknown,
): { readonly target: string; readonly readOnly: boolean } | null {
  if (typeof entry === "string") {
    const parts = entry.split(":");
    const target = parts[1];
    if (!target) return null;
    return { target, readOnly: parts.slice(2).includes("ro") };
  }
  if (!isRecord(entry) || typeof entry.target !== "string") return null;
  return { target: entry.target, readOnly: entry.read_only === true };
}

function setDifference(actual: ReadonlySet<string>, expected: ReadonlySet<string>): string[] {
  return [...actual].filter((entry) => !expected.has(entry)).sort();
}

function credentialServiceFindings(
  serviceName: string,
  value: JsonRecord,
  policy?: ComposePolicy,
): SarifFinding[] {
  if (!serviceUsesCredentials(value)) return [];
  const path = "ops/model-gateway/compose.yaml";
  const results: SarifFinding[] = [];
  const reviewed = policy?.credentialServices?.[serviceName];
  if (!reviewed) {
    results.push(
      finding(
        "CONTAINER-CREDENTIAL-SERVICE-UNREVIEWED",
        `${serviceName} carries credentials but has no reviewed secret and writable-path policy.`,
        path,
      ),
    );
  }

  if (
    typeof value.user !== "string" ||
    !/^[1-9][0-9]*:[1-9][0-9]*$/u.test(value.user) ||
    (reviewed !== undefined && value.user !== reviewed.user)
  ) {
    results.push(
      finding(
        "CONTAINER-EXPLICIT-NONROOT-USER",
        `${serviceName} must use its reviewed numeric non-root UID:GID.`,
        path,
      ),
    );
  }
  if (
    !Array.isArray(value.cap_drop) ||
    !value.cap_drop.some((capability) => String(capability).toUpperCase() === "ALL")
  ) {
    results.push(
      finding(
        "CONTAINER-DROP-ALL-CAPABILITIES",
        `${serviceName} must drop all Linux capabilities.`,
        path,
      ),
    );
  }
  const securityOptions = Array.isArray(value.security_opt) ? value.security_opt.map(String) : [];
  if (!securityOptions.some((option) => /^no-new-privileges(?:=|:)true$/iu.test(option))) {
    results.push(
      finding("CONTAINER-NO-NEW-PRIVILEGES", `${serviceName} must enable no-new-privileges.`, path),
    );
  }
  if (value.read_only !== true) {
    results.push(
      finding(
        "CONTAINER-READONLY-ROOT",
        `${serviceName} must use a read-only root filesystem.`,
        path,
      ),
    );
  }

  const declaredSecrets = new Set(serviceSecretTargets(value));
  if (declaredSecrets.size === 0) {
    results.push(
      finding(
        "CONTAINER-SECRET-FILES-REQUIRED",
        `${serviceName} credentials must be delivered through mounted secret files.`,
        path,
      ),
    );
  }
  for (const [name, rawValue] of environmentEntries(value.environment)) {
    if (!credentialName.test(name)) continue;
    if (!name.endsWith("_FILE")) {
      results.push(
        finding(
          "CONTAINER-NO-PLAINTEXT-CREDENTIAL-ENV",
          `${serviceName} must not receive ${name} directly through Compose environment.`,
          path,
        ),
      );
      continue;
    }
    const valueText = typeof rawValue === "string" ? rawValue : "";
    const target = valueText.startsWith("/run/secrets/")
      ? valueText.slice("/run/secrets/".length)
      : "";
    if (!target || !declaredSecrets.has(target)) {
      results.push(
        finding(
          "CONTAINER-SECRET-FILE-BINDING",
          `${serviceName} ${name} must reference one of its /run/secrets mounts.`,
          path,
        ),
      );
    }
  }

  const writableVolumes = new Set(
    (Array.isArray(value.volumes) ? value.volumes : [])
      .map(volumeMount)
      .filter((mount): mount is { readonly target: string; readonly readOnly: boolean } =>
        Boolean(mount),
      )
      .filter((mount) => !mount.readOnly)
      .map((mount) => mount.target),
  );
  const tmpfsTargets = new Set(
    (Array.isArray(value.tmpfs) ? value.tmpfs : [])
      .map(tmpfsTarget)
      .filter((target): target is string => target !== null),
  );
  const expectedWritableVolumes = new Set(reviewed?.writableVolumeTargets ?? []);
  const expectedTmpfs = new Set(reviewed?.tmpfsTargets ?? []);
  const unexpectedWrites = [
    ...setDifference(writableVolumes, expectedWritableVolumes),
    ...setDifference(tmpfsTargets, expectedTmpfs),
  ];
  const missingWrites = [
    ...setDifference(expectedWritableVolumes, writableVolumes),
    ...setDifference(expectedTmpfs, tmpfsTargets),
  ];
  if (unexpectedWrites.length > 0) {
    results.push(
      finding(
        "CONTAINER-UNREVIEWED-WRITABLE-PATH",
        `${serviceName} exposes unreviewed writable paths: ${unexpectedWrites.join(", ")}.`,
        path,
      ),
    );
  }
  if (missingWrites.length > 0) {
    results.push(
      finding(
        "CONTAINER-REQUIRED-WRITABLE-PATH",
        `${serviceName} is missing reviewed writable paths: ${missingWrites.join(", ")}.`,
        path,
      ),
    );
  }
  if (reviewed) {
    const expectedSecrets = new Set(reviewed.secretTargets);
    const missingSecrets = setDifference(expectedSecrets, declaredSecrets);
    const unexpectedSecrets = setDifference(declaredSecrets, expectedSecrets);
    if (missingSecrets.length > 0 || unexpectedSecrets.length > 0) {
      results.push(
        finding(
          "CONTAINER-SECRET-ALLOWLIST",
          `${serviceName} secret mounts must exactly match its reviewed allow-list.`,
          path,
        ),
      );
    }
  }
  return results;
}

function composeServiceFindings(
  serviceName: string,
  value: unknown,
  policy?: ComposePolicy,
): SarifFinding[] {
  const path = "ops/model-gateway/compose.yaml";
  if (!isRecord(value)) {
    return [
      finding("CONTAINER-COMPOSE-SERVICE", `${serviceName} must normalize to an object.`, path),
    ];
  }
  const results: SarifFinding[] = [];
  const expectedImage = policy?.expectedImages[serviceName];
  const localBuild =
    policy?.locallyBuiltServices.includes(serviceName) === true && isRecord(value.build);
  if (typeof value.image !== "string" || (!value.image.includes("@sha256:") && !localBuild)) {
    results.push(
      finding("CONTAINER-IMAGE-DIGEST", `${serviceName} image must be digest-pinned.`, path),
    );
  }
  if (expectedImage !== undefined && value.image !== expectedImage) {
    results.push(
      finding(
        "CONTAINER-EXPECTED-IMAGE",
        `${serviceName} image must match the supply-chain policy.`,
        path,
      ),
    );
  }
  if (value.privileged === true) {
    results.push(
      finding("CONTAINER-NO-PRIVILEGED", `${serviceName} must not be privileged.`, path),
    );
  }
  if (Array.isArray(value.cap_add) && value.cap_add.length > 0) {
    results.push(
      finding("CONTAINER-NO-CAP-ADD", `${serviceName} must not add Linux capabilities.`, path),
    );
  }
  if (value.restart !== undefined && value.restart !== "no") {
    results.push(
      finding("CONTAINER-BOUNDED-RESTART", `${serviceName} restart policy must remain no.`, path),
    );
  }
  if (JSON.stringify(value.volumes ?? []).includes("/var/run/docker.sock")) {
    results.push(
      finding(
        "CONTAINER-NO-DOCKER-SOCKET",
        `${serviceName} must not mount the Docker socket.`,
        path,
      ),
    );
  }
  results.push(...credentialServiceFindings(serviceName, value, policy));
  if (Array.isArray(value.ports)) {
    for (const port of value.ports) {
      if (!isRecord(port) || port.host_ip !== "127.0.0.1") {
        results.push(
          finding(
            "CONTAINER-LOOPBACK-PORT",
            `${serviceName} published ports must bind to 127.0.0.1.`,
            path,
          ),
        );
      }
    }
  }
  return results;
}

export function analyzeComposeConfig(value: unknown, policy?: ComposePolicy): SarifFinding[] {
  if (!isRecord(value) || !isRecord(value.services)) {
    return [
      finding(
        "CONTAINER-COMPOSE-SCHEMA",
        "Docker Compose output must contain a services object.",
        "ops/model-gateway/compose.yaml",
      ),
    ];
  }
  const findings = Object.entries(value.services).flatMap(([name, service]) =>
    composeServiceFindings(name, service, policy),
  );
  if (policy) {
    const actualServices = new Set(Object.keys(value.services));
    for (const service of Object.keys(policy.expectedImages)) {
      if (!actualServices.has(service)) {
        findings.push(
          finding(
            "CONTAINER-EXPECTED-SERVICE",
            `Compose must define the ${service} runtime service.`,
            "ops/model-gateway/compose.yaml",
          ),
        );
      }
    }
    for (const service of actualServices) {
      if (!(service in policy.expectedImages)) {
        findings.push(
          finding(
            "CONTAINER-UNSCANNED-SERVICE",
            `${service} is not assigned to the runtime-image scan gate.`,
            "ops/model-gateway/compose.yaml",
          ),
        );
      }
    }
  }
  const database = value.services.database;
  if (isRecord(database) && Array.isArray(database.ports) && database.ports.length > 0) {
    findings.push(
      finding(
        "CONTAINER-DATABASE-NOT-PUBLISHED",
        "The local gateway database must not publish a host port.",
        "ops/model-gateway/compose.yaml",
      ),
    );
  }
  return findings;
}

export async function analyzeLiteLlmDockerfile(
  root: string,
  tooling: SupplyChainTooling,
): Promise<SarifFinding[]> {
  const path = tooling.liteLlm.dockerfile;
  const contents = await readFile(`${root}/${path}`, "utf8");
  const requirements = await readFile(`${root}/${tooling.liteLlm.requirements}`);
  const findings: SarifFinding[] = [];
  if (!contents.includes(`FROM ${tooling.liteLlm.upstreamImage}`)) {
    findings.push(
      finding("CONTAINER-BASE-DIGEST", "LiteLLM base image must match tooling policy.", path),
    );
  }
  const userDirectives = [...contents.matchAll(/^USER\s+(\S+)/gim)];
  if (userDirectives.at(-1)?.[1] !== "65534:65534") {
    findings.push(
      finding(
        "CONTAINER-NONROOT-USER",
        "The patched LiteLLM image must restore numeric non-root UID:GID 65534:65534.",
        path,
      ),
    );
  }
  if (
    !contents.includes("PRISMA_OFFLINE_MODE=true") ||
    !contents.includes(
      "PRISMA_BINARY_CACHE_DIR=/app/.cache/prisma-python/binaries/5.4.2/ac9d7041ed77bcc8a8dbd2ab6616b39013829574",
    ) ||
    !contents.includes("RUN prisma generate --schema=/app/schema.prisma")
  ) {
    findings.push(
      finding(
        "CONTAINER-DATABASE-COMPATIBLE-RUNTIME",
        "The LiteLLM derivative must retain the database image's Prisma runtime and generate its client before the read-only runtime starts.",
        path,
      ),
    );
  }
  if (!contents.includes("--require-hashes") || !contents.includes("--no-deps")) {
    findings.push(
      finding(
        "CONTAINER-HASHED-PATCH",
        "The LiteLLM package patch must use a hash-locked, dependency-neutral install.",
        path,
      ),
    );
  }
  const requirementsSha256 = createHash("sha256").update(requirements).digest("hex");
  if (requirementsSha256 !== tooling.liteLlm.requirementsSha256) {
    findings.push(
      finding(
        "CONTAINER-HASHED-PATCH",
        "LiteLLM security requirements must match the reviewed content digest.",
        tooling.liteLlm.requirements,
      ),
    );
  }
  return findings;
}

export async function analyzeLiteLlmConfig(root: string): Promise<SarifFinding[]> {
  const path = "ops/model-gateway/litellm-config.yaml";
  const contents = await readFile(`${root}/${path}`, "utf8");
  const requiredSettings: readonly [string, RegExp, string][] = [
    [
      "CONTAINER-SPEND-LOGS-ENABLED",
      /^\s*disable_spend_logs:\s*false\s*$/mu,
      "Spend accounting logs must remain explicitly enabled for budget enforcement evidence.",
    ],
    [
      "CONTAINER-SPEND-LOG-PROMPT-CONTENT",
      /^\s*store_prompts_in_spend_logs:\s*false\s*$/mu,
      "Spend logs must explicitly exclude prompt and response content.",
    ],
    [
      "CONTAINER-SPEND-LOG-RETENTION",
      /^\s*maximum_spend_logs_retention_period:\s*["']7d["']\s*$/mu,
      "Spend-log retention must remain explicitly bounded to seven days.",
    ],
    [
      "CONTAINER-SPEND-LOG-RETENTION",
      /^\s*maximum_spend_logs_retention_interval:\s*["']1d["']\s*$/mu,
      "Spend-log cleanup must run at least daily.",
    ],
  ];
  return requiredSettings.flatMap(([ruleId, pattern, message]) =>
    pattern.test(contents) ? [] : [finding(ruleId, message, path)],
  );
}

export async function analyzeSandboxDockerfile(
  root: string,
  tooling: SupplyChainTooling,
): Promise<SarifFinding[]> {
  const path = tooling.sandbox.dockerfile;
  const contents = await readFile(`${root}/${path}`, "utf8");
  const findings: SarifFinding[] = [];
  if (!contents.includes(`FROM ${tooling.sandbox.baseImage}`)) {
    findings.push(
      finding("CONTAINER-BASE-DIGEST", "Sandbox base image must match tooling policy.", path),
    );
  }
  if (!/USER\s+65532:65532/.test(contents)) {
    findings.push(
      finding("CONTAINER-NONROOT-USER", "Sandbox image must declare numeric non-root USER.", path),
    );
  }
  if (!contents.includes("rm -rf /usr/local/lib/node_modules/npm")) {
    findings.push(
      finding(
        "CONTAINER-MINIMAL-RUNTIME",
        "Sandbox image must remove the unused npm dependency tree.",
        path,
      ),
    );
  }
  return findings;
}

export function analyzeLanguageCoverage(paths: readonly string[]): SarifFinding[] {
  const unsupported = paths.filter((path) => /(?:\.py|\.pyw|\.sh|\.bash|\.zsh|\.ps1)$/i.test(path));
  const dockerfiles = paths.filter(
    (path) =>
      /(?:^|\/)Dockerfile(?:\.[^/]+)?$/i.test(path) &&
      !["ops/sandbox/Dockerfile", "ops/model-gateway/Dockerfile.litellm"].includes(path),
  );
  return [...unsupported, ...dockerfiles]
    .sort()
    .map((path) =>
      finding(
        "SAST-UNSCANNED-LANGUAGE",
        "A new Python, shell, PowerShell, or Dockerfile source requires an explicit scanner before release.",
        path,
      ),
    );
}
