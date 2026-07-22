import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import {
  licensePolicySchema,
  suppressionSchema,
  toolingSchema,
} from "../scripts/supply-chain/contracts";
import {
  analyzeComposeConfig,
  analyzeLanguageCoverage,
  analyzeLiteLlmConfig,
  analyzeLiteLlmDockerfile,
  analyzeSandboxDockerfile,
} from "../scripts/supply-chain/containerPolicy";
import { validateSuppressionPolicy } from "../scripts/supply-chain/suppressionPolicy";
import { versionAtLeast } from "../scripts/supply-chain/versionPolicy";
import {
  lintableTrackedSourcePaths,
  trackedSourceDigest,
  trackedSourcePaths,
} from "../scripts/trackedSourceInventory";
import { readSupplyChainSummary, renderSupplyChainEvidence } from "../src/site/supplyChainEvidence";

const root = resolve(import.meta.dirname, "..");

async function json(path: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve(root, path), "utf8")) as unknown;
}

describe("supply-chain policy", () => {
  it("uses a deterministic tracked-source inventory instead of generated workspace artifacts", async () => {
    const paths = await trackedSourcePaths(root);
    const lintPaths = lintableTrackedSourcePaths(paths);
    expect(paths).toContain("package.json");
    expect(paths).toContain("scripts/trackedSourceInventory.ts");
    expect(paths.every((path) => !path.includes("\\"))).toBe(true);
    expect(
      paths.every(
        (path) =>
          !["coverage/", "dist/", ".lighthouseci/", "playwright-report/", "test-results/"].some(
            (generatedRoot) => path.startsWith(generatedRoot),
          ),
      ),
    ).toBe(true);
    expect(lintPaths.length).toBeGreaterThan(0);
    expect(lintPaths.every((path) => /\.(?:[cm]?[jt]s|[jt]sx)$/u.test(path))).toBe(true);
    await expect(trackedSourceDigest(root, paths)).resolves.toMatch(/^[a-f0-9]{64}$/u);
  });

  it("keeps scanner, suppression, and license policy documents versioned and valid", async () => {
    const tooling = toolingSchema.parse(await json("security/tooling.json"));
    const suppressions = suppressionSchema.parse(await json("security/suppressions.json"));
    const licenses = licensePolicySchema.parse(await json("security/license-policy.json"));

    expect(tooling.gitleaks.image).toMatch(/@sha256:[a-f0-9]{64}$/);
    expect(tooling.trivy.image).toMatch(/@sha256:[a-f0-9]{64}$/);
    expect(tooling.cosign.image).toMatch(/@sha256:[a-f0-9]{64}$/);
    expect(tooling.codeql.actionSha).toMatch(/^[a-f0-9]{40}$/);
    expect(suppressions.entries).toHaveLength(15);
    expect(new Set(suppressions.entries.map((entry) => entry.id)).size).toBe(15);
    expect(
      suppressions.entries.every(
        (entry) =>
          entry.path.includes(tooling.postgres.image) &&
          entry.path.endsWith("/usr/local/bin/gosu") &&
          entry.reviewOn <= entry.expiresOn,
      ),
    ).toBe(true);
    const publicKey = await readFile(resolve(root, tooling.liteLlm.cosignPublicKey));
    expect(createHash("sha256").update(publicKey).digest("hex")).toBe(
      tooling.liteLlm.cosignPublicKeySha256,
    );
    expect(licenses.requireDeclaredLicense).toBe(true);
  });

  it("rejects wildcard and reversed-date suppressions", () => {
    const entry = {
      id: "SUP-2026-999",
      scanner: "trivy",
      ruleId: "CVE-2026-99999",
      path: `image:example.invalid/database@sha256:${"a".repeat(64)}/usr/local/bin/helper`,
      reason: "The exact finding is temporarily unreachable under the reviewed runtime profile.",
      reviewer: "repository owner",
      reviewOn: "2026-07-21",
      expiresOn: "2026-08-15",
    } as const;

    expect(() =>
      suppressionSchema.parse({
        schemaVersion: 1,
        entries: [{ ...entry, ruleId: "CVE-*" }],
      }),
    ).toThrow(/wildcards/u);
    expect(() =>
      suppressionSchema.parse({
        schemaVersion: 1,
        entries: [{ ...entry, path: "image:*" }],
      }),
    ).toThrow(/wildcards/u);
    expect(() =>
      suppressionSchema.parse({
        schemaVersion: 1,
        entries: [{ ...entry, reviewOn: "2026-08-16" }],
      }),
    ).toThrow(/reviewOn/u);
  });

  it("rejects expired and duplicate suppressions before scanner execution", () => {
    const entry = suppressionSchema.parse({
      schemaVersion: 1,
      entries: [
        {
          id: "SUP-2026-999",
          scanner: "trivy",
          ruleId: "CVE-2026-99999",
          path: `image:example.invalid/database@sha256:${"a".repeat(64)}/usr/local/bin/helper`,
          reason:
            "The exact finding is temporarily unreachable under the reviewed runtime profile.",
          reviewer: "repository owner",
          reviewOn: "2026-07-01",
          expiresOn: "2026-07-20",
        },
      ],
    }).entries[0];
    expect(entry).toBeDefined();
    if (!entry) return;

    expect(() => validateSuppressionPolicy([entry], "2026-07-21")).toThrow(/Expired/u);
    expect(() =>
      validateSuppressionPolicy([entry, { ...entry, expiresOn: "2026-08-01" }], "2026-07-01"),
    ).toThrow(/Duplicate suppression ID/u);
    expect(() =>
      validateSuppressionPolicy(
        [entry, { ...entry, id: "SUP-2026-998", expiresOn: "2026-08-01" }],
        "2026-07-01",
      ),
    ).toThrow(/Duplicate suppression selector/u);
  });

  it("accepts the constrained Compose profile and rejects unsafe container configuration", async () => {
    const tooling = toolingSchema.parse(await json("security/tooling.json"));
    const safe = analyzeComposeConfig({
      services: {
        gateway: {
          image: `example.invalid/gateway@sha256:${"a".repeat(64)}`,
          restart: "no",
          privileged: false,
          ports: [{ host_ip: "127.0.0.1", published: "4000", target: 4000 }],
        },
        database: {
          image: `example.invalid/database@sha256:${"b".repeat(64)}`,
          restart: "no",
        },
      },
    });
    expect(safe).toEqual([]);
    expect(
      analyzeComposeConfig(
        {
          services: {
            gateway: { image: tooling.liteLlm.image, build: { dockerfile: "Dockerfile.litellm" } },
            database: { image: tooling.postgres.image },
          },
        },
        {
          expectedImages: { gateway: tooling.liteLlm.image, database: tooling.postgres.image },
          locallyBuiltServices: ["gateway"],
        },
      ),
    ).toEqual([]);

    const unsafe = analyzeComposeConfig({
      services: {
        gateway: {
          image: "gateway:latest",
          privileged: true,
          restart: "always",
          ports: [{ host_ip: "0.0.0.0", published: "4000", target: 4000 }],
          volumes: ["/var/run/docker.sock:/var/run/docker.sock"],
        },
      },
    });
    expect(new Set(unsafe.map((finding) => finding.ruleId))).toEqual(
      new Set([
        "CONTAINER-IMAGE-DIGEST",
        "CONTAINER-NO-PRIVILEGED",
        "CONTAINER-BOUNDED-RESTART",
        "CONTAINER-LOOPBACK-PORT",
        "CONTAINER-NO-DOCKER-SOCKET",
      ]),
    );
  });

  it("fails closed for every credential-bearing service without the full runtime controls", () => {
    const findings = analyzeComposeConfig({
      services: {
        credentialWorker: {
          image: `example.invalid/worker@sha256:${"c".repeat(64)}`,
          environment: { API_KEY: "example-credential-placeholder" },
          volumes: ["worker-state:/unreviewed"],
        },
      },
    });
    expect(findings.map((finding) => finding.ruleId)).toEqual(
      expect.arrayContaining([
        "CONTAINER-CREDENTIAL-SERVICE-UNREVIEWED",
        "CONTAINER-EXPLICIT-NONROOT-USER",
        "CONTAINER-DROP-ALL-CAPABILITIES",
        "CONTAINER-NO-NEW-PRIVILEGES",
        "CONTAINER-READONLY-ROOT",
        "CONTAINER-SECRET-FILES-REQUIRED",
        "CONTAINER-NO-PLAINTEXT-CREDENTIAL-ENV",
        "CONTAINER-UNREVIEWED-WRITABLE-PATH",
      ]),
    );
  });

  it("accepts only the reviewed secret files and writable paths", () => {
    const hardened = analyzeComposeConfig(
      {
        services: {
          database: {
            image: `example.invalid/database@sha256:${"d".repeat(64)}`,
            user: "70:70",
            environment: {
              POSTGRES_PASSWORD_FILE: "/run/secrets/litellm_db_password",
            },
            secrets: [{ source: "litellm_db_password", target: "litellm_db_password" }],
            cap_drop: ["ALL"],
            security_opt: ["no-new-privileges:true"],
            read_only: true,
            tmpfs: ["/tmp:rw", "/var/run/postgresql:rw"],
            volumes: [
              {
                type: "volume",
                source: "gateway-database",
                target: "/var/lib/postgresql/data",
              },
            ],
          },
          gateway: {
            image: "example.invalid/gateway:local",
            build: { dockerfile: "Dockerfile.litellm" },
            user: "65534:65534",
            environment: {
              DATABASE_URL_FILE: "/run/secrets/litellm_database_url",
              LITELLM_MASTER_KEY_FILE: "/run/secrets/litellm_master_key",
              LITELLM_SALT_KEY_FILE: "/run/secrets/litellm_salt_key",
              MODEL_GATEWAY_UPSTREAM_API_KEY_FILE: "/run/secrets/model_gateway_upstream_api_key",
            },
            secrets: [
              { source: "litellm_database_url", target: "litellm_database_url" },
              { source: "litellm_master_key", target: "litellm_master_key" },
              { source: "litellm_salt_key", target: "litellm_salt_key" },
              {
                source: "model_gateway_upstream_api_key",
                target: "model_gateway_upstream_api_key",
              },
            ],
            cap_drop: ["ALL"],
            security_opt: ["no-new-privileges:true"],
            read_only: true,
            tmpfs: ["/tmp:rw"],
            volumes: [
              {
                type: "bind",
                source: "litellm-config.yaml",
                target: "/app/config.yaml",
                read_only: true,
              },
            ],
          },
        },
      },
      {
        expectedImages: {
          database: `example.invalid/database@sha256:${"d".repeat(64)}`,
          gateway: "example.invalid/gateway:local",
        },
        locallyBuiltServices: ["gateway"],
        credentialServices: {
          database: {
            user: "70:70",
            secretTargets: ["litellm_db_password"],
            writableVolumeTargets: ["/var/lib/postgresql/data"],
            tmpfsTargets: ["/tmp", "/var/run/postgresql"],
          },
          gateway: {
            user: "65534:65534",
            secretTargets: [
              "litellm_database_url",
              "litellm_master_key",
              "litellm_salt_key",
              "model_gateway_upstream_api_key",
            ],
            writableVolumeTargets: [],
            tmpfsTargets: ["/tmp"],
          },
        },
      },
    );
    expect(hardened).toEqual([]);
  });

  it("fails closed when a source language or Dockerfile lacks an assigned scanner", () => {
    expect(
      analyzeLanguageCoverage([
        "src/index.ts",
        "ops/sandbox/Dockerfile",
        "tools/task.py",
        "ops/other/Dockerfile",
      ]).map((finding) => finding.path),
    ).toEqual(["ops/other/Dockerfile", "tools/task.py"]);
  });

  it("validates the sandbox Dockerfile against its pinned image policy", async () => {
    const tooling = toolingSchema.parse(await json("security/tooling.json"));
    await expect(analyzeSandboxDockerfile(root, tooling)).resolves.toEqual([]);
    await expect(analyzeLiteLlmDockerfile(root, tooling)).resolves.toEqual([]);
    await expect(analyzeLiteLlmConfig(root)).resolves.toEqual([]);
  });

  it("enforces the LiteLLM security package version floors", () => {
    expect(versionAtLeast("3.13.14-r2", "3.13.14-r2")).toBe(true);
    expect(versionAtLeast("3.13.14-r1", "3.13.14-r2")).toBe(false);
    expect(versionAtLeast("4.11.0", "4.8.2")).toBe(true);
    expect(versionAtLeast("1.27.2", "1.28.1")).toBe(false);
  });
});

