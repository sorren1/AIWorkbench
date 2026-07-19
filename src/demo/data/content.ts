import { stageDefs } from "./fixtures";
import type {
  Artifact,
  ArtifactMeta,
  ArtifactType,
  GeneratedStage,
  Issue,
  PullRequestData,
  PullRequestFile,
  StageId,
  StageStatus,
  ValidationData,
} from "./types";

/* ============================================================
   AI Delivery Workbench — Synthetic content & generators
   Artifact bodies, PR readiness, validation evidence, stage
   metadata, and logs. All synthetic; no real systems touched.
   ============================================================ */
const STAGE = stageDefs;

type StageTime = { p: string; s: string; c: string };

/* ---------- Per-stage metadata ---------- */
const STAGE_TIMES_1150: Record<StageId, StageTime> = {
  seed: { p: "core@1.0.0", s: "Jun 09 · 14:02", c: "Jun 09 · 14:02" },
  intake: { p: "intake@2.3.1", s: "Jun 09 · 14:03", c: "Jun 09 · 14:04" },
  spec: { p: "spec@2.4.0", s: "Jun 09 · 14:06", c: "Jun 09 · 14:08" },
  plan: { p: "plan@2.4.0", s: "Jun 09 · 14:11", c: "Jun 09 · 14:13" },
  targets: { p: "targets@1.9.2", s: "Jun 09 · 14:13", c: "Jun 09 · 14:15" },
  implement: { p: "impl@3.1.0", s: "Jun 10 · 09:48", c: "Jun 10 · 09:57" },
  verify: { p: "verify@2.0.4", s: "—", c: "—" },
  review: { p: "—", s: "—", c: "—" },
};

const ARTIFACT_BY_STAGE: Record<StageId, string[]> = {
  seed: ["inputs.json"],
  intake: ["intake.md"],
  spec: ["spec.md"],
  plan: ["plan.md"],
  targets: ["change-targets.json", "risk-review.md"],
  implement: [],
  verify: ["evidence.md"],
  review: [],
};

export function buildStages(issue: Issue): GeneratedStage[] {
  const t1150 = issue.key === "FIN-1150";
  return STAGE.map((def, i) => {
    const status = issue.s[i] || "none";
    const tm = t1150 ? STAGE_TIMES_1150[def.id] : genTimes(def.id, status, i);
    let artifacts = ARTIFACT_BY_STAGE[def.id] || [];
    if (status === "none" || status === "ready" || status === "run") artifacts = [];
    if (def.id === "review") artifacts = [];
    return {
      ...def,
      status,
      promptVersion: tm.p,
      startedAt: status === "none" ? "—" : tm.s,
      completedAt:
        status === "done" || status === "fail" ? tm.c : status === "run" ? "running…" : "—",
      artifacts,
      logsAvailable: status !== "none",
      reviewerActionRequired: status === "review",
    };
  });
}

function genTimes(id: StageId, status: StageStatus, i: number): StageTime {
  const base =
    ["08:12", "08:14", "08:19", "08:26", "08:28", "09:03", "09:31", "10:02"][i] || "08:00";
  return {
    p: id + "@2.x",
    s: status === "none" ? "—" : "Jun 10 · " + base,
    c: status === "done" || status === "fail" ? "Jun 10 · " + base : "—",
  };
}

/* ---------- Artifact bodies (FIN-1150, hand-authored) ---------- */
const A1150: Record<
  string,
  { type: ArtifactType; lang: "json" | "md"; body: string; pending?: boolean }
