import { readFile } from "node:fs/promises";

import type { SarifFinding, SupplyChainTooling } from "./contracts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function finding(ruleId: string, message: string, path: string): SarifFinding {
  return { ruleId, level: "error", message, path };
}

function composeServiceFindings(serviceName: string, value: unknown): SarifFinding[] {
  const path = "ops/model-gateway/compose.yaml";
  if (!isRecord(value)) {
    return [
      finding("CONTAINER-COMPOSE-SERVICE", `${serviceName} must normalize to an object.`, path),
    ];
  }
  const results: SarifFinding[] = [];
  if (typeof value.image !== "string" || !value.image.includes("@sha256:")) {
    results.push(
      finding("CONTAINER-IMAGE-DIGEST", `${serviceName} image must be digest-pinned.`, path),
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

export function analyzeComposeConfig(value: unknown): SarifFinding[] {
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
    composeServiceFindings(name, service),
  );
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
    (path) => /(?:^|\/)Dockerfile(?:\.[^/]+)?$/i.test(path) && path !== "ops/sandbox/Dockerfile",
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
