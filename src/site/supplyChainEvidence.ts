import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { z } from "zod";

import type { ReleaseDeploymentIdentity, VerifiedDeploymentBinding } from "./deploymentBinding";

const controlSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["PASSED", "CONFIGURED_NOT_RUN", "NOT_APPLICABLE"]),
  scanner: z.string(),
  version: z.string(),
  target: z.string(),
  findingCount: z.number().nullable(),
  detail: z.string(),
  evidenceUrl: z.url().optional(),
  sourceCommit: z
    .string()
    .regex(/^[a-f0-9]{40}$/)
    .optional(),
});

export const publicSupplyChainSummarySchema = z
  .object({
    schemaVersion: z.literal(3),
    generatedAt: z.iso.datetime(),
    source: z.object({
      baseCommit: z.string().regex(/^[a-f0-9]{40}$/),
      revisionKind: z.literal("COMMIT"),
      treeDigest: z.string().regex(/^[a-f0-9]{64}$/),
    }),
    release: z.object({
      tag: z.string().regex(/^v[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?$/),
      auditedCommit: z.string().regex(/^[a-f0-9]{40}$/),
    }),
    evidence: z.object({
      parentCommit: z.string().regex(/^[a-f0-9]{40}$/),
      commitPolicy: z.literal("DIRECT_CHILD_SUMMARY_ONLY"),
      allowedPaths: z.tuple([z.literal("public/security/release-summary.json")]),
    }),
    deployment: z.object({
      provider: z.literal("VERCEL"),
      commitEnvironment: z.literal("VERCEL_GIT_COMMIT_SHA"),
      approvedCommitEnvironment: z.literal("APPROVED_DEPLOYMENT_COMMIT_SHA"),
      relation: z.literal("TAGGED_EVIDENCE_CHILD_OF_AUDITED_COMMIT"),
    }),
    controls: z.array(controlSchema),
    artifacts: z.array(
      z.object({
        kind: z.enum(["SARIF", "SBOM", "INVENTORY", "PROVENANCE", "SUMMARY"]),
        name: z.string(),
        sha256: z.string().regex(/^[a-f0-9]{64}$/),
      }),
    ),
    suppressions: z.object({ active: z.number().int().nonnegative(), expired: z.literal(0) }),
    runtimeImages: z
      .array(
        z.object({
          role: z.enum(["sandbox", "litellm", "postgresql"]),
          displayName: z.string().min(1),
          reference: z.string().min(1),
          scannedDigest: z.string().regex(/^sha256:[a-f0-9]{64}$/),
          sbomArtifact: z.string().endsWith(".cdx.json"),
          provenance: z.object({
            status: z.enum(["DIGEST_PINNED_BUILD", "VERIFIED_UPSTREAM_SIGNATURE", "DIGEST_PINNED"]),
            detail: z.string().min(1),
          }),
        }),
      )
      .length(3),
  })
  .superRefine((summary, context) => {
    if (
      summary.source.baseCommit !== summary.release.auditedCommit ||
      summary.evidence.parentCommit !== summary.release.auditedCommit
    ) {
      context.addIssue({
        code: "custom",
        message: "The source and evidence parent must equal the audited release commit.",
        path: ["release", "auditedCommit"],
      });
    }
    const codeql = summary.controls.find((control) => control.id === "codeql");
    if (
      codeql?.status !== "PASSED" ||
      codeql.findingCount !== 0 ||
      codeql.sourceCommit !== summary.release.auditedCommit ||
      !codeql.evidenceUrl
    ) {
      context.addIssue({
        code: "custom",
        message: "Hosted CodeQL must pass with zero findings against the audited commit.",
        path: ["controls"],
      });
    }
    if (new Set(summary.runtimeImages.map((image) => image.role)).size !== 3) {
      context.addIssue({
        code: "custom",
        message: "Runtime-image evidence must contain sandbox, LiteLLM, and PostgreSQL once each.",
        path: ["runtimeImages"],
      });
    }
    for (const image of summary.runtimeImages) {
      if (
        !summary.artifacts.some(
          (artifact) => artifact.kind === "SBOM" && artifact.name === image.sbomArtifact,
        )
      ) {
        context.addIssue({
          code: "custom",
          message: `${image.role} does not have a matching SBOM artifact.`,
          path: ["runtimeImages"],
        });
      }
    }
  });

export type PublicSupplyChainSummary = z.infer<typeof publicSupplyChainSummarySchema>;

export function releaseDeploymentIdentity(
  summary: PublicSupplyChainSummary | null,
): ReleaseDeploymentIdentity | null {
  if (!summary) return null;
  const codeql = summary.controls.find((control) => control.id === "codeql");
  if (!codeql?.evidenceUrl || !codeql.sourceCommit) return null;
  return {
    releaseTag: summary.release.tag,
    auditedCommit: summary.release.auditedCommit,
    evidenceParentCommit: summary.evidence.parentCommit,
    codeqlRunUrl: codeql.evidenceUrl,
    codeqlSourceCommit: codeql.sourceCommit,
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function statusPresentation(status: PublicSupplyChainSummary["controls"][number]["status"]): {
  readonly className: string;
  readonly label: string;
} {
  switch (status) {
    case "PASSED":
      return { className: "site-status site-status--functional", label: "Executed" };
    case "CONFIGURED_NOT_RUN":
      return { className: "site-status site-status--planned", label: "Configured · not validated" };
    case "NOT_APPLICABLE":
      return { className: "site-status site-status--planned", label: "Not applicable" };
  }
}

export async function readSupplyChainSummary(
  root: string,
): Promise<PublicSupplyChainSummary | null> {
  try {
    return publicSupplyChainSummarySchema.parse(
      JSON.parse(
        await readFile(resolve(root, "public/security/release-summary.json"), "utf8"),
      ) as unknown,
    );
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

export async function renderSupplyChainEvidence(
  root: string,
  deploymentBinding: VerifiedDeploymentBinding | null = null,
): Promise<string> {
  const summary = await readSupplyChainSummary(root);
  if (!summary) {
    return '<div class="site-evidence-note"><p>No successful supply-chain validation summary is checked in. Configured controls are not presented as executed.</p></div>';
  }
  const rows = summary.controls
    .filter((control) => control.id !== "python-shell")
    .map((control) => {
      const status = statusPresentation(control.status);
      const findings =
        control.findingCount === null ? "not measured" : String(control.findingCount);
      const evidence = control.evidenceUrl
        ? ` <a href="${escapeHtml(control.evidenceUrl)}" rel="noopener noreferrer">Hosted run</a>`
        : "";
      return `<tr>
        <th scope="row">${escapeHtml(control.label)}</th>
        <td><span class="${status.className}">${escapeHtml(status.label)}</span></td>
        <td>${escapeHtml(control.scanner)} ${escapeHtml(control.version)}${evidence}</td>
        <td>${escapeHtml(findings)}</td>
      </tr>`;
    })
    .join("\n");
  const imageRows = summary.runtimeImages
    .map(
      (image) => `<tr>
        <th scope="row">${escapeHtml(image.displayName)}</th>
        <td><code>${escapeHtml(image.reference)}</code></td>
        <td><code>${escapeHtml(image.scannedDigest)}</code></td>
        <td>${escapeHtml(image.provenance.status.toLowerCase().replaceAll("_", " "))}</td>
      </tr>`,
    )
    .join("\n");
  return `<div class="site-evidence-summary">
    <div class="site-evidence-summary__facts" aria-label="Recorded supply-chain evidence facts">
      <div><span>Release tag</span><strong>${escapeHtml(summary.release.tag)}</strong></div>
      <div><span>Audited commit</span><strong><code>${escapeHtml(summary.release.auditedCommit.slice(0, 12))}</code></strong></div>
      <div><span>Deployed commit</span><strong><code>${escapeHtml(deploymentBinding?.deployedCommit.slice(0, 12) ?? "not a deployed build")}</code></strong></div>
      <div><span>Runtime image SBOMs</span><strong>${summary.runtimeImages.length}</strong></div>
      <div><span>Active suppressions</span><strong>${summary.suppressions.active}</strong></div>
    </div>
    <div class="site-table-wrap" role="region" aria-label="Scanned runtime image digests" tabindex="0">
      <table class="site-matrix">
        <thead><tr><th scope="col">Runtime image</th><th scope="col">Pinned source</th><th scope="col">Scanned digest</th><th scope="col">Provenance</th></tr></thead>
        <tbody>${imageRows}</tbody>
      </table>
    </div>
    <p class="site-evidence-summary__binding">Recorded ${escapeHtml(summary.generatedAt)} against audited source-tree digest <code>${escapeHtml(summary.source.treeDigest)}</code>. The evidence commit is a direct child whose only changed path is this generated summary. ${deploymentBinding ? `Vercel verified deployed commit <code>${escapeHtml(deploymentBinding.deployedCommit)}</code>; the complete binding is published at <a href="./security/deployment-binding.json">deployment-binding.json</a>.` : "A Vercel deployment must supply and verify the approved evidence-commit binding before this site can be published."} Detailed SARIF, SBOM, inventory, and scanner metadata stay in local or CI artifacts rather than the public bundle.</p>
    <div class="site-table-wrap" role="region" aria-label="Supply-chain control results" tabindex="0">
      <table class="site-matrix">
        <thead><tr><th scope="col">Control</th><th scope="col">Recorded status</th><th scope="col">Tool</th><th scope="col">Findings</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}