> = {
  "inputs.json": {
    type: "JSON",
    lang: "json",
    body: `{
  "issueKey": "FIN-1150",
  "source": "jira:simulated",
  "summary": "AI Variance Commentary Draft",
  "project": "FIN",
  "issueType": "Story",
  "priority": "High",
  "domain": "FP&A",
  "targetSurfaces": ["Angular", "C#/.NET API", "Oracle reporting data"],
  "labels": ["fpa", "ai-assist", "variance", "reporting"],
  "reporter": "synthetic.user@example.com",
  "assignee": "jordan.vega@example.com",
  "watchers": 4,
  "capturedAt": "2025-06-09T14:02:11Z",
  "cleanRoom": true,
  "note": "Synthetic issue snapshot — not a real Jira record."
}`,
  },
  "intake.md": {
    type: "Markdown",
    lang: "md",
    body: `# Intake — FIN-1150 · AI Variance Commentary Draft

**Lifecycle:** Implementation · **Domain:** FP&A · **Priority:** High

## Problem statement
Finance analysts spend significant time hand-writing budget-vs-actual variance
commentary during the monthly reporting cycle. The request is an **AI-drafted
commentary** that proposes a first-pass narrative which an analyst reviews,
edits, and approves before it appears in a report.

## In scope
- Angular panel that requests and displays a draft commentary for a selected
  budget line and period.
- .NET API endpoint that assembles variance inputs and returns a draft.
- Oracle reporting view exposing budget vs actual variance by account.

## Out of scope
- Auto-publishing commentary without human approval.
- Changing the underlying budgeting or forecast models.

## Open questions
- Confirm variance materiality threshold (assumed 5% / $50k).
- Confirm whether prior-period commentary should be offered as context.

> Synthetic intake generated for demonstration. No real backlog item.`,
  },
  "spec.md": {
    type: "Markdown",
    lang: "md",
    body: `# Specification — FIN-1150

## Goal
Provide an **AI-drafted, human-approved** variance commentary for a budget line
and reporting period, surfaced in the Angular reporting UI and served by the
.NET API over Oracle reporting data.

## Acceptance criteria
1. Analyst can request a draft commentary for a selected account + period.
2. Draft clearly shows the variance amount, % variance, and direction.
3. Draft is labeled **AI-generated — review required** until approved.
4. Analyst can edit the draft before approving; edits are preserved.
5. No commentary is published without an explicit human approval action.
6. Variance inputs are sourced from \`VW_BUDGET_ACTUAL_VARIANCE\` (read-only).
7. Materiality threshold (default 5% / $50k) is configurable per report.

## Non-functional
- API p95 < 600ms for a single line draft (excluding model latency).
- All requests carry the issue key for traceability.
- No PII in prompts; only account codes and aggregate figures.

> Deterministic spec artifact — synthetic.`,
  },
  "plan.md": {
    type: "Markdown",
    lang: "md",
    body: `# Implementation Plan — FIN-1150

## Sequencing
1. **Oracle** — add read-only view \`VW_BUDGET_ACTUAL_VARIANCE\` and package
   \`PKG_VARIANCE_COMMENTARY\` for aggregation helpers.
2. **.NET API** — \`VarianceCommentaryController\` + \`VarianceCommentaryService\`
   assemble inputs and return a structured draft DTO.
3. **Angular** — \`variance-commentary\` component + service render the draft,
   support edit, and gate approval behind a confirm action.
4. **Tests** — unit coverage for service aggregation and controller contract.

## Risk notes
- Draft must never auto-publish — enforce approval gate in UI **and** API.
- Threshold config must be validated to avoid divide-by-zero on $0 budgets.
- Keep prompts free of row-level PII (aggregates only).

## Rollback
- Feature flag \`fpa.aiVarianceCommentary\` defaults **off**; view + package are
  additive and independently revertible.

> Synthetic plan — for interactive portfolio demonstration only.`,
  },
  "change-targets.json": {
    type: "JSON",
    lang: "json",
    body: `{
  "issueKey": "FIN-1150",
  "branch": "feature/FIN-1150-ai-variance-commentary",
  "note": "Synthetic file paths — illustrative targets, not real source.",
  "targets": [
    { "path": "frontend/src/app/variance-commentary/variance-commentary.component.ts",   "category": "Angular UI",          "change": "add" },
    { "path": "frontend/src/app/variance-commentary/variance-commentary.component.html", "category": "Angular UI",          "change": "add" },
    { "path": "frontend/src/app/variance-commentary/variance-commentary.service.ts",     "category": "Angular UI",          "change": "add" },
    { "path": "backend/Finance.Api/Controllers/VarianceCommentaryController.cs",         "category": "C#/.NET API",         "change": "add" },
    { "path": "backend/Finance.Application/Services/VarianceCommentaryService.cs",        "category": "C#/.NET API",         "change": "add" },
    { "path": "backend/Finance.Data/Repositories/VarianceRepository.cs",                  "category": "C#/.NET API",         "change": "modify" },
    { "path": "database/oracle/views/VW_BUDGET_ACTUAL_VARIANCE.sql",                      "category": "Oracle SQL",          "change": "add" },
    { "path": "database/oracle/packages/PKG_VARIANCE_COMMENTARY.sql",                     "category": "Oracle SQL",          "change": "add" },
    { "path": "tests/Finance.Api.Tests/VarianceCommentaryTests.cs",                       "category": "Tests",               "change": "add" },
    { "path": "tests/Finance.Application.Tests/VarianceCommentaryServiceTests.cs",        "category": "Tests",               "change": "add" }
  ]
}`,
  },
  "risk-review.md": {
    type: "Markdown",
    lang: "md",
    body: `# Risk Review — FIN-1150

| Area | Risk | Severity | Mitigation |
|------|------|----------|------------|
| Publishing | AI commentary published without review | High | Approval gate in UI + API; default flag off |
| Data | Row-level PII leaking into prompts | Medium | Aggregates only; schema metadata via MCP |
| Math | Divide-by-zero on $0 budget lines | Medium | Threshold + guard in service layer |
| Scope | Change touches three repos | Medium | Explicit change-targets; PR file allow-list |

**Residual risk:** Medium — acceptable with approval gate and validation evidence.

> Synthetic risk review artifact.`,
  },
  "prompt-provenance.json": {
    type: "JSON",
    lang: "json",
    body: `{
  "issueKey": "FIN-1150",
  "runId": "run_7c3a9f21",
  "cleanRoom": true,
  "stages": [
    { "stage": "intake",  "promptVersion": "intake@2.3.1",  "model": "claude (simulated)", "inputsHash": "sha256:3f9c…a1" },
    { "stage": "spec",    "promptVersion": "spec@2.4.0",    "model": "claude (simulated)", "inputsHash": "sha256:b72e…04" },
    { "stage": "plan",    "promptVersion": "plan@2.4.0",    "model": "claude (simulated)", "inputsHash": "sha256:9d11…7c" },
    { "stage": "targets", "promptVersion": "targets@1.9.2", "model": "claude (simulated)", "inputsHash": "sha256:1aa8…e0" },
    { "stage": "implement","promptVersion":"impl@3.1.0",    "model": "codex (simulated)",  "inputsHash": "sha256:5fb3…9d" }
  ],
  "note": "Provenance is recorded so every artifact is traceable to a prompt version and input hash."
}`,
  },
  "evidence.md": {
    type: "Markdown",
    lang: "md",
    pending: true,
    body: `# Validation Evidence — FIN-1150

_Generated by the Verify stage._

## Result: PASSED (simulated)
- Unit tests: 24 passed / 0 failed
- API contract check: OK
- SQL validation (\`VW_BUDGET_ACTUAL_VARIANCE\`): OK
- Lint / static analysis: 0 errors, 2 warnings
- Secrets scan: clean

## Acceptance criteria coverage
- AC1–AC7: covered by test scenarios VC-01 … VC-09.

## Notes
- Approval gate verified in both UI and API paths.
- Threshold guard prevents divide-by-zero on $0 budgets.

> Synthetic evidence — produced by the simulated Verify run.`,
  },
};

