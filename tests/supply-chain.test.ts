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
  analyzeLiteLlmDockerfile,
  analyzeSandboxDockerfile,
} from "../scripts/supply-chain/containerPolicy";
import { versionAtLeast } from "../scripts/supply-chain/versionPolicy";
import {
  publicSupplyChainSummarySchema,
  renderSupplyChainEvidence,
} from "../src/site/supplyChainEvidence";

const root = resolve(import.meta.dirname, "..");

async function json(path: string): Promise<unknown> {
  return JSON.parse(await readFile(resolve(root, path), "utf8")) as unknown;
}

describe("supply-chain policy", () => {
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
  });

  it("enforces the LiteLLM security package version floors", () => {
    expect(versionAtLeast("3.13.14-r2", "3.13.14-r2")).toBe(true);
    expect(versionAtLeast("3.13.14-r1", "3.13.14-r2")).toBe(false);
    expect(versionAtLeast("4.11.0", "4.8.2")).toBe(true);
    expect(versionAtLeast("1.27.2", "1.28.1")).toBe(false);
  });
});

describe("public supply-chain evidence", () => {
  it("renders successful controls separately from configured but unvalidated controls", async () => {
    const summary = publicSupplyChainSummarySchema.parse(
      await json("public/security/release-summary.json"),
    );
    const html = await renderSupplyChainEvidence(root);

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
    expect(summary.controls.find((control) => control.id === "codeql")?.status).toBe(
      "CONFIGURED_NOT_RUN",
    );
    expect(html).toContain("Executed");
    expect(html).toContain("Scanned digest");
    for (const image of summary.runtimeImages) expect(html).toContain(image.scannedDigest);
    expect(html).toContain("Configured · not validated");
    expect(html).not.toContain('site-status--functional">Configured');
  });
});
