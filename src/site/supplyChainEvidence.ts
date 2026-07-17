import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { z } from "zod";

const controlSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(["PASSED", "CONFIGURED_NOT_RUN", "NOT_APPLICABLE"]),
  scanner: z.string(),
  version: z.string(),
  target: z.string(),
  findingCount: z.number().nullable(),
  detail: z.string(),
});

export const publicSupplyChainSummarySchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.iso.datetime(),
  source: z.object({
    baseCommit: z.string().regex(/^[a-f0-9]{40}$/),
    revisionKind: z.enum(["COMMIT", "WORKTREE"]),
    treeDigest: z.string().regex(/^[a-f0-9]{64}$/),
  }),
  controls: z.array(controlSchema),
  artifacts: z.array(
    z.object({
      kind: z.enum(["SARIF", "SBOM", "INVENTORY", "SUMMARY"]),
      name: z.string(),
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
    }),
  ),
  suppressions: z.object({ active: z.number().int().nonnegative(), expired: z.literal(0) }),
});

export type PublicSupplyChainSummary = z.infer<typeof publicSupplyChainSummarySchema>;

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

export async function renderSupplyChainEvidence(root: string): Promise<string> {
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
      return `<tr>
        <th scope="row">${escapeHtml(control.label)}</th>
        <td><span class="${status.className}">${escapeHtml(status.label)}</span></td>
        <td>${escapeHtml(control.scanner)} ${escapeHtml(control.version)}</td>
        <td>${escapeHtml(findings)}</td>
      </tr>`;
    })
    .join("\n");
  const sbomCount = summary.artifacts.filter((artifact) => artifact.kind === "SBOM").length;
  return `<div class="site-evidence-summary">
    <div class="site-evidence-summary__facts" aria-label="Recorded supply-chain evidence facts">
      <div><span>Validated source state</span><strong>${escapeHtml(summary.source.revisionKind.toLowerCase())}</strong></div>
      <div><span>Validation base commit</span><strong><code>${escapeHtml(summary.source.baseCommit.slice(0, 12))}</code></strong></div>
      <div><span>CycloneDX SBOM artifacts</span><strong>${sbomCount}</strong></div>
      <div><span>Active suppressions</span><strong>${summary.suppressions.active}</strong></div>
    </div>
    <p class="site-evidence-summary__binding">Recorded ${escapeHtml(summary.generatedAt)} against source-tree digest <code>${escapeHtml(summary.source.treeDigest)}</code>. Detailed SARIF, SBOM, inventory, and scanner metadata stay in local or CI artifacts rather than the public bundle.</p>
    <div class="site-table-wrap" role="region" aria-label="Supply-chain control results" tabindex="0">
      <table class="site-matrix">
        <thead><tr><th scope="col">Control</th><th scope="col">Recorded status</th><th scope="col">Tool</th><th scope="col">Findings</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div>`;
}