export const artifactMeta: Record<string, ArtifactMeta> = {
  "inputs.json": { type: "JSON", stage: "seed", risk: "Low" },
  "intake.md": { type: "Markdown", stage: "intake", risk: "Low" },
  "spec.md": { type: "Markdown", stage: "spec", risk: "Low" },
  "plan.md": { type: "Markdown", stage: "plan", risk: "Medium" },
  "change-targets.json": { type: "JSON", stage: "targets", risk: "Medium" },
  "risk-review.md": { type: "Markdown", stage: "targets", risk: "Medium" },
  "prompt-provenance.json": { type: "JSON", stage: "implement", risk: "Low" },
  "evidence.md": { type: "Markdown", stage: "verify", risk: "Low" },
};

const REVIEW_STATUS: Record<string, string> = {
  "inputs.json": "Approved",
  "intake.md": "Approved",
  "spec.md": "Approved",
  "plan.md": "Approved",
  "change-targets.json": "Review required",
  "risk-review.md": "Approved",
  "prompt-provenance.json": "Auto-recorded",
  "evidence.md": "Pending",
};

// Generic body for non-1150 issues
function getArtifactMeta(name: string): ArtifactMeta {
  const metadata = artifactMeta[name];
  if (!metadata) throw new Error(`Unknown artifact: ${name}`);
  return metadata;
}