describe("public supply-chain evidence", () => {
  it("never renders a stale summary and presents only a generated evidence child", async () => {
    const summary = await readSupplyChainSummary(root);
    const html = await renderSupplyChainEvidence(root);

    if (!summary) {
      expect(html).toContain("No successful supply-chain validation summary is checked in");
      return;
    }

    expect(summary.artifacts.filter((artifact) => artifact.kind === "SBOM")).toHaveLength(5);
    expect(summary.runtimeImages.map((image) => image.role).sort()).toEqual([
      "litellm",
      "postgresql",
      "sandbox",
    ]);
    expect(
      summary.runtimeImages.every((image) =>
        summary.artifacts.some(
          (artifact) => artifact.kind === "SBOM" && artifact.name === image.sbomArtifact,
        ),
      ),
    ).toBe(true);
    expect(summary.controls.find((control) => control.id === "codeql")?.status).toBe("PASSED");
    expect(summary.evidence.parentCommit).toBe(summary.release.auditedCommit);
    expect(summary.source.baseCommit).toBe(summary.release.auditedCommit);
    expect(html).toContain("Executed");
    expect(html).toContain("Scanned digest");
    for (const image of summary.runtimeImages) expect(html).toContain(image.scannedDigest);
    expect(html).toContain("Audited commit");
    expect(html).not.toContain("Configured · not validated");
  });
});
