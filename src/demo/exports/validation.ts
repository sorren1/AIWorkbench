import type { Issue, ValidationData, ValidationStatus } from "../data/types";
import type { ValidationOverride } from "../state/store";
import type { DownloadSpec } from "../utils/browserActions";

const NOTICE =
  "Synthetic validation evidence generated from public portfolio fixtures and browser-local demo state. No external test system was contacted.";

export type ValidationEvidencePack = {
  readonly schemaVersion: 1;
  readonly kind: "synthetic-validation-evidence-pack";
  readonly classification: "synthetic_demo_fixture";
  readonly notice: string;
  readonly issue: { readonly key: string; readonly title: string; readonly lifecycle: string };
  readonly testedBuild: {
    readonly branch: string;
    readonly commitSha: string;
    readonly environment: "QA (simulated)";
  };
  readonly finalDecision: ValidationStatus;
  readonly evidenceStatus: ValidationStatus;
  readonly acceptance: ValidationData["acceptance"];
  readonly scenarios: ValidationData["scenarios"];
  readonly assumptions: {
    readonly database: readonly string[];
    readonly api: readonly string[];
    readonly ui: readonly string[];
  };
  readonly reviews: {
    readonly accessibility: ValidationStatus;
    readonly security: ValidationStatus;
  };
  readonly testerNotes: ValidationData["testerNotes"];
  readonly excludedLocalContent: {
    readonly browserLocalTesterNoteCount: number;
    readonly reason: string;
  };
};

export function createValidationEvidencePack(
  issue: Issue,
  base: ValidationData,
  override: ValidationOverride,
): ValidationEvidencePack {
  const scenarios = base.scenarios.map((scenario) => ({
    ...scenario,
    status: override.scenarios?.[scenario.name] ?? scenario.status,
  }));
  const acceptance = base.acceptance.map((criterion) => ({
    ...criterion,
    status: override.acceptance?.[criterion.id] ?? criterion.status,
  }));
  return {
    schemaVersion: 1,
    kind: "synthetic-validation-evidence-pack",
    classification: "synthetic_demo_fixture",
    notice: NOTICE,
    issue: { key: issue.key, title: issue.title, lifecycle: issue.lifecycle },
    testedBuild: {
      branch: base.branch,
      commitSha: base.commitSha,
      environment: "QA (simulated)",
    },
    finalDecision: override.decision ?? base.decision,
    evidenceStatus: override.evidenceStatus ?? base.evidenceStatus,
    acceptance,
    scenarios,
    assumptions: {
      database: base.oracleAssumptions,
      api: base.apiNotes,
      ui: base.uiNotes,
    },
    reviews: {
      accessibility: override.accessibility ?? base.a11y,
      security: override.security ?? base.security,
    },
    testerNotes: base.testerNotes,
    excludedLocalContent: {
      browserLocalTesterNoteCount: override.notes?.length ?? 0,
      reason:
        "Freeform browser-local notes are excluded so exports contain only authored synthetic fixtures.",
    },
  };
}

export function validationEvidenceJson(pack: ValidationEvidencePack): string {
  return JSON.stringify(pack, null, 2);
}

export function validationEvidenceMarkdown(pack: ValidationEvidencePack): string {
  const acceptance = pack.acceptance
    .map((item) => `- **${item.id} · ${item.status}:** ${item.text}`)
    .join("\n");
  const scenarios = pack.scenarios
    .map(
      (scenario) =>
        `- **${scenario.status}:** ${scenario.name}${scenario.note ? ` — ${scenario.note}` : ""}`,
    )
    .join("\n");
  const notes = pack.testerNotes.length
    ? pack.testerNotes.map((note) => `- **${note.author} · ${note.time}:** ${note.text}`).join("\n")
    : "- No synthetic tester notes recorded.";
  const excluded = `> ${pack.excludedLocalContent.browserLocalTesterNoteCount} browser-local tester note${pack.excludedLocalContent.browserLocalTesterNoteCount === 1 ? " was" : "s were"} excluded. ${pack.excludedLocalContent.reason}`;
  return `# Validation evidence · ${pack.issue.key}\n\n> ${pack.notice}\n\n## Tested build\n\n- Branch: \`${pack.testedBuild.branch}\`\n- Commit: \`${pack.testedBuild.commitSha}\`\n- Environment: ${pack.testedBuild.environment}\n- Final decision: **${pack.finalDecision}**\n- Evidence status: **${pack.evidenceStatus}**\n\n## Acceptance criteria\n\n${acceptance}\n\n## Test scenarios\n\n${scenarios}\n\n## Tester notes\n\n${excluded}\n\n${notes}\n`;
}

export function validationEvidenceDownload(
  pack: ValidationEvidencePack,
  format: "json" | "markdown",
): DownloadSpec {
  const stem = `${pack.issue.key}-synthetic-validation-evidence`;
  return format === "json"
    ? {
        filename: `${stem}.json`,
        mimeType: "application/json;charset=utf-8",
        contents: validationEvidenceJson(pack),
      }
    : {
        filename: `${stem}.md`,
        mimeType: "text/markdown;charset=utf-8",
        contents: validationEvidenceMarkdown(pack),
      };
}