function genericBody(issue: Issue, name: string): string {
  const m = getArtifactMeta(name);
  if (m.type === "JSON") {
    return `{
  "issueKey": "${issue.key}",
  "summary": "${issue.title}",
  "domain": "${issue.domain}",
  "surface": "${issue.surface}",
  "artifact": "${name}",
  "cleanRoom": true,
  "note": "Synthetic ${name} for ${issue.key} — illustrative content."
}`;
  }
  return `# ${name.replace(/\.md$/, "")} — ${issue.key}

**${issue.title}** · ${issue.domain} · ${issue.surface}

This is a synthetic ${name} artifact generated for the work item
**${issue.key}**. In the full demo, ${issue.key === "FIN-1150" ? "" : ""}artifacts
carry the same structure as the FIN-1150 reference issue: a deterministic body,
a prompt version, an input hash, and a review status.

> Clean-room synthetic content — not a real artifact.`;
}

function bindArtifactBody(body: string, lang: "json" | "md", contextPackDigest?: string): string {
  if (!contextPackDigest) return body;
  if (lang === "json") {
    const parsed: unknown = JSON.parse(body);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return body;
    return JSON.stringify({ ...parsed, contextPackDigest }, null, 2);
  }
  return `${body}\n\n---\n\n**Context pack digest:** \`${contextPackDigest}\``;
}

export function artifactsFor(
  issue: Issue,
  contextPackDigests?: ReadonlyMap<StageId, string>,
): Artifact[] {
  const stages = buildStages(issue);
  const out: Artifact[] = [];
  stages.forEach((st) => {
    (st.artifacts || []).forEach((name) => {
      const meta = getArtifactMeta(name);
      const rich = issue.key === "FIN-1150" ? A1150[name] : null;
      const lang = rich ? rich.lang : meta.type === "JSON" ? "json" : "md";
      const contextPackDigest = contextPackDigests?.get(st.id);
      out.push({
        id: issue.key + "::" + name,
        name,
        type: meta.type,
        stage: st.name,
        stageId: st.id,
        timestamp: st.completedAt !== "—" ? st.completedAt : st.startedAt,
        reviewStatus: REVIEW_STATUS[name] || "Recorded",
        risk: meta.risk,
        lang,
        body: bindArtifactBody(
          rich ? rich.body : genericBody(issue, name),
          lang,
          contextPackDigest,
        ),
        ...(contextPackDigest ? { contextPackDigest } : {}),
      });
    });
  });
  return out;
}

// expose the would-be evidence artifact (added when Verify runs)
export function evidenceArtifact(issue: Issue, contextPackDigest?: string): Artifact {
  const rich = issue.key === "FIN-1150" ? A1150["evidence.md"] : null;
  return {
    id: issue.key + "::evidence.md",
    name: "evidence.md",
    type: "Markdown",
    stage: "Verify",
    stageId: "verify",
    timestamp: "just now",
    reviewStatus: "Pending",
    risk: "Low",
    lang: "md",
    body: bindArtifactBody(
      rich ? rich.body : genericBody(issue, "evidence.md"),
      "md",
      contextPackDigest,
    ),
    ...(contextPackDigest ? { contextPackDigest } : {}),
  };
}

/* ---------- PR readiness ---------- */
const PR_FILES_1150: PullRequestFile[] = [
  {
    path: "frontend/src/app/variance-commentary/variance-commentary.component.ts",
    category: "Angular UI",
    add: 142,
    del: 0,
    status: "expected",
  },
  {
    path: "frontend/src/app/variance-commentary/variance-commentary.component.html",
    category: "Angular UI",
    add: 86,
    del: 0,
    status: "expected",
  },
  {
    path: "frontend/src/app/variance-commentary/variance-commentary.service.ts",
    category: "Angular UI",
    add: 64,
    del: 0,
    status: "expected",
  },
  {
    path: "backend/Finance.Api/Controllers/VarianceCommentaryController.cs",
    category: "C#/.NET API",
    add: 73,
    del: 0,
    status: "expected",
  },
  {
    path: "backend/Finance.Application/Services/VarianceCommentaryService.cs",
    category: "C#/.NET API",
    add: 118,
    del: 0,
    status: "expected",
  },
  {
    path: "backend/Finance.Data/Repositories/VarianceRepository.cs",
    category: "C#/.NET API",
    add: 22,
    del: 6,
    status: "expected",
  },
  {
    path: "database/oracle/views/VW_BUDGET_ACTUAL_VARIANCE.sql",
    category: "Oracle SQL",
    add: 41,
    del: 0,
    status: "expected",
  },
  {
    path: "database/oracle/packages/PKG_VARIANCE_COMMENTARY.sql",
    category: "Oracle SQL",
    add: 59,
    del: 0,
    status: "expected",
  },
  {
    path: "tests/Finance.Api.Tests/VarianceCommentaryTests.cs",
    category: "Tests",
    add: 96,
    del: 0,
    status: "expected",
  },
  {
    path: "tests/Finance.Application.Tests/VarianceCommentaryServiceTests.cs",
    category: "Tests",
    add: 88,
    del: 0,
    status: "expected",
  },
  {
    path: "docs/evidence/FIN-1150-evidence.md",
    category: "Documentation / evidence",
    add: 34,
    del: 0,
    status: "unexpected",
  },
];

export function prFor(
  issue: Issue,
  artifactReviews: Readonly<Record<string, string>> = {},
): PullRequestData {
  if (issue.key === "FIN-1150") {
    const changeTargetsReview =
      artifactReviews[`${issue.key}::change-targets.json`] ?? REVIEW_STATUS["change-targets.json"];
    const changeTargetsCheck =
      changeTargetsReview === "Approved"
        ? { status: "pass", detail: "change-targets.json approved" }
        : changeTargetsReview === "Changes requested"
          ? { status: "fail", detail: "change-targets.json changes requested" }
          : { status: "pending", detail: "change-targets.json awaiting review" };
    return {
      number: 284,
      title: "FIN-1150: AI variance commentary draft (Angular + .NET + Oracle)",
      status: "Draft",
      branch: issue.branch,
      target: "main",
      author: "Alex Morgan · Synthetic demo persona",
      created: "Jun 10 · 10:04",
      commits: 6,
      files: PR_FILES_1150,
      unexpected: PR_FILES_1150.filter((f) => f.status === "unexpected").length,
      unresolvedComments: 2,
      summary:
        "Adds an AI-drafted, human-approved variance commentary across the stack. " +
        "Oracle view + package expose budget-vs-actual variance; the .NET service assembles " +
        "inputs and returns a structured draft; the Angular panel renders the draft, supports " +
        "edits, and gates publishing behind an explicit approval. Behind feature flag " +
        "fpa.aiVarianceCommentary (default off).",
      checks: [
        { name: "Unit tests", status: "pass", detail: "24 passed / 0 failed" },
        { name: "API contract checks", status: "pass", detail: "schema OK" },
        { name: "SQL validation", status: "pass", detail: "view + package parse OK" },
        { name: "Lint / static analysis", status: "pass", detail: "0 errors · 2 warnings" },
        {
          name: "Change-target artifact review",
          ...changeTargetsCheck,
        },
        { name: "No secrets detected", status: "pass", detail: "0 findings" },
        { name: "Human review required", status: "required", detail: "reviewer gate not yet met" },
      ],
      reviewers: [
        { name: "Synthetic reviewer A", role: "Reviewer", state: "pending" },
        { name: "Synthetic reviewer B", role: "Service adapter", state: "pending" },
      ],
      checklist: [
        { label: "Changed files compared with change-targets.json", done: false },
        {
          label: "Unexpected evidence file reviewed and scope exception accepted",
          done: false,
        },
        { label: "Tests cover acceptance criteria", done: true },
        { label: "No secrets / credentials in diff", done: true },
        { label: "Approval gate verified in UI and API", done: true },
      ],
      mergeReady: false,
    };
  }
  // generic
  const hasPR = !!issue.pr;
  return {
    number: issue.pr,
    title: issue.key + ": " + issue.title,
    status: issue.prStatus,
    branch: issue.branch,
    target: "main",
    author: issue.assignee,
    created: issue.lastRun,
    commits: hasPR ? 4 : 0,
    files: hasPR ? PR_FILES_1150.slice(0, 6) : [],
    unexpected: 0,
    unresolvedComments: issue.flags.needsReview ? 1 : 0,
    summary: hasPR
      ? "Synthetic PR summary for " +
        issue.key +
        ". Changed files are grounded in the issue's change-targets artifact."
      : "No pull request exists in the synthetic fixture. Simulate the workflow through Implement, then create a mock PR in local state.",
    checks: hasPR
      ? [
          {
            name: "Unit tests",
            status: issue.flags.failedVerification ? "fail" : "pass",
            detail: issue.flags.failedVerification ? "2 failed" : "passed",
          },
          { name: "No secrets detected", status: "pass", detail: "0 findings" },
          { name: "Human review required", status: "required", detail: "reviewer gate" },
        ]
      : [],
    reviewers: hasPR
      ? [
          {
            name: issue.reviewer,
            role: "Reviewer",
            state: issue.flags.needsReview ? "pending" : "pending",
          },
        ]
      : [],
    checklist: [
      { label: "Changed files match change-targets.json", done: hasPR },
      { label: "Tests cover acceptance criteria", done: hasPR && !issue.flags.failedVerification },
      { label: "No secrets in diff", done: hasPR },
    ],
    mergeReady: false,
    empty: !hasPR,
  };
}

/* ---------- Validation evidence ---------- */
export function validationFor(issue: Issue): ValidationData {
  if (issue.key === "FIN-1150") {
    return {
      decision: "Pending",
      branch: issue.branch,
      commitSha: "a1c9f3e",
      evidenceStatus: "In Progress",
      acceptance: [
        {
          id: "AC1",
          text: "Analyst can request a draft commentary for an account + period",
          status: "Passed",
        },
        {
          id: "AC2",
          text: "Draft shows variance amount, % variance, and direction",
          status: "Passed",
        },
        {
          id: "AC3",
          text: "Draft labeled 'AI-generated — review required' until approved",
          status: "Passed",
        },
        {
          id: "AC4",
          text: "Analyst can edit the draft; edits are preserved",
          status: "In Progress",
        },
        {
          id: "AC5",
          text: "No commentary published without explicit human approval",
          status: "Passed",
        },
        {
          id: "AC6",
          text: "Inputs sourced from VW_BUDGET_ACTUAL_VARIANCE (read-only)",
          status: "Passed",
        },
        { id: "AC7", text: "Materiality threshold configurable per report", status: "Not Started" },
      ],
      scenarios: [
        {
          name: "VC-01 · Draft for material unfavorable variance",
          status: "Passed",
          note: "−$182k / −12.4%",
        },
        {
          name: "VC-02 · Draft for immaterial variance (below threshold)",
          status: "Passed",
          note: "suppressed as expected",
        },
        { name: "VC-03 · $0 budget line guard", status: "Passed", note: "no divide-by-zero" },
        {
          name: "VC-04 · Edit then approve preserves edits",
          status: "In Progress",
          note: "edit persistence under test",
        },
        {
          name: "VC-05 · Approval gate blocks publish",
          status: "Passed",
          note: "UI + API both block",
        },
      ],
      oracleAssumptions: [
        "VW_BUDGET_ACTUAL_VARIANCE is read-only and additive.",
        "Aggregation grain is account × period; no row-level PII.",
        "PKG_VARIANCE_COMMENTARY guards $0 budgets before division.",
      ],
      apiNotes: [
        "Endpoint returns a structured draft DTO with variance figures.",
        "Approval is a separate, explicit POST — never implicit.",
        "Issue key propagated on every request for traceability.",
      ],
      uiNotes: [
        "Draft is visibly labeled AI-generated until approved.",
        "Edit buffer is local until the analyst approves.",
        "Disabled approve button until a draft is present.",
      ],
      a11y: "In Progress",
      security: "Passed",
      testerNotes: [
        {
          author: "Synthetic tester A",
          time: "Jun 10 · 11:20",
          text: "Approval gate solid in both paths. Verified publish is blocked without explicit approve.",
        },
        {
          author: "Synthetic tester A",
          time: "Jun 10 · 11:34",
          text: "Edit-persistence (AC4 / VC-04) still under test — re-checking buffer on re-open.",
        },
      ],
    };
  }
  // generic
  const failed = !!issue.flags.failedVerification;
  return {
    decision: failed ? "Failed" : "Not Started",
    branch: issue.branch,
    commitSha: "—",
    evidenceStatus: failed ? "Failed" : "Not Started",
    acceptance: [
      {
        id: "AC1",
        text: "Primary behavior for " + issue.title,
        status: failed ? "Failed" : "Not Started",
      },
      { id: "AC2", text: "Secondary acceptance criterion", status: "Not Started" },
    ],
    scenarios: failed
      ? [{ name: "Primary scenario", status: "Failed", note: "see verify logs" }]
      : [{ name: "Primary scenario", status: "Not Started", note: "validation not started" }],
    oracleAssumptions: ["Synthetic assumptions for " + issue.key + "."],
    apiNotes: ["Synthetic API validation notes."],
    uiNotes: ["Synthetic UI validation notes."],
    a11y: "Not Started",
    security: "Not Started",
    testerNotes: failed
      ? [
          {
            author: issue.tester !== "—" ? issue.tester : "QA",
            time: issue.lastRun,
            text: "Verify failed — fixes requested before re-run.",
          },
        ]
      : [],
    empty: !failed,
  };
}

/* ---------- Logs ---------- */
export function logsFor(issue: Issue, stageId: StageId): string[] {
  const key = issue.key;
  const lines = [
    "[" + key + "] workspace: clean (ephemeral) — demo mode, no external writes",
    "[" + key + "] context: Jira MCP + GitHub MCP + Oracle Schema MCP attached (simulated)",
    "[stage:" + stageId + "] prompt loaded · provenance recorded",
    "[stage:" + stageId + "] grounding: 3 context sources, 0 disallowed ops",
  ];
  const st = issue.s[STAGE.findIndex((s) => s.id === stageId)] || "none";
  if (stageId === "verify" && st === "fail") {
    lines.push("[verify] running test suite… ");
    lines.push("[verify] FAIL  VarianceCommentaryServiceTests.Threshold_ZeroBudget");
    lines.push("[verify] 22 passed · 2 failed");
    lines.push("[verify] evidence: FAILED — fixes required");
  } else if (st === "fail") {
    lines.push("[" + stageId + "] error: simulated failure for demo");
    lines.push("[" + stageId + "] exit: non-zero (retry available)");
  } else if (st === "run") {
    lines.push("[" + stageId + "] executing… (simulated)");
    lines.push("[" + stageId + "] streaming output…");
  } else if (st === "done") {
    lines.push(
      "[" + stageId + "] generated artifact(s): " + (ARTIFACT_BY_STAGE[stageId] || []).join(", ") ||
        "—",
    );
    lines.push("[" + stageId + "] exit: 0 · duration 1.8s (simulated)");
  } else {
    lines.push("[" + stageId + "] not started");
  }
  lines.push("[audit] synthetic run appended to the browser-local evidence fixture");
  return lines;
}
