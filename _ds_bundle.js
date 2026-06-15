/* @ds-bundle: {"format":3,"namespace":"CleanroomDesignSystem_bc2856","components":[],"sourceHashes":{"workbench/app.jsx":"d5d5c04ccfc0","workbench/content.js":"a3f1d4e18cea","workbench/data.js":"63b8287b1da5","workbench/icons.jsx":"6a2955c24005","workbench/primitives.jsx":"5cabe4c2db9d","workbench/screen-architecture.jsx":"c808596cb5bd","workbench/screen-artifacts.jsx":"c12bc962de54","workbench/screen-github.jsx":"e24fa1bc4e6c","workbench/screen-issue.jsx":"54064af697e8","workbench/screen-settings.jsx":"7d24b57b3b9a","workbench/screen-validation.jsx":"a9cb98c5a1e1","workbench/screen-workqueue.jsx":"46c38c8efe63","workbench/shell.jsx":"c2ebbf0caf6a","workbench/store.jsx":"5fb7c77aa9c7"},"inlinedExternals":[],"unexposedExports":[]} */

(() => {

const __ds_ns = (window.CleanroomDesignSystem_bc2856 = window.CleanroomDesignSystem_bc2856 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// workbench/app.jsx
try { (() => {
/* ============================================================
   AI Delivery Workbench — Root app + router
   ============================================================ */
function Screen() {
  const {
    state
  } = useApp();
  switch (state.route) {
    case "queue":
      return /*#__PURE__*/React.createElement(WorkQueue, null);
    case "issue":
      return /*#__PURE__*/React.createElement(IssueDetail, null);
    case "artifacts":
      return /*#__PURE__*/React.createElement(ArtifactsScreen, null);
    case "github":
      return /*#__PURE__*/React.createElement(GitHubScreen, null);
    case "validation":
      return /*#__PURE__*/React.createElement(ValidationScreen, null);
    case "architecture":
      return /*#__PURE__*/React.createElement(ArchitectureScreen, null);
    case "settings":
      return /*#__PURE__*/React.createElement(SettingsScreen, null);
    default:
      return /*#__PURE__*/React.createElement(WorkQueue, null);
  }
}
function Footer() {
  return /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 1320,
      margin: "0 auto",
      padding: "0 26px 28px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-flex wb-wrap",
    style: {
      gap: 10,
      padding: "14px 0 0",
      borderTop: "1px solid var(--border-subtle)",
      color: "var(--text-tertiary)",
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-check",
    size: 14
  }), /*#__PURE__*/React.createElement("span", null, window.WBData.meta.aboutNote), /*#__PURE__*/React.createElement("span", {
    className: "wb-spacer",
    style: {
      marginLeft: "auto"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "wb-mono"
  }, window.WBData.meta.product, " \xB7 v", window.WBData.meta.version)));
}
function App() {
  const [theme, setTheme] = useTheme();
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-app"
  }, /*#__PURE__*/React.createElement(Sidebar, null), /*#__PURE__*/React.createElement("div", {
    className: "wb-main"
  }, /*#__PURE__*/React.createElement(Header, {
    theme: theme,
    setTheme: setTheme
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-content cr-scroll"
  }, /*#__PURE__*/React.createElement(Screen, null), /*#__PURE__*/React.createElement(Footer, null))), /*#__PURE__*/React.createElement(ToastHost, null), /*#__PURE__*/React.createElement(DrawerHost, null), /*#__PURE__*/React.createElement(ModalHost, null));
}
ReactDOM.createRoot(document.getElementById("root")).render(/*#__PURE__*/React.createElement(AppProvider, null, /*#__PURE__*/React.createElement(App, null)));
})(); } catch (e) { __ds_ns.__errors.push({ path: "workbench/app.jsx", error: String((e && e.message) || e) }); }

// workbench/content.js
try { (() => {
/* ============================================================
   AI Delivery Workbench — Synthetic content & generators
   Artifact bodies, PR readiness, validation evidence, stage
   metadata, and logs. All synthetic; no real systems touched.
   ============================================================ */
(function () {
  const D = window.WBData;
  const STAGE = D.stageDefs;

  /* ---------- Per-stage metadata ---------- */
  const STAGE_TIMES_1150 = {
    seed: {
      p: "core@1.0.0",
      s: "Jun 09 · 14:02",
      c: "Jun 09 · 14:02"
    },
    intake: {
      p: "intake@2.3.1",
      s: "Jun 09 · 14:03",
      c: "Jun 09 · 14:04"
    },
    spec: {
      p: "spec@2.4.0",
      s: "Jun 09 · 14:06",
      c: "Jun 09 · 14:08"
    },
    plan: {
      p: "plan@2.4.0",
      s: "Jun 09 · 14:11",
      c: "Jun 09 · 14:13"
    },
    targets: {
      p: "targets@1.9.2",
      s: "Jun 09 · 14:13",
      c: "Jun 09 · 14:15"
    },
    implement: {
      p: "impl@3.1.0",
      s: "Jun 10 · 09:48",
      c: "Jun 10 · 09:57"
    },
    verify: {
      p: "verify@2.0.4",
      s: "—",
      c: "—"
    },
    review: {
      p: "—",
      s: "—",
      c: "—"
    }
  };
  const ARTIFACT_BY_STAGE = {
    seed: ["inputs.json"],
    intake: ["intake.md"],
    spec: ["spec.md"],
    plan: ["plan.md"],
    targets: ["change-targets.json", "risk-review.md"],
    implement: [],
    verify: ["evidence.md"],
    review: []
  };
  D.buildStages = function (issue) {
    const t1150 = issue.key === "FIN-1150";
    return STAGE.map((def, i) => {
      const status = issue.s[i] || "none";
      const tm = t1150 ? STAGE_TIMES_1150[def.id] : genTimes(issue, def.id, status, i);
      let artifacts = ARTIFACT_BY_STAGE[def.id] || [];
      if (status === "none" || status === "ready" || status === "run") artifacts = [];
      if (def.id === "review") artifacts = [];
      return {
        ...def,
        status,
        promptVersion: tm.p,
        startedAt: status === "none" ? "—" : tm.s,
        completedAt: status === "done" || status === "fail" ? tm.c : status === "run" ? "running…" : "—",
        artifacts,
        logsAvailable: status !== "none",
        reviewerActionRequired: status === "review"
      };
    });
  };
  function genTimes(issue, id, status, i) {
    const base = ["08:12", "08:14", "08:19", "08:26", "08:28", "09:03", "09:31", "10:02"][i] || "08:00";
    return {
      p: id + "@2.x",
      s: status === "none" ? "—" : "Jun 10 · " + base,
      c: status === "done" || status === "fail" ? "Jun 10 · " + base : "—"
    };
  }

  /* ---------- Artifact bodies (FIN-1150, hand-authored) ---------- */
  const A1150 = {
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
}`
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

> Synthetic intake generated for demonstration. No real backlog item.`
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

> Deterministic spec artifact — synthetic.`
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

> Synthetic plan — for interview demonstration only.`
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
}`
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

> Synthetic risk review artifact.`
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
}`
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

> Synthetic evidence — produced by the simulated Verify run.`
    }
  };
  D.artifactMeta = {
    "inputs.json": {
      type: "JSON",
      stage: "seed",
      risk: "Low"
    },
    "intake.md": {
      type: "Markdown",
      stage: "intake",
      risk: "Low"
    },
    "spec.md": {
      type: "Markdown",
      stage: "spec",
      risk: "Low"
    },
    "plan.md": {
      type: "Markdown",
      stage: "plan",
      risk: "Medium"
    },
    "change-targets.json": {
      type: "JSON",
      stage: "targets",
      risk: "Medium"
    },
    "risk-review.md": {
      type: "Markdown",
      stage: "targets",
      risk: "Medium"
    },
    "prompt-provenance.json": {
      type: "JSON",
      stage: "implement",
      risk: "Low"
    },
    "evidence.md": {
      type: "Markdown",
      stage: "verify",
      risk: "Low"
    }
  };
  const REVIEW_STATUS = {
    "inputs.json": "Approved",
    "intake.md": "Approved",
    "spec.md": "Approved",
    "plan.md": "Approved",
    "change-targets.json": "Review required",
    "risk-review.md": "Approved",
    "prompt-provenance.json": "Auto-recorded",
    "evidence.md": "Pending"
  };

  // Generic body for non-1150 issues
  function genericBody(issue, name) {
    const m = D.artifactMeta[name];
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
  D.artifactsFor = function (issue) {
    const stages = D.buildStages(issue);
    const out = [];
    stages.forEach(st => {
      (st.artifacts || []).forEach(name => {
        const meta = D.artifactMeta[name];
        const rich = issue.key === "FIN-1150" ? A1150[name] : null;
        out.push({
          id: issue.key + "::" + name,
          name,
          type: meta.type,
          stage: st.name,
          stageId: st.id,
          timestamp: st.completedAt !== "—" ? st.completedAt : st.startedAt,
          reviewStatus: REVIEW_STATUS[name] || "Recorded",
          risk: meta.risk,
          lang: rich ? rich.lang : meta.type === "JSON" ? "json" : "md",
          body: rich ? rich.body : genericBody(issue, name)
        });
      });
    });
    return out;
  };

  // expose the would-be evidence artifact (added when Verify runs)
  D.evidenceArtifact = function (issue) {
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
      body: rich ? rich.body : genericBody(issue, "evidence.md")
    };
  };

  /* ---------- PR readiness ---------- */
  const PR_FILES_1150 = [{
    path: "frontend/src/app/variance-commentary/variance-commentary.component.ts",
    category: "Angular UI",
    add: 142,
    del: 0,
    status: "expected"
  }, {
    path: "frontend/src/app/variance-commentary/variance-commentary.component.html",
    category: "Angular UI",
    add: 86,
    del: 0,
    status: "expected"
  }, {
    path: "frontend/src/app/variance-commentary/variance-commentary.service.ts",
    category: "Angular UI",
    add: 64,
    del: 0,
    status: "expected"
  }, {
    path: "backend/Finance.Api/Controllers/VarianceCommentaryController.cs",
    category: "C#/.NET API",
    add: 73,
    del: 0,
    status: "expected"
  }, {
    path: "backend/Finance.Application/Services/VarianceCommentaryService.cs",
    category: "C#/.NET API",
    add: 118,
    del: 0,
    status: "expected"
  }, {
    path: "backend/Finance.Data/Repositories/VarianceRepository.cs",
    category: "C#/.NET API",
    add: 22,
    del: 6,
    status: "expected"
  }, {
    path: "database/oracle/views/VW_BUDGET_ACTUAL_VARIANCE.sql",
    category: "Oracle SQL",
    add: 41,
    del: 0,
    status: "expected"
  }, {
    path: "database/oracle/packages/PKG_VARIANCE_COMMENTARY.sql",
    category: "Oracle SQL",
    add: 59,
    del: 0,
    status: "expected"
  }, {
    path: "tests/Finance.Api.Tests/VarianceCommentaryTests.cs",
    category: "Tests",
    add: 96,
    del: 0,
    status: "expected"
  }, {
    path: "tests/Finance.Application.Tests/VarianceCommentaryServiceTests.cs",
    category: "Tests",
    add: 88,
    del: 0,
    status: "expected"
  }, {
    path: "docs/evidence/FIN-1150-evidence.md",
    category: "Documentation / evidence",
    add: 34,
    del: 0,
    status: "unexpected"
  }];
  D.prFor = function (issue) {
    if (issue.key === "FIN-1150") {
      return {
        number: 284,
        title: "FIN-1150: AI variance commentary draft (Angular + .NET + Oracle)",
        status: "Draft",
        branch: issue.branch,
        target: "main",
        author: "Jordan Vega",
        created: "Jun 10 · 10:04",
        commits: 6,
        files: PR_FILES_1150,
        unexpected: PR_FILES_1150.filter(f => f.status === "unexpected").length,
        unresolvedComments: 2,
        summary: "Adds an AI-drafted, human-approved variance commentary across the stack. " + "Oracle view + package expose budget-vs-actual variance; the .NET service assembles " + "inputs and returns a structured draft; the Angular panel renders the draft, supports " + "edits, and gates publishing behind an explicit approval. Behind feature flag " + "fpa.aiVarianceCommentary (default off).",
        checks: [{
          name: "Unit tests",
          status: "pass",
          detail: "24 passed / 0 failed"
        }, {
          name: "API contract checks",
          status: "pass",
          detail: "schema OK"
        }, {
          name: "SQL validation",
          status: "pass",
          detail: "view + package parse OK"
        }, {
          name: "Lint / static analysis",
          status: "pass",
          detail: "0 errors · 2 warnings"
        }, {
          name: "Artifact review complete",
          status: "pending",
          detail: "change-targets.json awaiting review"
        }, {
          name: "No secrets detected",
          status: "pass",
          detail: "0 findings"
        }, {
          name: "Human review required",
          status: "required",
          detail: "reviewer gate not yet met"
        }],
        reviewers: [{
          name: "M. Donovan",
          role: "Reviewer",
          state: "pending"
        }, {
          name: "L. Okafor",
          role: "Backend",
          state: "pending"
        }],
        checklist: [{
          label: "Changed files match change-targets.json",
          done: false
        }, {
          label: "No unexpected files outside the allow-list",
          done: false
        }, {
          label: "Tests cover acceptance criteria",
          done: true
        }, {
          label: "No secrets / credentials in diff",
          done: true
        }, {
          label: "Approval gate verified in UI and API",
          done: true
        }],
        mergeReady: false
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
      summary: hasPR ? "Synthetic PR summary for " + issue.key + ". Changed files are grounded in the issue's change-targets artifact." : "No pull request has been created for this issue yet. Run the workflow through Implement, then create a mock PR.",
      checks: hasPR ? [{
        name: "Unit tests",
        status: issue.flags.failedVerification ? "fail" : "pass",
        detail: issue.flags.failedVerification ? "2 failed" : "passed"
      }, {
        name: "No secrets detected",
        status: "pass",
        detail: "0 findings"
      }, {
        name: "Human review required",
        status: "required",
        detail: "reviewer gate"
      }] : [],
      reviewers: hasPR ? [{
        name: issue.reviewer,
        role: "Reviewer",
        state: issue.flags.needsReview ? "pending" : "pending"
      }] : [],
      checklist: [{
        label: "Changed files match change-targets.json",
        done: hasPR
      }, {
        label: "Tests cover acceptance criteria",
        done: hasPR && !issue.flags.failedVerification
      }, {
        label: "No secrets in diff",
        done: hasPR
      }],
      mergeReady: false,
      empty: !hasPR
    };
  };

  /* ---------- Validation evidence ---------- */
  D.validationFor = function (issue) {
    if (issue.key === "FIN-1150") {
      return {
        decision: "Pending",
        branch: issue.branch,
        commitSha: "a1c9f3e",
        evidenceStatus: "In Progress",
        acceptance: [{
          id: "AC1",
          text: "Analyst can request a draft commentary for an account + period",
          status: "Passed"
        }, {
          id: "AC2",
          text: "Draft shows variance amount, % variance, and direction",
          status: "Passed"
        }, {
          id: "AC3",
          text: "Draft labeled 'AI-generated — review required' until approved",
          status: "Passed"
        }, {
          id: "AC4",
          text: "Analyst can edit the draft; edits are preserved",
          status: "In Progress"
        }, {
          id: "AC5",
          text: "No commentary published without explicit human approval",
          status: "Passed"
        }, {
          id: "AC6",
          text: "Inputs sourced from VW_BUDGET_ACTUAL_VARIANCE (read-only)",
          status: "Passed"
        }, {
          id: "AC7",
          text: "Materiality threshold configurable per report",
          status: "Not Started"
        }],
        scenarios: [{
          name: "VC-01 · Draft for material unfavorable variance",
          status: "Passed",
          note: "−$182k / −12.4%"
        }, {
          name: "VC-02 · Draft for immaterial variance (below threshold)",
          status: "Passed",
          note: "suppressed as expected"
        }, {
          name: "VC-03 · $0 budget line guard",
          status: "Passed",
          note: "no divide-by-zero"
        }, {
          name: "VC-04 · Edit then approve preserves edits",
          status: "In Progress",
          note: "edit persistence under test"
        }, {
          name: "VC-05 · Approval gate blocks publish",
          status: "Passed",
          note: "UI + API both block"
        }],
        oracleAssumptions: ["VW_BUDGET_ACTUAL_VARIANCE is read-only and additive.", "Aggregation grain is account × period; no row-level PII.", "PKG_VARIANCE_COMMENTARY guards $0 budgets before division."],
        apiNotes: ["Endpoint returns a structured draft DTO with variance figures.", "Approval is a separate, explicit POST — never implicit.", "Issue key propagated on every request for traceability."],
        uiNotes: ["Draft is visibly labeled AI-generated until approved.", "Edit buffer is local until the analyst approves.", "Disabled approve button until a draft is present."],
        a11y: "In Progress",
        security: "Passed",
        testerNotes: [{
          author: "P. Shah",
          time: "Jun 10 · 11:20",
          text: "Approval gate solid in both paths. Verified publish is blocked without explicit approve."
        }, {
          author: "P. Shah",
          time: "Jun 10 · 11:34",
          text: "Edit-persistence (AC4 / VC-04) still under test — re-checking buffer on re-open."
        }]
      };
    }
    // generic
    const failed = !!issue.flags.failedVerification;
    return {
      decision: failed ? "Failed" : "Not Started",
      branch: issue.branch,
      commitSha: "—",
      evidenceStatus: failed ? "Failed" : "Not Started",
      acceptance: [{
        id: "AC1",
        text: "Primary behavior for " + issue.title,
        status: failed ? "Failed" : "Not Started"
      }, {
        id: "AC2",
        text: "Secondary acceptance criterion",
        status: "Not Started"
      }],
      scenarios: failed ? [{
        name: "Primary scenario",
        status: "Failed",
        note: "see verify logs"
      }] : [{
        name: "Primary scenario",
        status: "Not Started",
        note: "validation not started"
      }],
      oracleAssumptions: ["Synthetic assumptions for " + issue.key + "."],
      apiNotes: ["Synthetic API validation notes."],
      uiNotes: ["Synthetic UI validation notes."],
      a11y: "Not Started",
      security: "Not Started",
      testerNotes: failed ? [{
        author: issue.tester !== "—" ? issue.tester : "QA",
        time: issue.lastRun,
        text: "Verify failed — fixes requested before re-run."
      }] : [],
      empty: !failed
    };
  };

  /* ---------- Logs ---------- */
  D.logsFor = function (issue, stageId) {
    const key = issue.key;
    const lines = ["[" + key + "] workspace: clean (ephemeral) — demo mode, no external writes", "[" + key + "] context: Jira MCP + GitHub MCP + Oracle Schema MCP attached (simulated)", "[stage:" + stageId + "] prompt loaded · provenance recorded", "[stage:" + stageId + "] grounding: 3 context sources, 0 disallowed ops"];
    const st = issue.s[STAGE.findIndex(s => s.id === stageId)] || "none";
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
      lines.push("[" + stageId + "] generated artifact(s): " + (ARTIFACT_BY_STAGE[stageId] || []).join(", ") || "—");
      lines.push("[" + stageId + "] exit: 0 · duration 1.8s (simulated)");
    } else {
      lines.push("[" + stageId + "] not started");
    }
    lines.push("[audit] run appended to evidence log (immutable, simulated)");
    return lines;
  };
})();
})(); } catch (e) { __ds_ns.__errors.push({ path: "workbench/content.js", error: String((e && e.message) || e) }); }

// workbench/data.js
try { (() => {
/* ============================================================
   AI Delivery Workbench — Synthetic fixture data (core)
   CLEAN-ROOM: All data is fully synthetic and invented for this
   interview prototype. It does not represent any real company's
   backlog, repositories, schemas, customers, or internal work.
   ============================================================ */
window.WBData = window.WBData || {};
WBData.meta = {
  product: "AI Delivery Workbench",
  disclaimer: "Clean-Room Interview Prototype — Synthetic Data Only",
  aboutNote: "This prototype performs no real Jira, GitHub, AI, Oracle, or MCP operations. All data and actions are simulated locally for interview demonstration purposes.",
  version: "0.9.0-demo",
  user: {
    name: "Jordan Vega",
    role: "Principal Software Engineer — AI",
    initials: "JV"
  }
};

/* ---- Stage definitions (the governed AI delivery workflow) ---- */
WBData.stageDefs = [{
  id: "seed",
  name: "Seed",
  icon: "circle-dot",
  desc: "Issue selected from Jira and pinned into a clean run workspace."
}, {
  id: "intake",
  name: "Intake",
  icon: "scroll-text",
  desc: "AI normalizes the Jira issue into a structured intake record."
}, {
  id: "spec",
  name: "Spec",
  icon: "file-text",
  desc: "Deterministic specification with acceptance criteria and scope."
}, {
  id: "plan",
  name: "Plan",
  icon: "list-checks",
  desc: "Implementation plan: steps, sequencing, and risk notes."
}, {
  id: "targets",
  name: "Change Targets",
  icon: "file-code",
  desc: "Explicit file-level change targets across the stack."
}, {
  id: "implement",
  name: "Implement",
  icon: "git-branch",
  desc: "AI drafts code on a feature branch — never on main."
}, {
  id: "verify",
  name: "Verify",
  icon: "flask",
  desc: "Simulated test + validation pass producing evidence."
}, {
  id: "review",
  name: "PR Review",
  icon: "git-pull-request",
  desc: "Human review gate before the change is release-eligible."
}];

/* ---- Status vocab ---- */
WBData.statusMap = {
  done: {
    label: "Completed",
    tone: "safe",
    icon: "check-circle"
  },
  ready: {
    label: "Ready",
    tone: "accent",
    icon: "circle"
  },
  run: {
    label: "Running",
    tone: "accent",
    icon: "loader"
  },
  fail: {
    label: "Failed",
    tone: "danger",
    icon: "x-circle"
  },
  stale: {
    label: "Stale",
    tone: "warn",
    icon: "ban"
  },
  review: {
    label: "Review Required",
    tone: "warn",
    icon: "alert-triangle"
  },
  none: {
    label: "Not Started",
    tone: "neutral",
    icon: "circle-dashed"
  }
};
WBData.riskMap = {
  Low: {
    tone: "safe",
    icon: "shield-check"
  },
  Medium: {
    tone: "warn",
    icon: "shield-alert"
  },
  High: {
    tone: "danger",
    icon: "alert-triangle"
  }
};
WBData.lifecycleTone = {
  "Backlog": "neutral",
  "Intake": "neutral",
  "Spec": "accent",
  "Planning": "accent",
  "Implementation": "accent",
  "Verification": "accent",
  "Review Ready": "warn",
  "Blocked": "danger"
};

/* ---- Work queue issues (synthetic finance-software themes) ---- */
/* stage status codes per stage: done|ready|run|fail|stale|review|none  */
WBData.issues = [{
  key: "FIN-1042",
  title: "ERP Report Refresh Observability",
  domain: "ERP Reporting",
  surface: "Full Stack",
  lifecycle: "Verification",
  risk: "Medium",
  branch: "feature/FIN-1042-refresh-observability",
  pr: 271,
  prStatus: "Open",
  lastRun: "14m ago",
  artifacts: 6,
  assignee: "A. Reyes",
  reviewer: "M. Donovan",
  tester: "P. Shah",
  s: ["done", "done", "done", "done", "done", "done", "run", "none"],
  next: {
    label: "View running verify",
    target: "issue"
  },
  flags: {
    hasPR: true
  }
}, {
  key: "FIN-1077",
  title: "Forecast Assumption Change Audit",
  domain: "FP&A",
  surface: "C#/.NET",
  lifecycle: "Review Ready",
  risk: "Low",
  branch: "feature/FIN-1077-assumption-audit",
  pr: 268,
  prStatus: "Ready for review",
  lastRun: "2h ago",
  artifacts: 7,
  assignee: "A. Reyes",
  reviewer: "L. Okafor",
  tester: "P. Shah",
  s: ["done", "done", "done", "done", "done", "done", "done", "review"],
  next: {
    label: "Open human review",
    target: "github"
  },
  flags: {
    hasPR: true,
    needsReview: true
  }
}, {
  key: "FIN-1113",
  title: "Connector Schema Drift Detection",
  domain: "Data Connectivity",
  surface: "Oracle",
  lifecycle: "Implementation",
  risk: "High",
  branch: "feature/FIN-1113-schema-drift",
  pr: null,
  prStatus: "—",
  lastRun: "38m ago",
  artifacts: 4,
  assignee: "S. Nakamura",
  reviewer: "M. Donovan",
  tester: "—",
  s: ["done", "done", "done", "done", "done", "fail", "none", "none"],
  next: {
    label: "Retry implement",
    target: "issue"
  },
  flags: {
    failedVerification: true
  }
}, {
  key: "FIN-1150",
  title: "AI Variance Commentary Draft",
  domain: "FP&A",
  surface: "Full Stack",
  lifecycle: "Implementation",
  risk: "Medium",
  branch: "feature/FIN-1150-ai-variance-commentary",
  pr: 284,
  prStatus: "Draft",
  lastRun: "6m ago",
  artifacts: 7,
  assignee: "Jordan Vega",
  reviewer: "M. Donovan",
  tester: "P. Shah",
  s: ["done", "done", "done", "done", "done", "done", "ready", "none"],
  next: {
    label: "Run Verify",
    target: "issue"
  },
  flags: {
    hasPR: true,
    primary: true
  }
}, {
  key: "FIN-1198",
  title: "Report Distribution Permission Review",
  domain: "Distribution",
  surface: "Angular",
  lifecycle: "Planning",
  risk: "Medium",
  branch: "feature/FIN-1198-distribution-permissions",
  pr: null,
  prStatus: "—",
  lastRun: "1h ago",
  artifacts: 5,
  assignee: "D. Whitfield",
  reviewer: "L. Okafor",
  tester: "—",
  s: ["done", "done", "done", "done", "done", "stale", "stale", "none"],
  next: {
    label: "Re-run Implement",
    target: "issue"
  },
  flags: {
    staleDownstream: true
  }
}, {
  key: "FIN-1234",
  title: "Close Checklist Evidence Pack",
  domain: "Close / Consolidation",
  surface: "Full Stack",
  lifecycle: "Spec",
  risk: "Low",
  branch: "feature/FIN-1234-close-evidence-pack",
  pr: null,
  prStatus: "—",
  lastRun: "3h ago",
  artifacts: 2,
  assignee: "S. Nakamura",
  reviewer: "—",
  tester: "—",
  s: ["done", "done", "ready", "none", "none", "none", "none", "none"],
  next: {
    label: "Generate Spec",
    target: "issue"
  },
  flags: {}
}, {
  key: "FIN-1260",
  title: "Excel Add-In Connection Health Panel",
  domain: "Data Connectivity",
  surface: "Angular",
  lifecycle: "Planning",
  risk: "Low",
  branch: "feature/FIN-1260-connection-health",
  pr: null,
  prStatus: "—",
  lastRun: "just now",
  artifacts: 3,
  assignee: "D. Whitfield",
  reviewer: "—",
  tester: "—",
  s: ["done", "done", "done", "run", "none", "none", "none", "none"],
  next: {
    label: "View running plan",
    target: "issue"
  },
  flags: {}
}, {
  key: "FIN-1301",
  title: "Scenario Comparison Export Validation",
  domain: "FP&A",
  surface: "Full Stack",
  lifecycle: "Verification",
  risk: "High",
  branch: "feature/FIN-1301-scenario-export",
  pr: 279,
  prStatus: "Open",
  lastRun: "22m ago",
  artifacts: 6,
  assignee: "A. Reyes",
  reviewer: "M. Donovan",
  tester: "P. Shah",
  s: ["done", "done", "done", "done", "done", "done", "fail", "none"],
  next: {
    label: "Inspect verify failure",
    target: "validation"
  },
  flags: {
    hasPR: true,
    failedVerification: true
  }
}, {
  key: "FIN-1345",
  title: "AI Data Quality Exception Summary",
  domain: "Data Quality",
  surface: "AI",
  lifecycle: "Intake",
  risk: "Medium",
  branch: "feature/FIN-1345-dq-exception-summary",
  pr: null,
  prStatus: "—",
  lastRun: "5h ago",
  artifacts: 1,
  assignee: "S. Nakamura",
  reviewer: "—",
  tester: "—",
  s: ["done", "ready", "none", "none", "none", "none", "none", "none"],
  next: {
    label: "Run Intake",
    target: "issue"
  },
  flags: {}
}, {
  key: "FIN-1402",
  title: "Intercompany Elimination Rule Preview",
  domain: "Close / Consolidation",
  surface: "Oracle",
  lifecycle: "Backlog",
  risk: "Low",
  branch: "—",
  pr: null,
  prStatus: "—",
  lastRun: "—",
  artifacts: 0,
  assignee: "—",
  reviewer: "—",
  tester: "—",
  s: ["done", "none", "none", "none", "none", "none", "none", "none"],
  next: {
    label: "Run Intake",
    target: "issue"
  },
  flags: {}
}];

/* ---- Surfaces a change can touch ---- */
WBData.surfaces = ["Angular", "C#/.NET", "Oracle", "Full Stack", "AI"];
WBData.surfaceIcon = {
  "Angular": "box",
  "C#/.NET": "cpu",
  "Oracle": "database",
  "Full Stack": "layout-grid",
  "AI": "sparkles"
};

/* ---- Settings fixtures ---- */
WBData.settings = {
  jira: {
    baseUrl: "https://jira.example.com",
    projectKey: "FIN",
    queryMode: "Assigned to me",
    jql: "project = FIN AND status != Done ORDER BY priority DESC",
    status: "Simulated"
  },
  github: {
    org: "example-finance-software",
    repos: [{
      name: "frontend-angular-app",
      role: "Angular / TypeScript UI",
      default: "main"
    }, {
      name: "finance-dotnet-api",
      role: "C# / .NET service layer",
      default: "main"
    }, {
      name: "oracle-reporting-scripts",
      role: "Oracle SQL — views & packages",
      default: "main"
    }],
    branchPattern: "feature/{issueKey}-{slug}",
    prTarget: "main",
    status: "Simulated"
  },
  ai: {
    primary: "Claude",
    secondary: "Codex",
    design: "Claude",
    maxRun: "15 min",
    humanApprovalBeforePR: true,
    autoMerge: false,
    autoDeploy: false
  },
  stack: {
    Frontend: "Angular / TypeScript",
    Backend: "C# / .NET",
    Database: "Oracle",
    "Source Control": "GitHub",
    "Issue Tracking": "Jira",
    "Review Container": "Pull Request"
  },
  governance: [{
    id: "g1",
    label: "Require human review before PR creation",
    on: true
  }, {
    id: "g2",
    label: "Require changed-file review",
    on: true
  }, {
    id: "g3",
    label: "Require artifact review",
    on: true
  }, {
    id: "g4",
    label: "Require QA evidence",
    on: true
  }, {
    id: "g5",
    label: "Mark downstream stages stale after redo",
    on: true
  }, {
    id: "g6",
    label: "Block secrets in generated output",
    on: true
  }, {
    id: "g7",
    label: "Preserve prompt provenance",
    on: true
  }, {
    id: "g8",
    label: "Preserve reviewer decisions",
    on: true
  }, {
    id: "g9",
    label: "Disable real external writes in demo mode",
    on: true,
    locked: true
  }, {
    id: "g10",
    label: "Require final validation before merge readiness",
    on: true
  }]
};

/* ---- MCP context servers ---- */
WBData.mcpServers = [{
  name: "Jira Context MCP",
  icon: "scroll-text",
  status: "Simulated",
  purpose: "Exposes the selected issue, comments, and acceptance criteria as structured context.",
  boundary: "Single project (FIN), assigned issues only. No write-back to Jira.",
  allowed: ["read_issue", "read_comments", "read_acceptance_criteria"],
  disallowed: ["transition_issue", "post_comment", "edit_fields"]
}, {
  name: "GitHub Repo Context MCP",
  icon: "git-branch",
  status: "Simulated",
  purpose: "Provides repository tree, file contents, and branch/PR state for grounding.",
  boundary: "Mapped repos only. Read-only file access; branch/PR via control plane.",
  allowed: ["read_tree", "read_file", "read_pr_status"],
  disallowed: ["force_push", "merge_pr", "delete_branch"]
}, {
  name: "Documentation MCP",
  icon: "file-text",
  status: "Simulated",
  purpose: "Serves engineering standards, ADRs, and component guidelines as retrievable context.",
  boundary: "Curated docs corpus. No external web fetch.",
  allowed: ["search_docs", "read_doc"],
  disallowed: ["edit_doc", "publish_doc"]
}, {
  name: "Oracle Schema Context MCP",
  icon: "database",
  status: "Simulated",
  purpose: "Surfaces synthetic table, view, and package signatures for grounded SQL targets.",
  boundary: "Metadata only — object signatures and column types. No data rows, no DML.",
  allowed: ["describe_object", "list_dependencies"],
  disallowed: ["execute_query", "read_rows", "run_ddl"]
}, {
  name: "Business Rules Memory MCP",
  icon: "shield",
  status: "Simulated",
  purpose: "Holds durable domain rules (e.g. variance thresholds, elimination logic) as memory.",
  boundary: "Approved rules only. Versioned and human-curated.",
  allowed: ["read_rule", "list_rules"],
  disallowed: ["write_rule", "auto_learn"]
}, {
  name: "Prior Decisions / Evidence MCP",
  icon: "clipboard-check",
  status: "Simulated",
  purpose: "Recalls prior review decisions and validation evidence for traceability.",
  boundary: "Append-only evidence log. Immutable history.",
  allowed: ["read_decision", "read_evidence"],
  disallowed: ["delete_record", "rewrite_history"]
}];

/* ---- Architecture planes ---- */
WBData.architecture = {
  planes: [{
    id: "control",
    name: "Control Plane",
    icon: "layout-grid",
    tone: "accent",
    tagline: "Where humans steer and the system stays accountable.",
    items: ["Jira queue and issue detail", "Settings & integration config", "Artifact browser", "Run metadata & history", "GitHub PR state", "Review gates", "Audit trail", "Lifecycle state model"]
  }, {
    id: "exec",
    name: "Execution Plane",
    icon: "cpu",
    tone: "secure",
    tagline: "Isolated, ephemeral work — never touching production.",
    items: ["Clean workspace", "Repo clone", "Branch checkout", "Prompt execution", "Artifact generation", "Code generation", "Test execution", "Commit / push", "Run logs"]
  }, {
    id: "context",
    name: "Context / MCP Plane",
    icon: "network",
    tone: "safe",
    tagline: "Grounded, bounded context — not an open data firehose.",
    items: ["Jira context server", "GitHub / repo context server", "Documentation context server", "Business rules memory server", "Oracle schema context server", "Prior decisions / evidence memory server"]
  }, {
    id: "validation",
    name: "Validation Plane",
    icon: "flask",
    tone: "warn",
    tagline: "Evidence and approval that travel with the change.",
    items: ["QA evidence", "Environment readiness", "Test notes", "Approval state", "Release readiness", "Validation history"]
  }],
  productionNote: "In production, each plane would require identity, authorization, secrets management, audit persistence, execution isolation, integration-specific error handling, and clear rollback / retry behavior.",
  principalTopics: ["Control plane vs execution plane separation", "Deterministic, reviewable artifacts", "Human review gates", "MCP / context boundaries", "Prompt provenance", "GitHub PR traceability", "Validation evidence", "Enterprise production hardening"]
};
})(); } catch (e) { __ds_ns.__errors.push({ path: "workbench/data.js", error: String((e && e.message) || e) }); }

// workbench/icons.jsx
try { (() => {
/* ============================================================
   AI Delivery Workbench — Icon set
   Consistent 24-grid stroke glyphs (stroke 1.75, round caps),
   tuned to the clean/technical Cleanroom aesthetic. Authored
   in-house (no external icon CDN) so the prototype is fully
   offline and screen-shareable.
   Usage: <Icon name="git-pull-request" size={18} />
   ============================================================ */
const ICONS = {
  "layout-grid": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "7",
    height: "7",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "3",
    width: "7",
    height: "7",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "14",
    width: "7",
    height: "7",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "14",
    width: "7",
    height: "7",
    rx: "1.5"
  })),
  "file-text": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "14 2 14 8 20 8"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "13",
    x2: "16",
    y2: "13"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "17",
    x2: "16",
    y2: "17"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "9",
    x2: "10",
    y2: "9"
  })),
  "file-code": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "14 2 14 8 20 8"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "10 12 8 14.5 10 17"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "14 12 16 14.5 14 17"
  })),
  "git-pull-request": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "6",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "18",
    r: "3"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "9",
    x2: "6",
    y2: "15"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13 6h3a2 2 0 0 1 2 2v7"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "15.5 12.5 18 15 20.5 12.5"
  })),
  "shield-check": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "9 11.5 11 13.5 15 9.5"
  })),
  "flask": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M9 3h6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10 3v6.5L4.7 18.7A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.3-2.3L14 9.5V3"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "7.2",
    y1: "15",
    x2: "16.8",
    y2: "15"
  })),
  "network": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "9",
    y: "2",
    width: "6",
    height: "6",
    rx: "1.2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2",
    y: "16",
    width: "6",
    height: "6",
    rx: "1.2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "16",
    y: "16",
    width: "6",
    height: "6",
    rx: "1.2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M12 8v4M5 16v-2h14v2M12 12v2"
  })),
  "sliders": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "4",
    y1: "21",
    x2: "4",
    y2: "14"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "4",
    y1: "10",
    x2: "4",
    y2: "3"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "21",
    x2: "12",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12",
    y2: "3"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "20",
    y1: "21",
    x2: "20",
    y2: "16"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "20",
    y1: "12",
    x2: "20",
    y2: "3"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "1.5",
    y1: "14",
    x2: "6.5",
    y2: "14"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "9.5",
    y1: "8",
    x2: "14.5",
    y2: "8"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "17.5",
    y1: "16",
    x2: "22.5",
    y2: "16"
  })),
  "check": /*#__PURE__*/React.createElement("polyline", {
    points: "20 6 9 17 4 12"
  }),
  "x": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "18",
    y1: "6",
    x2: "6",
    y2: "18"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "6",
    x2: "18",
    y2: "18"
  })),
  "chevron-right": /*#__PURE__*/React.createElement("polyline", {
    points: "9 18 15 12 9 6"
  }),
  "chevron-down": /*#__PURE__*/React.createElement("polyline", {
    points: "6 9 12 15 18 9"
  }),
  "chevron-left": /*#__PURE__*/React.createElement("polyline", {
    points: "15 18 9 12 15 6"
  }),
  "chevrons-up-down": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polyline", {
    points: "7 15 12 20 17 15"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "7 9 12 4 17 9"
  })),
  "arrow-right": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "5",
    y1: "12",
    x2: "19",
    y2: "12"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "12 5 19 12 12 19"
  })),
  "arrow-up-right": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "7",
    y1: "17",
    x2: "17",
    y2: "7"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "8 7 17 7 17 16"
  })),
  "plus": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "5",
    x2: "12",
    y2: "19"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "5",
    y1: "12",
    x2: "19",
    y2: "12"
  })),
  "search": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "21",
    y1: "21",
    x2: "16.65",
    y2: "16.65"
  })),
  "filter": /*#__PURE__*/React.createElement("polygon", {
    points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"
  }),
  "clock": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "12 7 12 12 15.5 14"
  })),
  "calendar": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "18",
    height: "18",
    rx: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "3",
    y1: "9",
    x2: "21",
    y2: "9"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "8",
    y1: "2",
    x2: "8",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "16",
    y1: "2",
    x2: "16",
    y2: "6"
  })),
  "info": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "11",
    x2: "12",
    y2: "16"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12.01",
    y2: "8"
  })),
  "alert-triangle": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "9",
    x2: "12",
    y2: "13.5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "17",
    x2: "12.01",
    y2: "17"
  })),
  "alert-circle": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "8",
    x2: "12",
    y2: "12.5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "16",
    x2: "12.01",
    y2: "16"
  })),
  "check-circle": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M21.8 11.1V12a9.8 9.8 0 1 1-5.8-9"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "22 4.5 12 14.5 9 11.5"
  })),
  "x-circle": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "15",
    y1: "9",
    x2: "9",
    y2: "15"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "9",
    y1: "9",
    x2: "15",
    y2: "15"
  })),
  "circle": /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }),
  "circle-dot": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3",
    fill: "currentColor",
    stroke: "none"
  })),
  "circle-dashed": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M10.1 2.2a10 10 0 0 0-3.3 1.4M3.6 6.8a10 10 0 0 0-1.4 3.3M2.2 13.9a10 10 0 0 0 1.4 3.3M6.8 20.4a10 10 0 0 0 3.3 1.4M13.9 21.8a10 10 0 0 0 3.3-1.4M20.4 17.2a10 10 0 0 0 1.4-3.3M21.8 10.1a10 10 0 0 0-1.4-3.3M17.2 3.6a10 10 0 0 0-3.3-1.4"
  })),
  "play": /*#__PURE__*/React.createElement("polygon", {
    points: "6 4 20 12 6 20 6 4"
  }),
  "pause": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "6",
    y: "4.5",
    width: "3.5",
    height: "15",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14.5",
    y: "4.5",
    width: "3.5",
    height: "15",
    rx: "1"
  })),
  "rotate-ccw": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polyline", {
    points: "2 5 2 11 8 11"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4.05 15a8.5 8.5 0 1 0 2-8.8L2 11"
  })),
  "refresh-cw": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polyline", {
    points: "22 5 22 11 16 11"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "2 19 2 13 8 13"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4.1 9a8.5 8.5 0 0 1 14-3.2L22 11M2 13l3.9 5.2A8.5 8.5 0 0 0 19.9 15"
  })),
  "loader": /*#__PURE__*/React.createElement("path", {
    d: "M21 12a9 9 0 1 1-6.2-8.5"
  }),
  "ban": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "9"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "5.6",
    y1: "5.6",
    x2: "18.4",
    y2: "18.4"
  })),
  "database": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("ellipse", {
    cx: "12",
    cy: "5",
    rx: "8",
    ry: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"
  })),
  "server": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "2.5",
    y: "3",
    width: "19",
    height: "7",
    rx: "2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "2.5",
    y: "14",
    width: "19",
    height: "7",
    rx: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6.5",
    y1: "6.5",
    x2: "6.51",
    y2: "6.5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6.5",
    y1: "17.5",
    x2: "6.51",
    y2: "17.5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "10.5",
    y1: "6.5",
    x2: "17.5",
    y2: "6.5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "10.5",
    y1: "17.5",
    x2: "17.5",
    y2: "17.5"
  })),
  "git-branch": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "3",
    x2: "6",
    y2: "15"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "6",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "18",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 9a9 9 0 0 1-9 9"
  })),
  "git-commit": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3.5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "2",
    y1: "12",
    x2: "8.5",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "15.5",
    y1: "12",
    x2: "22",
    y2: "12"
  })),
  "git-merge": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "6",
    r: "3"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "6",
    cy: "18",
    r: "3"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "6",
    y1: "9",
    x2: "6",
    y2: "15"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "18",
    cy: "9",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M18 12a9 9 0 0 1-9 6"
  })),
  "shield": /*#__PURE__*/React.createElement("path", {
    d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
  }),
  "shield-alert": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "7.5",
    x2: "12",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "15",
    x2: "12.01",
    y2: "15"
  })),
  "lock": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "4",
    y: "11",
    width: "16",
    height: "10",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 11V7a4 4 0 0 1 8 0v4"
  })),
  "key": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "8",
    cy: "15",
    r: "5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M11.5 11.5 21 2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16.5 6.5l3 3"
  })),
  "eye": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  })),
  "sparkles": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 3l1.7 4.3L18 9l-4.3 1.7L12 15l-1.7-4.3L6 9l4.3-1.7L12 3Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 14l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8.8-2Z"
  })),
  "terminal": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("polyline", {
    points: "4 17 10 11 4 5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "19",
    x2: "20",
    y2: "19"
  })),
  "list-checks": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "10",
    y1: "6",
    x2: "20",
    y2: "6"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "10",
    y1: "12",
    x2: "20",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "10",
    y1: "18",
    x2: "20",
    y2: "18"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "3 6 4 7 6.5 4.5"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "3 12 4 13 6.5 10.5"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "3 18 4 19 6.5 16.5"
  })),
  "clipboard-check": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "8",
    y: "3",
    width: "8",
    height: "4",
    rx: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "9 14 11 16 15 12"
  })),
  "more-horizontal": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "5",
    cy: "12",
    r: "1.6",
    fill: "currentColor",
    stroke: "none"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "1.6",
    fill: "currentColor",
    stroke: "none"
  }), /*#__PURE__*/React.createElement("circle", {
    cx: "19",
    cy: "12",
    r: "1.6",
    fill: "currentColor",
    stroke: "none"
  })),
  "external-link": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "15 3 21 3 21 9"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "10",
    y1: "14",
    x2: "21",
    y2: "3"
  })),
  "download": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
  }), /*#__PURE__*/React.createElement("polyline", {
    points: "7 10 12 15 17 10"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "15",
    x2: "12",
    y2: "3"
  })),
  "copy": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "9",
    y: "9",
    width: "13",
    height: "13",
    rx: "2"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
  })),
  "user": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "8",
    r: "4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M6 21v-1a6 6 0 0 1 12 0v1"
  })),
  "users": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "9",
    cy: "8",
    r: "3.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 20v-1a6 6 0 0 1 12 0v1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M16.5 4.8a3.5 3.5 0 0 1 0 6.4"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M21 20v-1a6 6 0 0 0-4-5.6"
  })),
  "bell": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M13.5 21a1.5 1.5 0 0 1-3 0"
  })),
  "zap": /*#__PURE__*/React.createElement("polygon", {
    points: "13 2 3 14 12 14 11 22 21 10 12 10 13 2"
  }),
  "tag": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8Z"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "7",
    y1: "7",
    x2: "7.01",
    y2: "7"
  })),
  "hash": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "4",
    y1: "9",
    x2: "20",
    y2: "9"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "4",
    y1: "15",
    x2: "20",
    y2: "15"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "10",
    y1: "3",
    x2: "8",
    y2: "21"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "16",
    y1: "3",
    x2: "14",
    y2: "21"
  })),
  "folder": /*#__PURE__*/React.createElement("path", {
    d: "M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"
  }),
  "panel-right": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "18",
    height: "18",
    rx: "2"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "14.5",
    y1: "3",
    x2: "14.5",
    y2: "21"
  })),
  "dot": /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3.5",
    fill: "currentColor",
    stroke: "none"
  }),
  "menu": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("line", {
    x1: "4",
    y1: "7",
    x2: "20",
    y2: "7"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "4",
    y1: "12",
    x2: "20",
    y2: "12"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "4",
    y1: "17",
    x2: "20",
    y2: "17"
  })),
  "settings": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("circle", {
    cx: "12",
    cy: "12",
    r: "3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z"
  })),
  "link": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1.5 1.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1.5-1.5"
  })),
  "box": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M21 8 12 3 3 8v8l9 5 9-5Z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 8l9 5 9-5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "12",
    y1: "13",
    x2: "12",
    y2: "21"
  })),
  "scroll-text": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M8 3H4a2 2 0 0 0-2 2v3h6"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M19 17V5a2 2 0 0 0-2-2H7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M2 8v9a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-1H7v1a3 3 0 0 1-3 3"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "10",
    y1: "8",
    x2: "16",
    y2: "8"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "10",
    y1: "12",
    x2: "16",
    y2: "12"
  })),
  "cpu": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "5",
    y: "5",
    width: "14",
    height: "14",
    rx: "2"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "9",
    y: "9",
    width: "6",
    height: "6",
    rx: "1"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "9",
    y1: "2",
    x2: "9",
    y2: "5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "15",
    y1: "2",
    x2: "15",
    y2: "5"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "9",
    y1: "19",
    x2: "9",
    y2: "22"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "15",
    y1: "19",
    x2: "15",
    y2: "22"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "2",
    y1: "9",
    x2: "5",
    y2: "9"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "2",
    y1: "15",
    x2: "5",
    y2: "15"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "19",
    y1: "9",
    x2: "22",
    y2: "9"
  }), /*#__PURE__*/React.createElement("line", {
    x1: "19",
    y1: "15",
    x2: "22",
    y2: "15"
  })),
  "workflow": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "3",
    width: "7",
    height: "7",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "14",
    y: "14",
    width: "7",
    height: "7",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M10 6.5h4a2 2 0 0 1 2 2v5.5"
  })),
  "fingerprint": /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("path", {
    d: "M12 10a2 2 0 0 0-2 2c0 1.5.5 3 .5 3"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8.5 8.5A5 5 0 0 1 17 12c0 2-.5 3.5-.5 3.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M5.8 6.8A8 8 0 0 1 20 12c0 3-1 5-1 5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M7 16.5s1-1.5 1-4.5a4 4 0 0 1 8 0"
  }))
};
function Icon({
  name,
  size = 18,
  strokeWidth = 1.75,
  className = "",
  style
}) {
  const node = ICONS[name] || ICONS["dot"];
  return /*#__PURE__*/React.createElement("svg", {
    className: className,
    style: style,
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false"
  }, node);
}
Object.assign(window, {
  Icon
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "workbench/icons.jsx", error: String((e && e.message) || e) }); }

// workbench/primitives.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
/* ============================================================
   AI Delivery Workbench — UI primitives
   Reusable building blocks composed across all screens.
   ============================================================ */
const {
  Icon
} = window;
const _D = window.WBData;

/* ---------- Buttons ---------- */
function Btn({
  variant = "secondary",
  size,
  icon,
  iconRight,
  children,
  className = "",
  ...rest
}) {
  const cls = ["wb-btn", "wb-btn--" + variant, size ? "wb-btn--" + size : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls
  }, rest), icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: size === "sm" ? 14 : 16,
    className: "wb-ico"
  }), children, iconRight && /*#__PURE__*/React.createElement(Icon, {
    name: iconRight,
    size: size === "sm" ? 14 : 16,
    className: "wb-ico"
  }));
}
function IconBtn({
  icon,
  size,
  className = "",
  title,
  ...rest
}) {
  const cls = ["wb-btn", "wb-btn--secondary", "wb-btn--icon", size ? "wb-btn--" + size : "", className].filter(Boolean).join(" ");
  return /*#__PURE__*/React.createElement("button", _extends({
    className: cls,
    title: title,
    "aria-label": title
  }, rest), /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: size === "sm" ? 15 : 17
  }));
}

/* ---------- Badges ---------- */
function Badge({
  tone = "neutral",
  icon,
  dot,
  children,
  className = ""
}) {
  return /*#__PURE__*/React.createElement("span", {
    className: "wb-badge wb-badge--" + tone + " " + className
  }, dot && /*#__PURE__*/React.createElement("span", {
    className: "wb-badge-dot"
  }), icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 12
  }), children);
}
function StatusBadge({
  status,
  size = 12
}) {
  const m = _D.statusMap[status] || _D.statusMap.none;
  const running = status === "run";
  return /*#__PURE__*/React.createElement("span", {
    className: "wb-badge wb-badge--" + m.tone + (running ? " wb-badge--running" : "")
  }, /*#__PURE__*/React.createElement(Icon, {
    name: m.icon,
    size: size,
    className: running ? "wb-spin" : ""
  }), m.label);
}
function RiskBadge({
  risk
}) {
  const m = _D.riskMap[risk] || _D.riskMap.Low;
  return /*#__PURE__*/React.createElement(Badge, {
    tone: m.tone,
    icon: m.icon
  }, risk, " risk");
}
function LifecycleBadge({
  value
}) {
  const tone = _D.lifecycleTone[value] || "neutral";
  return /*#__PURE__*/React.createElement(Badge, {
    tone: tone,
    dot: true
  }, value);
}
function SurfaceBadge({
  value
}) {
  const icon = _D.surfaceIcon[value] || "box";
  return /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    icon: icon
  }, value);
}

/* ---------- Cards ---------- */
function Card({
  className = "",
  flat,
  children,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", _extends({
    className: "wb-card " + (flat ? "wb-card--flat " : "") + className
  }, rest), children);
}
function CardHead({
  icon,
  title,
  sub,
  actions
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-card-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "wb-card-title"
  }, icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 16,
    className: "wb-th-ico"
  }), title), sub && /*#__PURE__*/React.createElement("div", {
    className: "wb-card-sub",
    style: {
      marginTop: 2
    }
  }, sub)), actions && /*#__PURE__*/React.createElement("div", {
    className: "wb-spacer"
  }), actions);
}
function StatTile({
  label,
  icon,
  value,
  meta,
  metaTone
}) {
  return /*#__PURE__*/React.createElement(Card, {
    className: "wb-stat"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-stat-label"
  }, icon && /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 13
  }), label), /*#__PURE__*/React.createElement("div", {
    className: "wb-stat-value"
  }, value), meta && /*#__PURE__*/React.createElement("div", {
    className: "wb-stat-meta",
    style: metaTone ? {
      color: "var(--" + metaTone + ")"
    } : null
  }, meta));
}

/* ---------- Form controls ---------- */
function Field({
  label,
  hint,
  children
}) {
  return /*#__PURE__*/React.createElement("label", {
    className: "wb-field"
  }, label && /*#__PURE__*/React.createElement("span", {
    className: "wb-label"
  }, label, hint && /*#__PURE__*/React.createElement("span", {
    className: "wb-label-hint"
  }, hint)), children);
}
function Input(props) {
  return /*#__PURE__*/React.createElement("input", _extends({
    className: "wb-input " + (props.mono ? "wb-input--mono " : "")
  }, props));
}
function SelectField({
  value,
  onChange,
  options,
  ...rest
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-select"
  }, /*#__PURE__*/React.createElement("select", _extends({
    value: value,
    onChange: onChange
  }, rest), options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o,
    value: o
  }, o))), /*#__PURE__*/React.createElement(Icon, {
    name: "chevrons-up-down",
    size: 15,
    className: "wb-select-ico"
  }));
}
function Toggle({
  on,
  onClick,
  disabled,
  label
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-toggle" + (on ? " is-on" : "") + (disabled ? " is-disabled" : ""),
    onClick: disabled ? null : onClick,
    role: "switch",
    "aria-checked": !!on
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-toggle-track"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-toggle-knob"
  })), label && /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13
    }
  }, label));
}
function Check({
  on,
  onClick,
  label,
  sub,
  disabled
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-check" + (on ? " is-on" : ""),
    onClick: disabled ? null : onClick,
    style: disabled ? {
      opacity: 0.55,
      cursor: "not-allowed"
    } : null
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-check-box"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 13,
    strokeWidth: 2.5
  })), /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", {
    className: "wb-check-label"
  }, label), sub && /*#__PURE__*/React.createElement("span", {
    className: "wb-check-sub",
    style: {
      display: "block"
    }
  }, sub)));
}

/* ---------- Tabs ---------- */
function Tabs({
  tabs,
  active,
  onChange
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-tabs"
  }, tabs.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    className: "wb-tab" + (active === t.id ? " is-active" : ""),
    onClick: () => onChange(t.id)
  }, t.icon && /*#__PURE__*/React.createElement(Icon, {
    name: t.icon,
    size: 15
  }), t.label, t.count != null && /*#__PURE__*/React.createElement("span", {
    className: "wb-tab-count"
  }, t.count))));
}

/* ---------- Misc ---------- */
function Avatar({
  name,
  sm
}) {
  const initials = name && name !== "—" ? name.split(/[ .]/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join("") : "—";
  return /*#__PURE__*/React.createElement("span", {
    className: "wb-avatar" + (sm ? " wb-avatar--sm" : "")
  }, initials);
}
function Banner({
  tone = "info",
  icon,
  title,
  children
}) {
  const defIcon = {
    info: "info",
    warn: "alert-triangle",
    safe: "check-circle",
    danger: "alert-circle",
    neutral: "info"
  }[tone];
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-banner wb-banner--" + tone
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon || defIcon,
    size: 17,
    className: "wb-banner-ico"
  }), /*#__PURE__*/React.createElement("div", null, title && /*#__PURE__*/React.createElement("div", {
    className: "wb-banner-title"
  }, title), /*#__PURE__*/React.createElement("div", {
    className: "wb-secondary",
    style: {
      color: "inherit"
    }
  }, children)));
}
function Kv({
  rows
}) {
  return /*#__PURE__*/React.createElement("dl", {
    className: "wb-kv"
  }, rows.map(([k, v], i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, /*#__PURE__*/React.createElement("dt", null, k), /*#__PURE__*/React.createElement("dd", null, v))));
}
function Progress({
  value,
  tone
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-progress"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-progress-bar" + (tone ? " wb-progress-bar--" + tone : ""),
    style: {
      width: Math.max(0, Math.min(100, value)) + "%"
    }
  }));
}
function EmptyState({
  icon = "folder",
  title,
  children,
  action
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-empty"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-empty-ico"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 22
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontWeight: 600,
      color: "var(--text-secondary)",
      fontSize: 14
    }
  }, title), children && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 6,
      fontSize: 13,
      maxWidth: 380,
      margin: "6px auto 0"
    }
  }, children), action && /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 16
    }
  }, action));
}

/* ---------- Artifact renderers ---------- */
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function highlightJSON(src) {
  let s = escapeHtml(src);
  s = s.replace(/("(?:\\.|[^"\\])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g, m => {
    let cls = "tok-num";
    if (/^"/.test(m)) cls = /:\s*$/.test(m) ? "tok-key" : "tok-str";else if (/true|false|null/.test(m)) cls = "tok-kw";
    return '<span class="' + cls + '">' + m + "</span>";
  });
  return s;
}
function CodeView({
  name,
  lang,
  body
}) {
  if (lang === "json") {
    return /*#__PURE__*/React.createElement("div", {
      className: "wb-code-body",
      dangerouslySetInnerHTML: {
        __html: highlightJSON(body)
      }
    });
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-code-body"
  }, body);
}

// minimal inline markdown -> react nodes
function inlineMd(text, keyBase) {
  const nodes = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0,
    m,
    i = 0;
  while (m = re.exec(text)) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) nodes.push(/*#__PURE__*/React.createElement("strong", {
      key: keyBase + "-" + i++
    }, tok.slice(2, -2)));else nodes.push(/*#__PURE__*/React.createElement("code", {
      key: keyBase + "-" + i++
    }, tok.slice(1, -1)));
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
function MarkdownView({
  body
}) {
  const lines = body.split("\n");
  const out = [];
  let i = 0,
    key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^#\s/.test(line)) {
      out.push(/*#__PURE__*/React.createElement("h1", {
        key: key++
      }, inlineMd(line.slice(2), "h" + key)));
      i++;
      continue;
    }
    if (/^##\s/.test(line)) {
      out.push(/*#__PURE__*/React.createElement("h2", {
        key: key++
      }, inlineMd(line.slice(3), "h" + key)));
      i++;
      continue;
    }
    if (/^###\s/.test(line)) {
      out.push(/*#__PURE__*/React.createElement("h2", {
        key: key++,
        style: {
          fontSize: 13.5
        }
      }, inlineMd(line.slice(4), "h" + key)));
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push(/*#__PURE__*/React.createElement("hr", {
        key: key++
      }));
      i++;
      continue;
    }
    if (/^>\s/.test(line)) {
      out.push(/*#__PURE__*/React.createElement("div", {
        key: key++,
        className: "wb-banner wb-banner--neutral",
        style: {
          marginBottom: 10
        }
      }, /*#__PURE__*/React.createElement(Icon, {
        name: "info",
        size: 15,
        className: "wb-banner-ico"
      }), /*#__PURE__*/React.createElement("div", null, inlineMd(line.slice(2), "q" + key))));
      i++;
      continue;
    }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        rows.push(lines[i]);
        i++;
      }
      const cells = r => r.split("|").slice(1, -1).map(c => c.trim());
      const header = cells(rows[0]);
      const bodyRows = rows.slice(2).map(cells);
      out.push(/*#__PURE__*/React.createElement("div", {
        key: key++,
        className: "wb-table-wrap",
        style: {
          margin: "4px 0 14px",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)"
        }
      }, /*#__PURE__*/React.createElement("table", {
        className: "wb-table"
      }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, header.map((h, x) => /*#__PURE__*/React.createElement("th", {
        key: x
      }, h)))), /*#__PURE__*/React.createElement("tbody", null, bodyRows.map((r, y) => /*#__PURE__*/React.createElement("tr", {
        key: y,
        style: {
          cursor: "default"
        }
      }, r.map((c, x) => /*#__PURE__*/React.createElement("td", {
        key: x
      }, inlineMd(c, "c" + y + x)))))))));
      continue;
    }
    if (/^[-*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) {
        items.push(lines[i].slice(2));
        i++;
      }
      out.push(/*#__PURE__*/React.createElement("ul", {
        key: key++
      }, items.map((it, x) => /*#__PURE__*/React.createElement("li", {
        key: x
      }, inlineMd(it, "li" + key + x)))));
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    // paragraph (gather until blank)
    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^[#>|\-*]/.test(lines[i])) {
      para.push(lines[i]);
      i++;
    }
    out.push(/*#__PURE__*/React.createElement("p", {
      key: key++
    }, inlineMd(para.join(" "), "p" + key)));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-md"
  }, out);
}
Object.assign(window, {
  Btn,
  IconBtn,
  Badge,
  StatusBadge,
  RiskBadge,
  LifecycleBadge,
  SurfaceBadge,
  Card,
  CardHead,
  StatTile,
  Field,
  Input,
  SelectField,
  Toggle,
  Check,
  Tabs,
  Avatar,
  Banner,
  Kv,
  Progress,
  EmptyState,
  CodeView,
  MarkdownView
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "workbench/primitives.jsx", error: String((e && e.message) || e) }); }

// workbench/screen-architecture.jsx
try { (() => {
/* ============================================================
   AI Delivery Workbench — Screen: Architecture
   An executive/technical explanation of the production design:
   control / execution / context / validation planes.
   ============================================================ */
function PlaneCard({
  plane
}) {
  return /*#__PURE__*/React.createElement(Card, {
    style: {
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: 3,
      background: "var(--" + plane.tone + ")"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 11
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 38,
      height: 38,
      borderRadius: "var(--radius-md)",
      background: "var(--" + plane.tone + "-soft, var(--bg-inset))",
      color: "var(--" + plane.tone + ")",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: plane.icon,
    size: 20
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 15,
      fontWeight: 700
    }
  }, plane.name), /*#__PURE__*/React.createElement("div", {
    className: "wb-text-sm wb-muted",
    style: {
      marginTop: 1
    }
  }, plane.tagline))), /*#__PURE__*/React.createElement("div", {
    className: "wb-mt-16",
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "7px 14px"
    }
  }, plane.items.map(it => /*#__PURE__*/React.createElement("div", {
    key: it,
    className: "wb-flex",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 5,
      height: 5,
      borderRadius: "50%",
      background: "var(--" + plane.tone + ")",
      flex: "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, it))))));
}
function ArchitectureScreen() {
  const arch = window.WBData.architecture;
  const flow = [{
    label: "Suggestion",
    icon: "sparkles",
    desc: "AI proposes — never decides"
  }, {
    label: "Implementation",
    icon: "git-branch",
    desc: "Drafted on a branch"
  }, {
    label: "Review",
    icon: "shield-check",
    desc: "Human gate + checks"
  }, {
    label: "Release",
    icon: "git-merge",
    desc: "Controlled, traceable"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-page wb-page-wide"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow wb-mb-8"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "network",
    size: 13
  }), " How I'd productionize it"), /*#__PURE__*/React.createElement("div", {
    className: "wb-page-title"
  }, "Architecture"), /*#__PURE__*/React.createElement("div", {
    className: "wb-page-desc"
  }, "A governed AI delivery system separates planes of responsibility so acceleration never erodes control. Suggestion, implementation, review, and release stay distinct \u2014 with deterministic artifacts and human gates between them."))), /*#__PURE__*/React.createElement(Card, {
    className: "wb-mb-16"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: 0,
      alignItems: "stretch"
    }
  }, flow.map((f, i) => /*#__PURE__*/React.createElement("div", {
    key: f.label,
    className: "wb-flex",
    style: {
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: "var(--radius-md)",
      background: "var(--accent-soft)",
      color: "var(--accent)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: f.icon,
    size: 17
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "wb-strong",
    style: {
      fontSize: 13.5
    }
  }, f.label), /*#__PURE__*/React.createElement("div", {
    className: "wb-muted",
    style: {
      fontSize: 11.5
    }
  }, f.desc)))), i < flow.length - 1 && /*#__PURE__*/React.createElement("span", {
    style: {
      alignSelf: "center",
      color: "var(--border-strong)",
      paddingRight: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 18
  }))))))), /*#__PURE__*/React.createElement("div", {
    className: "wb-grid wb-grid-2 wb-mb-16"
  }, arch.planes.map(p => /*#__PURE__*/React.createElement(PlaneCard, {
    key: p.id,
    plane: p
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1.5fr) minmax(0,1fr)",
      gap: 16,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement(Banner, {
    tone: "warn",
    title: "Production hardening",
    icon: "lock"
  }, arch.productionNote), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "cpu",
    title: "Principal-level discussion"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-flex wb-wrap",
    style: {
      gap: 7
    }
  }, arch.principalTopics.map(t => /*#__PURE__*/React.createElement("span", {
    key: t,
    className: "wb-badge wb-badge--neutral",
    style: {
      fontFamily: "var(--font-sans)",
      fontSize: 12
    }
  }, t)))))), /*#__PURE__*/React.createElement("div", {
    className: "wb-mt-16"
  }), /*#__PURE__*/React.createElement(Banner, {
    tone: "neutral",
    icon: "shield"
  }, "Clean-room note: this architecture is illustrative and synthetic. It uses no previous-employer systems, code, or internal designs \u2014 only public-domain enterprise finance-software concepts."));
}
Object.assign(window, {
  ArchitectureScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "workbench/screen-architecture.jsx", error: String((e && e.message) || e) }); }

// workbench/screen-artifacts.jsx
try { (() => {
/* ============================================================
   AI Delivery Workbench — Screen: Artifacts (split-pane review)
   ============================================================ */
const {
  useState: useStateAR,
  useEffect: useEffectAR
} = React;
const REVIEW_TONE = {
  "Approved": "safe",
  "Review required": "warn",
  "Pending": "warn",
  "Auto-recorded": "neutral",
  "Recorded": "neutral",
  "Changes requested": "danger"
};
function ArtifactsScreen() {
  const {
    state,
    actions
  } = useApp();
  const issue = state.issues[state.selectedKey];
  const artifacts = window.WBData.artifactsFor(issue);
  const selName = state.selectedArtifact[issue.key];
  const selected = artifacts.find(a => a.name === selName) || artifacts[0];
  const [reviews, setReviews] = useStateAR({}); // id -> "Approved"|"Changes requested"

  useEffectAR(() => {
    if (selected && selName !== selected.name) actions.selectArtifact(issue.key, selected.name);
  }, [issue.key]); // eslint-disable-line

  if (!artifacts.length) {
    return /*#__PURE__*/React.createElement("div", {
      className: "wb-page wb-page-wide"
    }, /*#__PURE__*/React.createElement(ArtifactsHead, {
      issue: issue
    }), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(EmptyState, {
      icon: "file-code",
      title: "No artifacts generated yet",
      action: /*#__PURE__*/React.createElement(Btn, {
        variant: "primary",
        icon: "arrow-right",
        onClick: () => actions.openIssue(issue.key)
      }, "Open issue workflow")
    }, "Run the AI delivery workflow on this issue to generate intake, spec, plan, change targets, and evidence artifacts.")));
  }
  const reviewState = a => reviews[a.id] || a.reviewStatus;
  const approve = () => {
    setReviews(r => ({
      ...r,
      [selected.id]: "Approved"
    }));
    actions.toast("success", "Artifact approved", selected.name + " marked approved (simulated).");
  };
  const requestChanges = () => {
    setReviews(r => ({
      ...r,
      [selected.id]: "Changes requested"
    }));
    actions.toast("warn", "Changes requested", "Reviewer decision recorded for " + selected.name + ".");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-page wb-page-wide"
  }, /*#__PURE__*/React.createElement(ArtifactsHead, {
    issue: issue
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "300px minmax(0,1fr)",
      gap: 16,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    className: "wb-card--flat",
    style: {
      overflow: "hidden",
      position: "sticky",
      top: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-card-head",
    style: {
      padding: "12px 14px"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-card-title",
    style: {
      fontSize: 13
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "folder",
    size: 15,
    className: "wb-th-ico"
  }), artifacts.length, " artifacts")), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body--tight"
  }, artifacts.map(a => {
    const isSel = selected && a.id === selected.id;
    const rs = reviewState(a);
    return /*#__PURE__*/React.createElement("div", {
      key: a.id,
      onClick: () => actions.selectArtifact(issue.key, a.name),
      style: {
        display: "flex",
        gap: 10,
        padding: "11px 14px",
        cursor: "pointer",
        borderBottom: "1px solid var(--border-subtle)",
        background: isSel ? "var(--accent-soft)" : "transparent",
        borderLeft: "2px solid " + (isSel ? "var(--accent)" : "transparent")
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: a.type === "JSON" ? "file-code" : "file-text",
      size: 16,
      style: {
        color: isSel ? "var(--accent)" : "var(--text-tertiary)",
        marginTop: 1,
        flex: "none"
      }
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        minWidth: 0,
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "wb-mono",
      style: {
        fontSize: 12.5,
        fontWeight: 600,
        color: isSel ? "var(--accent-text)" : "var(--text-primary)",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, a.name), /*#__PURE__*/React.createElement("div", {
      className: "wb-flex",
      style: {
        gap: 6,
        marginTop: 4
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "wb-muted",
      style: {
        fontSize: 10.5
      }
    }, a.stage), /*#__PURE__*/React.createElement("span", {
      className: "wb-badge-dot",
      style: {
        width: 5,
        height: 5,
        borderRadius: "50%",
        background: "var(--" + (REVIEW_TONE[rs] === "safe" ? "safe" : REVIEW_TONE[rs] === "danger" ? "danger" : REVIEW_TONE[rs] === "warn" ? "warn" : "border-strong") + ")"
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "wb-muted",
      style: {
        fontSize: 10.5
      }
    }, rs))));
  }))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1fr) 240px",
      gap: 16,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement(Card, {
    className: "wb-card--flat",
    style: {
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-code-head",
    style: {
      position: "static",
      borderRadius: 0
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: selected.type === "JSON" ? "file-code" : "file-text",
    size: 15,
    className: "wb-muted"
  }), /*#__PURE__*/React.createElement("span", {
    className: "wb-code-name wb-strong"
  }, selected.name), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral"
  }, selected.type), /*#__PURE__*/React.createElement("div", {
    className: "wb-spacer",
    style: {
      marginLeft: "auto"
    }
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: "copy",
    size: "sm",
    title: "Copy (simulated)",
    onClick: () => actions.toast("info", "Copied to clipboard", selected.name + " (simulated).")
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: "download",
    size: "sm",
    title: "Download (simulated)",
    onClick: () => actions.toast("info", "Download started", selected.name + " (simulated)."),
    style: {
      marginLeft: 6
    }
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      maxHeight: "calc(100vh - 220px)",
      overflow: "auto"
    },
    className: "cr-scroll"
  }, selected.lang === "json" ? /*#__PURE__*/React.createElement("div", {
    className: "wb-code",
    style: {
      border: "none",
      borderRadius: 0,
      background: "var(--bg-inset)"
    }
  }, /*#__PURE__*/React.createElement(CodeView, {
    name: selected.name,
    lang: "json",
    body: selected.body
  })) : /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "18px 22px"
    }
  }, /*#__PURE__*/React.createElement(MarkdownView, {
    body: selected.body
  })))), /*#__PURE__*/React.createElement("div", {
    className: "wb-stack",
    style: {
      position: "sticky",
      top: 0
    }
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "info",
    title: "Metadata"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, /*#__PURE__*/React.createElement(Kv, {
    rows: [["Type", selected.type], ["Stage", selected.stage], ["Generated", /*#__PURE__*/React.createElement("span", {
      className: "wb-mono wb-text-sm"
    }, selected.timestamp)], ["Risk", /*#__PURE__*/React.createElement(RiskBadge, {
      risk: selected.risk
    })]]
  }))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "user",
    title: "Reviewer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-stack-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, "Status"), /*#__PURE__*/React.createElement(Badge, {
    tone: REVIEW_TONE[reviewState(selected)] || "neutral",
    icon: reviewState(selected) === "Approved" ? "check" : reviewState(selected) === "Changes requested" ? "x" : "clock"
  }, reviewState(selected))), /*#__PURE__*/React.createElement("p", {
    className: "wb-text-sm wb-muted",
    style: {
      lineHeight: 1.5
    }
  }, selected.name === "change-targets.json" ? "Verify the file allow-list matches the diff before approving." : "Deterministic artifact — review for correctness and scope."), /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "primary",
    icon: "check",
    className: "wb-btn--block",
    onClick: approve
  }, "Approve artifact"), /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "secondary",
    icon: "rotate-ccw",
    className: "wb-btn--block",
    onClick: requestChanges
  }, "Request changes")))))));
}
function ArtifactsHead({
  issue
}) {
  const {
    actions,
    state
  } = useApp();
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow wb-mb-8"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "file-code",
    size: 13
  }), " Reviewable AI output"), /*#__PURE__*/React.createElement("div", {
    className: "wb-page-title"
  }, "Artifacts"), /*#__PURE__*/React.createElement("div", {
    className: "wb-page-desc"
  }, "Every stage emits a deterministic artifact \u2014 this is how AI output becomes reviewable, traceable, and auditable instead of an opaque suggestion.")), /*#__PURE__*/React.createElement("div", {
    className: "wb-spacer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-muted"
  }, "Issue"), /*#__PURE__*/React.createElement("div", {
    className: "wb-select",
    style: {
      width: 230
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: issue.key,
    onChange: e => actions.navigate("artifacts", e.target.value)
  }, window.WBData.issues.map(i => /*#__PURE__*/React.createElement("option", {
    key: i.key,
    value: i.key
  }, i.key, " \xB7 ", i.title))), /*#__PURE__*/React.createElement(Icon, {
    name: "chevrons-up-down",
    size: 15,
    className: "wb-select-ico"
  }))));
}
Object.assign(window, {
  ArtifactsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "workbench/screen-artifacts.jsx", error: String((e && e.message) || e) }); }

// workbench/screen-github.jsx
try { (() => {
/* ============================================================
   AI Delivery Workbench — Screen: GitHub / PR readiness
   ============================================================ */
const CHECK_VIS = {
  pass: {
    tone: "safe",
    icon: "check-circle",
    label: "Passed"
  },
  fail: {
    tone: "danger",
    icon: "x-circle",
    label: "Failed"
  },
  pending: {
    tone: "warn",
    icon: "clock",
    label: "Pending"
  },
  required: {
    tone: "warn",
    icon: "alert-triangle",
    label: "Required"
  }
};
const CAT_ICON = {
  "Angular UI": "box",
  "C#/.NET API": "cpu",
  "Oracle SQL": "database",
  "Tests": "flask",
  "Documentation / evidence": "file-text"
};
function GitHubScreen() {
  const {
    state,
    actions
  } = useApp();
  const issue = state.issues[state.selectedKey];
  const base = window.WBData.prFor(issue);
  const ov = state.prState[issue.key] || {};
  const hasPR = !!issue.pr;
  const createMockPR = () => {
    actions.patchIssue(issue.key, {
      pr: 284,
      prStatus: "Draft",
      flags: {
        hasPR: true
      }
    });
    actions.toast("success", "Mock PR created", "PR #284 opened on " + issue.branch + " (simulated).");
  };
  const refresh = () => actions.toast("info", "PR status refreshed", "Checks re-read from the simulated provider.");
  const markReviewed = () => {
    actions.setPR(issue.key, {
      diffReviewed: true,
      checklistAll: true
    });
    actions.toast("success", "Diff marked reviewed", "Changed-file review recorded against PR #" + base.number + ".");
  };
  const requestChanges = () => {
    actions.setPR(issue.key, {
      status: "Changes requested",
      reviewer: "changes"
    });
    actions.patchIssue(issue.key, {
      prStatus: "Changes requested"
    });
    actions.toast("warn", "Changes requested", "Reviewer decision recorded — author notified (simulated).");
  };
  const approveForValidation = () => {
    if (!ov.diffReviewed) {
      actions.toast("warn", "Review the diff first", "Mark the changed-file diff reviewed before approving for validation.");
      return;
    }
    actions.setPR(issue.key, {
      status: "Approved — validation",
      reviewer: "approved",
      approvedForValidation: true
    });
    actions.patchIssue(issue.key, {
      prStatus: "Ready for review"
    });
    actions.toast("success", "Approved for validation", "Human review gate met. Routing to validation evidence.");
    setTimeout(() => actions.navigate("validation", issue.key), 700);
  };
  if (!hasPR) {
    return /*#__PURE__*/React.createElement("div", {
      className: "wb-page wb-page-wide"
    }, /*#__PURE__*/React.createElement(GitHubHead, {
      issue: issue
    }), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(EmptyState, {
      icon: "git-pull-request",
      title: "No pull request yet",
      action: /*#__PURE__*/React.createElement(Btn, {
        variant: "primary",
        icon: "plus",
        onClick: createMockPR
      }, "Create mock PR")
    }, "This issue hasn't reached a pull request. Run the workflow through ", /*#__PURE__*/React.createElement("strong", null, "Implement"), ", then create a mock PR to start the human review gate. PRs keep AI-assisted changes inside normal engineering controls.")));
  }
  const status = ov.status || base.status;
  const reviewerState = ov.reviewer || "pending";
  const checklist = base.checklist.map(c => ({
    ...c,
    done: ov.checklistAll ? true : c.done
  }));
  const checksOpen = base.checks.filter(c => c.status !== "pass").length;
  const groups = {};
  base.files.forEach(f => {
    (groups[f.category] = groups[f.category] || []).push(f);
  });
  const reviewMet = reviewerState === "approved";
  const validationMet = false; // final validation gate intentionally still required

  const gates = [{
    label: "Required checks",
    met: checksOpen === 0,
    detail: checksOpen === 0 ? "all passed" : checksOpen + " open"
  }, {
    label: "Changed-file review",
    met: !!ov.diffReviewed,
    detail: ov.diffReviewed ? "reviewed" : "not reviewed"
  }, {
    label: "Human review gate",
    met: reviewMet,
    detail: reviewMet ? "approved" : "pending"
  }, {
    label: "Final validation",
    met: validationMet,
    detail: "required before merge"
  }];
  const mergeReady = gates.every(g => g.met);
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-page wb-page-wide"
  }, /*#__PURE__*/React.createElement(GitHubHead, {
    issue: issue
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1.7fr) minmax(0,1fr)",
      gap: 16,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-stack"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-between wb-wrap",
    style: {
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-row-key",
    style: {
      fontSize: 14
    }
  }, "PR #", base.number), /*#__PURE__*/React.createElement(Badge, {
    tone: status.startsWith("Approved") ? "safe" : status === "Changes requested" ? "danger" : status === "Draft" ? "neutral" : "accent",
    dot: true
  }, status)), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      marginTop: 6
    }
  }, base.title), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex wb-wrap wb-mt-8",
    style: {
      gap: 14,
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-mono wb-muted"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "git-branch",
    size: 12
  }), " ", base.branch), /*#__PURE__*/React.createElement("span", {
    className: "wb-muted"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "arrow-right",
    size: 12
  }), " ", /*#__PURE__*/React.createElement("span", {
    className: "wb-mono"
  }, base.target)), /*#__PURE__*/React.createElement("span", {
    className: "wb-muted"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "git-commit",
    size: 12
  }), " ", base.commits, " commits"), /*#__PURE__*/React.createElement("span", {
    className: "wb-muted"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "user",
    size: 12
  }), " ", base.author), /*#__PURE__*/React.createElement("span", {
    className: "wb-muted"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 12
  }), " ", base.created)))), /*#__PURE__*/React.createElement("hr", {
    className: "wb-divider"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex wb-wrap",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "secondary",
    icon: "refresh-cw",
    onClick: refresh
  }, "Refresh PR status"), /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: ov.diffReviewed ? "secondary" : "primary",
    icon: ov.diffReviewed ? "check" : "eye",
    onClick: markReviewed,
    disabled: ov.diffReviewed
  }, ov.diffReviewed ? "Diff reviewed" : "Mark diff reviewed"), /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "danger",
    icon: "rotate-ccw",
    onClick: requestChanges
  }, "Request changes"), /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "primary",
    icon: "shield-check",
    onClick: approveForValidation
  }, "Approve for validation")))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "sparkles",
    title: "AI-generated PR summary",
    actions: /*#__PURE__*/React.createElement(Badge, {
      tone: "accent",
      icon: "sparkles"
    }, "Draft")
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, /*#__PURE__*/React.createElement("p", {
    className: "wb-secondary",
    style: {
      fontSize: 13.5,
      lineHeight: 1.6
    }
  }, base.summary), /*#__PURE__*/React.createElement(Banner, {
    tone: "neutral",
    icon: "info"
  }, "Generated from the issue's spec, plan, and change-targets artifacts. A human edits and owns the final description."))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "file-code",
    title: "Changed files",
    sub: base.files.length + " files across " + Object.keys(groups).length + " categories",
    actions: base.unexpected > 0 ? /*#__PURE__*/React.createElement(Badge, {
      tone: "warn",
      icon: "alert-triangle"
    }, base.unexpected, " unexpected") : /*#__PURE__*/React.createElement(Badge, {
      tone: "safe",
      icon: "check"
    }, "All expected")
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-card-body--tight"
  }, base.unexpected > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "12px 16px"
    }
  }, /*#__PURE__*/React.createElement(Banner, {
    tone: "warn",
    title: "Unexpected change detected"
  }, "A file outside the change-targets allow-list is present. Confirm it belongs before approving \u2014 this is how scope creep stays visible.")), Object.entries(groups).map(([cat, files], gi) => /*#__PURE__*/React.createElement("div", {
    key: cat
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 8,
      padding: "9px 16px",
      background: "var(--bg-surface-2)",
      borderTop: gi ? "1px solid var(--border-subtle)" : "none",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: CAT_ICON[cat] || "file-code",
    size: 14,
    className: "wb-muted"
  }), /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-strong"
  }, cat), /*#__PURE__*/React.createElement("span", {
    className: "wb-muted",
    style: {
      fontSize: 11
    }
  }, files.length)), files.map(f => /*#__PURE__*/React.createElement("div", {
    key: f.path,
    className: "wb-flex",
    style: {
      gap: 10,
      padding: "9px 16px",
      borderBottom: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: f.status === "unexpected" ? "alert-triangle" : "file-code",
    size: 14,
    style: {
      color: f.status === "unexpected" ? "var(--warn)" : "var(--text-tertiary)",
      flex: "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "wb-mono",
    style: {
      fontSize: 11.5,
      flex: 1,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap"
    }
  }, f.path), /*#__PURE__*/React.createElement("span", {
    className: "wb-mono",
    style: {
      fontSize: 11,
      color: "var(--safe)"
    }
  }, "+", f.add), /*#__PURE__*/React.createElement("span", {
    className: "wb-mono",
    style: {
      fontSize: 11,
      color: "var(--danger)"
    }
  }, "\u2212", f.del), f.status === "unexpected" && /*#__PURE__*/React.createElement(Badge, {
    tone: "warn"
  }, "unexpected"))))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "list-checks",
    title: "Required checks",
    actions: /*#__PURE__*/React.createElement(Badge, {
      tone: checksOpen === 0 ? "safe" : "warn"
    }, base.checks.filter(c => c.status === "pass").length, "/", base.checks.length, " green")
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-card-body--tight"
  }, base.checks.map((c, i) => {
    const v = CHECK_VIS[c.status];
    return /*#__PURE__*/React.createElement("div", {
      key: c.name,
      className: "wb-flex",
      style: {
        gap: 11,
        padding: "11px 16px",
        borderBottom: i < base.checks.length - 1 ? "1px solid var(--border-subtle)" : "none"
      }
    }, /*#__PURE__*/React.createElement(Icon, {
      name: v.icon,
      size: 16,
      style: {
        color: "var(--" + v.tone + ")",
        flex: "none"
      }
    }), /*#__PURE__*/React.createElement("span", {
      className: "wb-text-sm wb-strong",
      style: {
        flex: 1
      }
    }, c.name), /*#__PURE__*/React.createElement("span", {
      className: "wb-muted",
      style: {
        fontSize: 12
      }
    }, c.detail), /*#__PURE__*/React.createElement(Badge, {
      tone: v.tone
    }, v.label));
  })))), /*#__PURE__*/React.createElement("div", {
    className: "wb-stack"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "git-merge",
    title: "Merge readiness"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-banner wb-banner--" + (mergeReady ? "safe" : "warn"),
    style: {
      marginBottom: 14
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: mergeReady ? "check-circle" : "lock",
    size: 17,
    className: "wb-banner-ico"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "wb-banner-title"
  }, mergeReady ? "Ready for merge" : "Blocked — gates open"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2
    }
  }, mergeReady ? "All governance gates satisfied." : "Merge is held until every gate below is met."))), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex-col",
    style: {
      gap: 10
    }
  }, gates.map(g => /*#__PURE__*/React.createElement("div", {
    key: g.label,
    className: "wb-flex",
    style: {
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: g.met ? "check-circle" : "circle",
    size: 16,
    style: {
      color: g.met ? "var(--safe)" : "var(--text-tertiary)",
      flex: "none"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm",
    style: {
      flex: 1
    }
  }, g.label), /*#__PURE__*/React.createElement("span", {
    className: "wb-muted",
    style: {
      fontSize: 11.5
    }
  }, g.detail)))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "list-checks",
    title: "Human reviewer checklist"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-card-body--tight"
  }, checklist.map((c, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "11px 16px",
      borderBottom: i < checklist.length - 1 ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement(Check, {
    on: c.done,
    label: c.label,
    onClick: () => actions.setPR(issue.key, {
      checklistAll: true
    })
  })))), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-foot"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14,
    className: "wb-muted"
  }), /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-muted"
  }, "Checklist is enforced before the review gate can pass."))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "users",
    title: "Reviewers",
    actions: /*#__PURE__*/React.createElement(Badge, {
      tone: "warn"
    }, base.unresolvedComments, " unresolved")
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-flex-col",
    style: {
      gap: 12
    }
  }, base.reviewers.map(r => {
    const st = r === base.reviewers[0] && reviewerState !== "pending" ? reviewerState : r.state;
    const tone = st === "approved" ? "safe" : st === "changes" ? "danger" : "neutral";
    return /*#__PURE__*/React.createElement("div", {
      key: r.name,
      className: "wb-flex",
      style: {
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Avatar, {
      name: r.name,
      sm: true
    }), /*#__PURE__*/React.createElement("div", {
      style: {
        flex: 1
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "wb-text-sm wb-strong"
    }, r.name), /*#__PURE__*/React.createElement("div", {
      className: "wb-muted",
      style: {
        fontSize: 11.5
      }
    }, r.role)), /*#__PURE__*/React.createElement(Badge, {
      tone: tone,
      icon: st === "approved" ? "check" : st === "changes" ? "x" : "clock"
    }, st === "approved" ? "Approved" : st === "changes" ? "Changes" : "Pending"));
  }))))));
}
function GitHubHead({
  issue
}) {
  const {
    actions
  } = useApp();
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow wb-mb-8"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "git-pull-request",
    size: 13
  }), " Normal engineering controls"), /*#__PURE__*/React.createElement("div", {
    className: "wb-page-title"
  }, "GitHub / PR readiness"), /*#__PURE__*/React.createElement("div", {
    className: "wb-page-desc"
  }, "AI-assisted changes flow through an ordinary pull request \u2014 diff review, required checks, and a human gate \u2014 so acceleration never bypasses control.")), /*#__PURE__*/React.createElement("div", {
    className: "wb-spacer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-muted"
  }, "Issue"), /*#__PURE__*/React.createElement("div", {
    className: "wb-select",
    style: {
      width: 230
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: issue.key,
    onChange: e => actions.navigate("github", e.target.value)
  }, window.WBData.issues.map(i => /*#__PURE__*/React.createElement("option", {
    key: i.key,
    value: i.key
  }, i.key, " \xB7 ", i.title))), /*#__PURE__*/React.createElement(Icon, {
    name: "chevrons-up-down",
    size: 15,
    className: "wb-select-ico"
  }))));
}
Object.assign(window, {
  GitHubScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "workbench/screen-github.jsx", error: String((e && e.message) || e) }); }

// workbench/screen-issue.jsx
try { (() => {
/* ============================================================
   AI Delivery Workbench — Screen: Issue Detail
   The operational command center for a single issue: business
   context, acceptance criteria, the AI stage timeline (with
   live Run/Retry/Redo/Logs actions), and right-rail summaries.
   ============================================================ */
const {
  useState: useStateID
} = React;

// progression metadata for "ready" stage actions
const STAGE_PROGRESS = {
  seed: {
    label: "Run Seed",
    lifecycle: "Intake",
    next: "intake",
    msg: "Workspace seeded · inputs.json captured."
  },
  intake: {
    label: "Run Intake",
    lifecycle: "Spec",
    next: "spec",
    msg: "intake.md generated with prompt provenance."
  },
  spec: {
    label: "Generate Spec",
    lifecycle: "Planning",
    next: "plan",
    msg: "spec.md generated with acceptance criteria."
  },
  plan: {
    label: "Generate Plan",
    lifecycle: "Planning",
    next: "targets",
    msg: "plan.md generated."
  },
  targets: {
    label: "Generate Change Targets",
    lifecycle: "Implementation",
    next: "implement",
    msg: "change-targets.json + risk-review.md generated."
  },
  implement: {
    label: "Run Implement",
    lifecycle: "Verification",
    next: "verify",
    msg: "Draft code committed to the feature branch."
  },
  verify: {
    label: "Run Verify",
    lifecycle: "Verification",
    next: "review",
    msg: "evidence.md generated · tests passed (simulated)."
  }
};
const CONTEXT_1150 = {
  summary: "Finance analysts hand-write budget-vs-actual variance commentary every close cycle. This issue introduces an AI-drafted commentary that an analyst reviews, edits, and explicitly approves before it can appear in a report — accelerating the narrative without removing human judgment.",
  business: ["Monthly reporting cycle spends meaningful analyst time on repetitive variance narratives.", "Draft-then-approve keeps a human accountable for every published statement.", "Materiality threshold (default 5% / $50k) keeps commentary focused on what matters."],
  riskNotes: "Medium — the change spans Angular, .NET, and Oracle. Primary risk is publishing commentary without review; mitigated by an approval gate enforced in both the UI and the API, behind a default-off feature flag."
};
function genContext(issue) {
  return {
    summary: "Synthetic business context for " + issue.key + " — " + issue.title + ". This work item follows the same governed AI delivery workflow as the FIN-1150 reference issue: intake, spec, plan, change targets, implementation, verification, and a human review gate.",
    business: [issue.domain + " workflow improvement framed as a reviewable, traceable change.", "Deterministic artifacts are produced at each stage for human review.", "No downstream action is taken without passing the review and validation gates."],
    riskNotes: issue.risk + " — synthetic risk assessment for this demonstration issue."
  };
}
function StageRow({
  issue,
  stage,
  selected,
  onToggle
}) {
  const {
    actions
  } = useApp();
  const id = stage.id,
    status = stage.status;
  const def = window.WBData.stageDefs.find(s => s.id === id);
  const nodeClass = {
    done: "wb-tl-node--done",
    run: "wb-tl-node--running",
    fail: "wb-tl-node--failed",
    review: "wb-tl-node--review",
    stale: "wb-tl-node--stale",
    ready: "wb-tl-node--ready",
    none: ""
  }[status] || "";
  const nodeIcon = {
    done: "check",
    run: "loader",
    fail: "x",
    review: "alert-triangle",
    stale: "ban",
    ready: "play",
    none: def.icon
  }[status] || def.icon;
  const runReady = () => {
    if (id === "review") return markReviewReady();
    const p = STAGE_PROGRESS[id];
    actions.runStage(issue.key, id, {
      lifecycle: p.lifecycle,
      doneMsg: p.msg,
      onDone: () => {
        if (p.next && p.next !== "review") actions.setStage(issue.key, p.next, "ready");
        if (p.next === "review") actions.setStage(issue.key, "review", "ready");
      }
    });
  };
  const retry = () => {
    actions.runStage(issue.key, id, {
      doneMsg: def.name + " re-run succeeded (simulated).",
      onDone: () => {
        const p = STAGE_PROGRESS[id];
        if (p && p.next) actions.setStage(issue.key, p.next, "ready");
      }
    });
  };
  const redo = () => {
    actions.openModal({
      title: "Redo " + def.name + "?",
      icon: "refresh-cw",
      tone: "warn",
      confirmLabel: "Redo & mark downstream stale",
      cancelLabel: "Cancel",
      body: /*#__PURE__*/React.createElement("div", null, "Re-running ", /*#__PURE__*/React.createElement("strong", null, def.name), " invalidates everything after it. Implement, Verify, and PR Review will be marked ", /*#__PURE__*/React.createElement("strong", null, "Stale"), " and must be re-run. This enforces deterministic, in-order artifacts."),
      onConfirm: () => actions.runStage(issue.key, id, {
        doneMsg: def.name + " re-run · downstream marked stale.",
        onDone: () => {
          actions.staleFrom(issue.key, "implement");
          actions.toast("warn", "Downstream marked stale", "Implement → Verify → PR Review must be re-run.");
        }
      })
    });
  };
  const markReviewReady = () => {
    actions.setStage(issue.key, "review", "review");
    actions.patchIssue(issue.key, {
      lifecycle: "Review Ready",
      flags: {
        needsReview: true
      }
    });
    actions.toast("success", "Marked Review Ready", "Lifecycle → Review Ready. Human review gate is now open.");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-tl-item"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-tl-rail"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-tl-node " + nodeClass
  }, /*#__PURE__*/React.createElement(Icon, {
    name: nodeIcon,
    size: 15,
    className: status === "run" ? "wb-spin" : "",
    strokeWidth: status === "done" ? 2.4 : 1.9
  })), /*#__PURE__*/React.createElement("span", {
    className: "wb-tl-line"
  })), /*#__PURE__*/React.createElement("div", {
    className: "wb-tl-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-tl-card" + (selected ? " is-selected" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-tl-card-head",
    onClick: onToggle
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 9
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-tl-stage-name"
  }, def.name), /*#__PURE__*/React.createElement(StatusBadge, {
    status: status
  }), stage.reviewerActionRequired && /*#__PURE__*/React.createElement(Badge, {
    tone: "warn",
    icon: "user"
  }, "Reviewer action")), /*#__PURE__*/React.createElement("div", {
    className: "wb-tl-stage-meta wb-mt-8",
    style: {
      display: "flex",
      gap: 14,
      flexWrap: "wrap"
    }
  }, /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "sparkles",
    size: 11
  }), " ", stage.promptVersion), stage.startedAt !== "—" && /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "clock",
    size: 11
  }), " ", stage.startedAt, stage.completedAt !== "—" && stage.completedAt !== "running…" ? " → " + stage.completedAt : ""), stage.artifacts.length > 0 && /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement(Icon, {
    name: "file-code",
    size: 11
  }), " ", stage.artifacts.join(", ")))), /*#__PURE__*/React.createElement("div", {
    className: "wb-spacer",
    style: {
      marginLeft: "auto"
    }
  }), /*#__PURE__*/React.createElement(Icon, {
    name: selected ? "chevron-down" : "chevron-right",
    size: 16,
    className: "wb-muted"
  })), selected && /*#__PURE__*/React.createElement("div", {
    className: "wb-tl-detail",
    style: {
      paddingTop: 12
    }
  }, /*#__PURE__*/React.createElement("p", {
    className: "wb-text-sm wb-secondary",
    style: {
      marginBottom: 12
    }
  }, def.desc), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex wb-wrap",
    style: {
      gap: 8
    }
  }, status === "ready" && /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "primary",
    icon: id === "review" ? "shield-check" : "play",
    onClick: runReady
  }, id === "review" ? "Mark Review Ready" : STAGE_PROGRESS[id].label), status === "fail" && /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "primary",
    icon: "rotate-ccw",
    onClick: retry
  }, "Retry ", def.name), status === "stale" && /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "primary",
    icon: "refresh-cw",
    onClick: retry
  }, "Re-run ", def.name), status === "run" && /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "secondary",
    disabled: true,
    icon: "loader"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-spin",
    style: {
      display: "inline-flex"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "loader",
    size: 13
  })), "Running\u2026"), status === "done" && (id === "plan" || id === "targets") && /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "secondary",
    icon: "refresh-cw",
    onClick: redo
  }, "Redo ", def.name), status === "review" && /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "primary",
    icon: "git-pull-request",
    onClick: () => actions.navigate("github", issue.key)
  }, "Open human review"), stage.artifacts.length > 0 && /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "secondary",
    icon: "file-code",
    onClick: () => {
      actions.selectArtifact(issue.key, stage.artifacts[0]);
      actions.navigate("artifacts", issue.key);
    }
  }, "View artifact"), stage.logsAvailable && /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "ghost",
    icon: "terminal",
    onClick: () => actions.openLogs(issue.key, id)
  }, "View logs"))))));
}
function IssueDetail() {
  const {
    state,
    actions
  } = useApp();
  const issue = state.issues[state.selectedKey];
  const stages = window.WBData.buildStages(issue);
  const cs = currentStage(issue);
  const ctx = issue.key === "FIN-1150" ? CONTEXT_1150 : genContext(issue);
  const val = window.WBData.validationFor(issue);
  const pr = window.WBData.prFor(issue);
  const artifacts = window.WBData.artifactsFor(issue);
  const [open, setOpen] = useStateID(cs.id);

  // primary next action
  const nextStage = stages.find(s => s.status === "ready") || stages.find(s => s.status === "fail") || stages.find(s => s.status === "review") || stages.find(s => s.status === "stale");
  const primary = (() => {
    if (!nextStage) return null;
    const s = nextStage;
    if (s.status === "ready") return {
      label: s.id === "review" ? "Mark Review Ready" : STAGE_PROGRESS[s.id].label,
      icon: s.id === "review" ? "shield-check" : "play",
      run: () => triggerReady(s)
    };
    if (s.status === "fail") return {
      label: "Retry " + s.name,
      icon: "rotate-ccw",
      run: () => triggerReady(s, true)
    };
    if (s.status === "review") return {
      label: "Open human review",
      icon: "git-pull-request",
      run: () => actions.navigate("github", issue.key)
    };
    if (s.status === "stale") return {
      label: "Re-run " + s.name,
      icon: "refresh-cw",
      run: () => triggerReady(s, true)
    };
    return null;
  })();
  function triggerReady(s, retry) {
    setOpen(s.id);
    if (s.id === "review") {
      actions.setStage(issue.key, "review", "review");
      actions.patchIssue(issue.key, {
        lifecycle: "Review Ready",
        flags: {
          needsReview: true
        }
      });
      actions.toast("success", "Marked Review Ready", "Lifecycle → Review Ready. Human review gate is now open.");
      return;
    }
    const p = STAGE_PROGRESS[s.id];
    actions.runStage(issue.key, s.id, {
      lifecycle: p && p.lifecycle,
      doneMsg: p ? p.msg : "Completed.",
      onDone: () => {
        if (p && p.next) actions.setStage(issue.key, p.next, "ready");
      }
    });
  }
  const valTone = {
    Passed: "safe",
    "In Progress": "accent",
    Failed: "danger",
    Blocked: "danger",
    "Not Started": "neutral",
    Pending: "warn"
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-page wb-page-wide"
  }, /*#__PURE__*/React.createElement(Card, {
    className: "wb-mb-16",
    style: {
      position: "sticky",
      top: 0,
      zIndex: 5
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-between wb-wrap",
    style: {
      gap: 14
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-row-key",
    style: {
      fontSize: 14
    }
  }, issue.key), /*#__PURE__*/React.createElement(LifecycleBadge, {
    value: issue.lifecycle
  }), /*#__PURE__*/React.createElement(RiskBadge, {
    risk: issue.risk
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 18,
      fontWeight: 700,
      letterSpacing: "-0.01em",
      marginTop: 6
    }
  }, issue.title), /*#__PURE__*/React.createElement("div", {
    className: "wb-text-sm wb-muted wb-mt-8 wb-flex",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "circle-dot",
    size: 13
  }), " Current stage: ", /*#__PURE__*/React.createElement("strong", {
    className: "wb-secondary"
  }, cs.def.name), " ", /*#__PURE__*/React.createElement(StatusBadge, {
    status: cs.status
  }))), /*#__PURE__*/React.createElement("div", {
    className: "wb-spacer",
    style: {
      marginLeft: "auto"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex wb-wrap",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "secondary",
    icon: "git-pull-request",
    onClick: () => actions.navigate("github", issue.key)
  }, issue.pr ? "PR #" + issue.pr : "PR readiness"), primary && /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    icon: primary.icon,
    onClick: primary.run
  }, primary.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1.7fr) minmax(0,1fr)",
      gap: 16,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-stack"
  }, primary && /*#__PURE__*/React.createElement(Banner, {
    tone: nextStage && nextStage.status === "fail" ? "danger" : nextStage && (nextStage.status === "review" || nextStage.status === "stale") ? "warn" : "info",
    title: "Next best action"
  }, nextStage && nextStage.status === "fail" && /*#__PURE__*/React.createElement(React.Fragment, null, "The ", /*#__PURE__*/React.createElement("strong", null, nextStage.name), " stage failed. Inspect the logs and retry \u2014 downstream stages stay blocked until it passes."), nextStage && nextStage.status === "ready" && /*#__PURE__*/React.createElement(React.Fragment, null, "This issue is ready to ", /*#__PURE__*/React.createElement("strong", null, primary.label.toLowerCase()), ". Output is recorded as a reviewable artifact with prompt provenance."), nextStage && nextStage.status === "review" && /*#__PURE__*/React.createElement(React.Fragment, null, "Implementation and verification are complete. This change is waiting on the ", /*#__PURE__*/React.createElement("strong", null, "human review gate"), " before it is release-eligible."), nextStage && nextStage.status === "stale" && /*#__PURE__*/React.createElement(React.Fragment, null, "A plan change marked downstream stages stale. ", /*#__PURE__*/React.createElement("strong", null, "Re-run ", nextStage.name), " to restore a consistent, in-order artifact chain.")), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "file-text",
    title: "Business context"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, /*#__PURE__*/React.createElement("p", {
    className: "wb-secondary",
    style: {
      fontSize: 13.5,
      lineHeight: 1.6
    }
  }, ctx.summary), /*#__PURE__*/React.createElement("div", {
    className: "wb-md",
    style: {
      marginTop: 6
    }
  }, /*#__PURE__*/React.createElement("ul", null, ctx.business.map((b, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, b)))), /*#__PURE__*/React.createElement("div", {
    className: "wb-banner wb-banner--warn wb-mt-12"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "shield-alert",
    size: 16,
    className: "wb-banner-ico"
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    className: "wb-banner-title"
  }, "Risk notes"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 2
    }
  }, ctx.riskNotes))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "list-checks",
    title: "Acceptance criteria",
    actions: /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, val.acceptance.filter(a => a.status === "Passed").length, "/", val.acceptance.length, " passed")
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-card-body--tight"
  }, val.acceptance.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    className: "wb-flex",
    style: {
      gap: 10,
      padding: "10px 16px",
      borderBottom: i < val.acceptance.length - 1 ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-mono wb-muted",
    style: {
      fontSize: 11.5,
      flex: "none",
      width: 34
    }
  }, a.id), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      flex: 1
    }
  }, a.text), /*#__PURE__*/React.createElement(Badge, {
    tone: valTone[a.status] || "neutral",
    icon: a.status === "Passed" ? "check" : a.status === "Failed" ? "x" : a.status === "In Progress" ? "loader" : "circle-dashed"
  }, a.status))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "workflow",
    title: "AI delivery workflow",
    sub: "Eight deterministic stages \xB7 human review gate before release",
    actions: /*#__PURE__*/React.createElement(Badge, {
      tone: "accent",
      icon: "sparkles"
    }, "Governed")
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-timeline"
  }, stages.map(s => /*#__PURE__*/React.createElement(StageRow, {
    key: s.id,
    issue: issue,
    stage: s,
    selected: open === s.id,
    onToggle: () => setOpen(open === s.id ? null : s.id)
  })))))), /*#__PURE__*/React.createElement("div", {
    className: "wb-stack"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "info",
    title: "Issue"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, /*#__PURE__*/React.createElement(Kv, {
    rows: [["Domain", issue.domain], ["Surface", /*#__PURE__*/React.createElement(SurfaceBadge, {
      value: issue.surface
    })], ["Branch", /*#__PURE__*/React.createElement("span", {
      className: "wb-mono wb-text-sm",
      style: {
        color: "var(--accent-text)"
      }
    }, issue.branch)], ["Target surfaces", "Angular · C#/.NET API · Oracle"]]
  }), /*#__PURE__*/React.createElement("hr", {
    className: "wb-divider"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex-col",
    style: {
      gap: 10
    }
  }, [["Owner", issue.assignee], ["Reviewer", issue.reviewer], ["Tester", issue.tester]].map(([role, who]) => /*#__PURE__*/React.createElement("div", {
    key: role,
    className: "wb-flex",
    style: {
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: who,
    sm: true
  }), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "wb-text-sm wb-strong"
  }, who), /*#__PURE__*/React.createElement("div", {
    className: "wb-muted",
    style: {
      fontSize: 11.5
    }
  }, role))))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "file-code",
    title: "Latest artifacts",
    actions: /*#__PURE__*/React.createElement(Btn, {
      size: "sm",
      variant: "ghost",
      iconRight: "arrow-right",
      onClick: () => actions.navigate("artifacts", issue.key)
    }, "All")
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-card-body--tight"
  }, artifacts.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-muted wb-text-sm"
  }, "No artifacts yet \u2014 run the workflow to generate them.")), artifacts.slice(-4).reverse().map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    className: "wb-flex wb-clickable",
    style: {
      gap: 10,
      padding: "10px 16px",
      borderBottom: i < Math.min(4, artifacts.length) - 1 ? "1px solid var(--border-subtle)" : "none"
    },
    onClick: () => {
      actions.selectArtifact(issue.key, a.name);
      actions.navigate("artifacts", issue.key);
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: a.type === "JSON" ? "file-code" : "file-text",
    size: 15,
    className: "wb-muted"
  }), /*#__PURE__*/React.createElement("span", {
    className: "wb-mono wb-text-sm",
    style: {
      flex: 1
    }
  }, a.name), /*#__PURE__*/React.createElement("span", {
    className: "wb-muted",
    style: {
      fontSize: 11
    }
  }, a.stage))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "git-pull-request",
    title: "PR readiness"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, issue.pr ? /*#__PURE__*/React.createElement("div", {
    className: "wb-stack-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, "Pull request"), /*#__PURE__*/React.createElement("span", {
    className: "wb-mono wb-strong",
    style: {
      color: "var(--accent-text)"
    }
  }, "#", issue.pr)), /*#__PURE__*/React.createElement("div", {
    className: "wb-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, "Status"), /*#__PURE__*/React.createElement(Badge, {
    tone: issue.prStatus === "Open" || issue.prStatus === "Ready for review" ? "accent" : "neutral"
  }, issue.prStatus)), /*#__PURE__*/React.createElement("div", {
    className: "wb-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, "Checks"), /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm"
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--safe)"
    }
  }, pr.checks.filter(c => c.status === "pass").length, " pass"), pr.checks.some(c => c.status === "fail") ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--danger)"
    }
  }, " \xB7 ", pr.checks.filter(c => c.status === "fail").length, " fail") : "", pr.checks.some(c => c.status === "pending" || c.status === "required") ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--warn)"
    }
  }, " \xB7 ", pr.checks.filter(c => c.status === "pending" || c.status === "required").length, " open") : "")), /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "secondary",
    className: "wb-btn--block wb-mt-8",
    iconRight: "arrow-right",
    onClick: () => actions.navigate("github", issue.key)
  }, "Open PR readiness")) : /*#__PURE__*/React.createElement(EmptyState, {
    icon: "git-pull-request",
    title: "No PR yet"
  }, "Run through Implement, then create a mock PR on the GitHub screen."))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "flask",
    title: "Validation status"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-stack-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, "Decision"), /*#__PURE__*/React.createElement(Badge, {
    tone: valTone[val.decision] || "neutral"
  }, val.decision)), /*#__PURE__*/React.createElement("div", {
    className: "wb-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, "Evidence"), /*#__PURE__*/React.createElement(Badge, {
    tone: valTone[val.evidenceStatus] || "neutral"
  }, val.evidenceStatus)), /*#__PURE__*/React.createElement(Progress, {
    value: Math.round(val.acceptance.filter(a => a.status === "Passed").length / val.acceptance.length * 100),
    tone: "safe"
  }), /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "secondary",
    className: "wb-btn--block wb-mt-8",
    iconRight: "arrow-right",
    onClick: () => actions.navigate("validation", issue.key)
  }, "Open validation evidence"))))));
}
Object.assign(window, {
  IssueDetail
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "workbench/screen-issue.jsx", error: String((e && e.message) || e) }); }

// workbench/screen-settings.jsx
try { (() => {
/* ============================================================
   AI Delivery Workbench — Screen: Settings
   Enterprise integration console (all simulated / disabled).
   ============================================================ */
const {
  useState: useStateST
} = React;
function SimBadge() {
  return /*#__PURE__*/React.createElement(Badge, {
    tone: "warn",
    icon: "circle-dot"
  }, "Simulated");
}
function FieldRO({
  label,
  value,
  mono,
  hint
}) {
  return /*#__PURE__*/React.createElement(Field, {
    label: label,
    hint: hint
  }, /*#__PURE__*/React.createElement("input", {
    className: "wb-input" + (mono ? " wb-input--mono" : ""),
    value: value,
    readOnly: true
  }));
}
function SettingsScreen() {
  const {
    state,
    actions
  } = useApp();
  const S = state.settings;
  const [tab, setTab] = useStateST("jira");
  const toast = (t, m) => actions.toast("success", t, m);
  const tabs = [{
    id: "jira",
    label: "Jira",
    icon: "scroll-text"
  }, {
    id: "github",
    label: "GitHub",
    icon: "git-branch"
  }, {
    id: "ai",
    label: "AI Provider",
    icon: "sparkles"
  }, {
    id: "mcp",
    label: "MCP Servers",
    icon: "network"
  }, {
    id: "stack",
    label: "Target Stack",
    icon: "cpu"
  }, {
    id: "gov",
    label: "Governance",
    icon: "shield-check"
  }];
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-page wb-page-wide"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow wb-mb-8"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "sliders",
    size: 13
  }), " Enterprise integration console"), /*#__PURE__*/React.createElement("div", {
    className: "wb-page-title"
  }, "Settings"), /*#__PURE__*/React.createElement("div", {
    className: "wb-page-desc"
  }, "How the workbench adapts to Jira, GitHub, Angular, .NET, Oracle, and MCP context. Everything here is simulated \u2014 no real connections, credentials, or external writes."))), /*#__PURE__*/React.createElement(Banner, {
    tone: "warn",
    title: "Demo mode",
    icon: "lock"
  }, "All integrations are simulated. Connection tests, syncs, and validations return canned results. No real external systems are contacted."), /*#__PURE__*/React.createElement("div", {
    className: "wb-mt-16"
  }, /*#__PURE__*/React.createElement(Tabs, {
    tabs: tabs,
    active: tab,
    onChange: setTab
  })), /*#__PURE__*/React.createElement("div", {
    className: "wb-mt-16"
  }, tab === "jira" && /*#__PURE__*/React.createElement(Card, {
    style: {
      maxWidth: 720
    }
  }, /*#__PURE__*/React.createElement(CardHead, {
    icon: "scroll-text",
    title: "Jira connection",
    actions: /*#__PURE__*/React.createElement(SimBadge, null)
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-grid wb-grid-2"
  }, /*#__PURE__*/React.createElement(FieldRO, {
    label: "Jira base URL",
    value: S.jira.baseUrl,
    mono: true
  }), /*#__PURE__*/React.createElement(FieldRO, {
    label: "Project key",
    value: S.jira.projectKey,
    mono: true
  }), /*#__PURE__*/React.createElement(FieldRO, {
    label: "Query mode",
    value: S.jira.queryMode
  }), /*#__PURE__*/React.createElement(FieldRO, {
    label: "Connection status",
    value: S.jira.status
  })), /*#__PURE__*/React.createElement(Field, {
    label: "JQL"
  }, /*#__PURE__*/React.createElement("textarea", {
    className: "wb-input wb-input--mono",
    rows: 2,
    value: S.jira.jql,
    readOnly: true
  })), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    icon: "link",
    onClick: () => toast("Connection OK", "Jira responded in 142ms (simulated).")
  }, "Test connection"), /*#__PURE__*/React.createElement(Btn, {
    variant: "secondary",
    icon: "refresh-cw",
    onClick: () => toast("Issues synced", "10 issues pulled from project FIN (simulated).")
  }, "Sync issues")))), tab === "github" && /*#__PURE__*/React.createElement(Card, {
    style: {
      maxWidth: 760
    }
  }, /*#__PURE__*/React.createElement(CardHead, {
    icon: "git-branch",
    title: "GitHub connection",
    actions: /*#__PURE__*/React.createElement(SimBadge, null)
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-stack"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-grid wb-grid-2"
  }, /*#__PURE__*/React.createElement(FieldRO, {
    label: "Organization",
    value: S.github.org,
    mono: true
  }), /*#__PURE__*/React.createElement(FieldRO, {
    label: "PR target branch",
    value: S.github.prTarget,
    mono: true
  }), /*#__PURE__*/React.createElement(FieldRO, {
    label: "Branch pattern",
    value: S.github.branchPattern,
    mono: true
  }), /*#__PURE__*/React.createElement(FieldRO, {
    label: "Connection status",
    value: S.github.status
  })), /*#__PURE__*/React.createElement(Field, {
    label: "Repository map",
    hint: S.github.repos.length + " repos"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-card wb-card--flat",
    style: {
      overflow: "hidden"
    }
  }, S.github.repos.map((r, i) => /*#__PURE__*/React.createElement("div", {
    key: r.name,
    className: "wb-flex",
    style: {
      gap: 10,
      padding: "10px 14px",
      borderBottom: i < S.github.repos.length - 1 ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "folder",
    size: 15,
    className: "wb-muted"
  }), /*#__PURE__*/React.createElement("span", {
    className: "wb-mono wb-text-sm wb-strong",
    style: {
      flex: 1
    }
  }, r.name), /*#__PURE__*/React.createElement("span", {
    className: "wb-muted wb-text-sm"
  }, r.role), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    icon: "git-branch"
  }, r.default))))), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex wb-wrap",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Btn, {
    variant: "primary",
    icon: "link",
    onClick: () => toast("Connection OK", "Authenticated to example-finance-software (simulated).")
  }, "Test connection"), /*#__PURE__*/React.createElement(Btn, {
    variant: "secondary",
    icon: "refresh-cw",
    onClick: () => toast("Repositories refreshed", "3 repositories mapped (simulated).")
  }, "Refresh repositories"), /*#__PURE__*/React.createElement(Btn, {
    variant: "secondary",
    icon: "check-circle",
    onClick: () => toast("Branch pattern valid", "feature/{issueKey}-{slug} → feature/FIN-1150-ai-variance-commentary")
  }, "Validate branch pattern")))), tab === "ai" && /*#__PURE__*/React.createElement("div", {
    style: {
      maxWidth: 720
    },
    className: "wb-stack"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "sparkles",
    title: "AI provider settings",
    actions: /*#__PURE__*/React.createElement(SimBadge, null)
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-grid wb-grid-2"
  }, /*#__PURE__*/React.createElement(FieldRO, {
    label: "Primary implementation agent",
    value: S.ai.primary
  }), /*#__PURE__*/React.createElement(FieldRO, {
    label: "Secondary implementation agent",
    value: S.ai.secondary
  }), /*#__PURE__*/React.createElement(FieldRO, {
    label: "Design assistant",
    value: S.ai.design
  }), /*#__PURE__*/React.createElement(FieldRO, {
    label: "Max run duration",
    value: S.ai.maxRun
  }))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "shield-check",
    title: "Autonomy guardrails",
    sub: "Locked in demo mode"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-card-body--tight"
  }, [["Human approval required before PR", true, "Enforced — AI never opens a PR unattended."], ["Auto-merge allowed", false, "Disabled — merges require human action."], ["Auto-production deploy allowed", false, "Disabled — no unattended production actions."]].map(([label, on, sub], i) => /*#__PURE__*/React.createElement("div", {
    key: label,
    className: "wb-between",
    style: {
      padding: "13px 16px",
      borderBottom: i < 2 ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "wb-text-sm wb-strong"
  }, label), /*#__PURE__*/React.createElement("div", {
    className: "wb-muted",
    style: {
      fontSize: 12
    }
  }, sub)), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement(Toggle, {
    on: on,
    disabled: true
  }), /*#__PURE__*/React.createElement(Icon, {
    name: "lock",
    size: 13,
    className: "wb-muted"
  }))))))), tab === "mcp" && /*#__PURE__*/React.createElement("div", {
    className: "wb-grid wb-grid-2"
  }, window.WBData.mcpServers.map(m => /*#__PURE__*/React.createElement(Card, {
    key: m.name
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      width: 34,
      height: 34,
      borderRadius: "var(--radius-md)",
      background: "var(--bg-inset)",
      color: "var(--accent)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flex: "none"
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: m.icon,
    size: 17
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-strong",
    style: {
      fontSize: 13.5
    }
  }, m.name)), /*#__PURE__*/React.createElement(SimBadge, null)), /*#__PURE__*/React.createElement("p", {
    className: "wb-secondary wb-text-sm wb-mt-12",
    style: {
      lineHeight: 1.5
    }
  }, m.purpose), /*#__PURE__*/React.createElement("div", {
    className: "wb-mt-12",
    style: {
      fontSize: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      marginBottom: 5
    }
  }, "Data boundary"), /*#__PURE__*/React.createElement("div", {
    className: "wb-secondary wb-text-sm"
  }, m.boundary)), /*#__PURE__*/React.createElement("hr", {
    className: "wb-divider",
    style: {
      margin: "12px 0"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      marginBottom: 6
    }
  }, "Allowed"), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex-col",
    style: {
      gap: 5
    }
  }, m.allowed.map(o => /*#__PURE__*/React.createElement("span", {
    key: o,
    className: "wb-flex",
    style: {
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "check",
    size: 12,
    style: {
      color: "var(--safe)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "wb-mono",
    style: {
      fontSize: 11
    }
  }, o))))), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow",
    style: {
      marginBottom: 6
    }
  }, "Disallowed"), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex-col",
    style: {
      gap: 5
    }
  }, m.disallowed.map(o => /*#__PURE__*/React.createElement("span", {
    key: o,
    className: "wb-flex",
    style: {
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 12,
    style: {
      color: "var(--danger)"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "wb-mono",
    style: {
      fontSize: 11
    }
  }, o)))))))))), tab === "stack" && /*#__PURE__*/React.createElement(Card, {
    style: {
      maxWidth: 620
    }
  }, /*#__PURE__*/React.createElement(CardHead, {
    icon: "cpu",
    title: "Target stack profile",
    sub: "What the AI is grounded to build against"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-card-body--tight"
  }, Object.entries(S.stack).map(([k, v], i, arr) => /*#__PURE__*/React.createElement("div", {
    key: k,
    className: "wb-between",
    style: {
      padding: "13px 16px",
      borderBottom: i < arr.length - 1 ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, k), /*#__PURE__*/React.createElement("span", {
    className: "wb-mono wb-strong wb-text-sm"
  }, v))))), tab === "gov" && /*#__PURE__*/React.createElement(Card, {
    style: {
      maxWidth: 720
    }
  }, /*#__PURE__*/React.createElement(CardHead, {
    icon: "shield-check",
    title: "Governance settings",
    actions: /*#__PURE__*/React.createElement(Badge, {
      tone: "safe",
      icon: "check"
    }, S.governance.filter(g => g.on).length, "/", S.governance.length, " on")
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-card-body--tight"
  }, S.governance.map((g, i) => /*#__PURE__*/React.createElement("div", {
    key: g.id,
    className: "wb-between",
    style: {
      padding: "13px 16px",
      borderBottom: i < S.governance.length - 1 ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 10
    }
  }, /*#__PURE__*/React.createElement(Check, {
    on: g.on,
    label: g.label,
    onClick: () => actions.toggleGov(g.id),
    disabled: g.locked
  })), g.locked && /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    icon: "lock"
  }, "Locked")))), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-foot"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "info",
    size: 14,
    className: "wb-muted"
  }), /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-muted"
  }, "These rules shape how every AI delivery run is governed. Toggling them updates local demo state only.")))));
}
Object.assign(window, {
  SettingsScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "workbench/screen-settings.jsx", error: String((e && e.message) || e) }); }

// workbench/screen-validation.jsx
try { (() => {
/* ============================================================
   AI Delivery Workbench — Screen: Validation Evidence
   QA handoff + audit trail: acceptance, scenarios, assumptions,
   tester notes, and a final validation decision.
   ============================================================ */
const {
  useState: useStateVL
} = React;
const VAL_TONE = {
  Passed: "safe",
  "In Progress": "accent",
  Failed: "danger",
  Blocked: "danger",
  "Not Started": "neutral",
  Pending: "warn",
  Complete: "safe"
};
const VAL_ICON = {
  Passed: "check-circle",
  "In Progress": "loader",
  Failed: "x-circle",
  Blocked: "ban",
  "Not Started": "circle-dashed",
  Pending: "clock",
  Complete: "check-circle"
};
function StatusPill({
  status
}) {
  return /*#__PURE__*/React.createElement(Badge, {
    tone: VAL_TONE[status] || "neutral",
    icon: VAL_ICON[status] || "circle"
  }, status);
}
function ValidationScreen() {
  const {
    state,
    actions
  } = useApp();
  const issue = state.issues[state.selectedKey];
  const base = window.WBData.validationFor(issue);
  const ov = state.valState[issue.key] || {};
  const [noteText, setNoteText] = useStateVL("");
  const scen = base.scenarios.map(s => ({
    ...s,
    status: ov.scenarios && ov.scenarios[s.name] || s.status
  }));
  const notes = [...(base.testerNotes || []), ...(ov.notes || [])];
  const decision = ov.decision || base.decision;
  const evidence = ov.evidenceStatus || base.evidenceStatus;
  const started = ov.started || ["In Progress", "Passed", "Failed"].includes(base.evidenceStatus);
  const allPassed = scen.length > 0 && scen.every(s => s.status === "Passed");
  const setScenario = (name, status) => {
    actions.setVal(issue.key, {
      scenarios: {
        ...(ov.scenarios || {}),
        [name]: status
      }
    });
    actions.toast(status === "Passed" ? "success" : "error", "Test " + (status === "Passed" ? "passed" : "failed"), name + " marked " + status + ".");
  };
  const start = () => {
    actions.setVal(issue.key, {
      started: true,
      evidenceStatus: "In Progress",
      decision: "Pending"
    });
    actions.toast("info", "Validation started", "Tester assigned · evidence set to In Progress.");
  };
  const requestFixes = () => {
    actions.setVal(issue.key, {
      decision: "Blocked",
      evidenceStatus: "Blocked"
    });
    actions.patchIssue(issue.key, {
      lifecycle: "Implementation"
    });
    actions.toast("warn", "Fixes requested", "Routed back to implementation — downstream evidence held.");
  };
  const complete = () => {
    if (!allPassed) {
      actions.toast("warn", "Tests not all passing", "Every scenario must pass before evidence can be marked complete.");
      return;
    }
    actions.setVal(issue.key, {
      decision: "Passed",
      evidenceStatus: "Complete"
    });
    actions.toast("success", "Evidence marked complete", "Final validation passed — change is merge-eligible (simulated).");
  };
  const addNote = () => {
    if (!noteText.trim()) return;
    actions.setVal(issue.key, {
      notes: [...(ov.notes || []), {
        author: issue.tester !== "—" ? issue.tester : "P. Shah",
        time: "just now",
        text: noteText.trim()
      }]
    });
    setNoteText("");
    actions.toast("success", "Tester note added", "Appended to the immutable evidence log.");
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-page wb-page-wide"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow wb-mb-8"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "flask",
    size: 13
  }), " QA handoff & audit trail"), /*#__PURE__*/React.createElement("div", {
    className: "wb-page-title"
  }, "Validation Evidence"), /*#__PURE__*/React.createElement("div", {
    className: "wb-page-desc"
  }, "Evidence and approval travel with the change \u2014 acceptance coverage, test scenarios, data assumptions, and a final human validation decision that stays attached for audit.")), /*#__PURE__*/React.createElement("div", {
    className: "wb-spacer"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-muted"
  }, "Issue"), /*#__PURE__*/React.createElement("div", {
    className: "wb-select",
    style: {
      width: 230
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: issue.key,
    onChange: e => actions.navigate("validation", e.target.value)
  }, window.WBData.issues.map(i => /*#__PURE__*/React.createElement("option", {
    key: i.key,
    value: i.key
  }, i.key, " \xB7 ", i.title))), /*#__PURE__*/React.createElement(Icon, {
    name: "chevrons-up-down",
    size: 15,
    className: "wb-select-ico"
  })))), /*#__PURE__*/React.createElement(Card, {
    className: "wb-mb-16"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-between wb-wrap",
    style: {
      gap: 12
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 10
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, "Final decision"), /*#__PURE__*/React.createElement(StatusPill, {
    status: decision
  }), /*#__PURE__*/React.createElement("span", {
    className: "wb-muted"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, "Evidence"), /*#__PURE__*/React.createElement(StatusPill, {
    status: evidence
  })), /*#__PURE__*/React.createElement("div", {
    className: "wb-spacer",
    style: {
      marginLeft: "auto"
    }
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex wb-wrap",
    style: {
      gap: 8
    }
  }, !started && /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "primary",
    icon: "play",
    onClick: start
  }, "Start validation"), /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "danger",
    icon: "rotate-ccw",
    onClick: requestFixes
  }, "Request fixes"), /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "primary",
    icon: "shield-check",
    onClick: complete
  }, "Mark evidence complete")))), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "minmax(0,1.7fr) minmax(0,1fr)",
      gap: 16,
      alignItems: "start"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-stack"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "list-checks",
    title: "Acceptance criteria coverage",
    actions: /*#__PURE__*/React.createElement(Badge, {
      tone: "neutral"
    }, base.acceptance.filter(a => a.status === "Passed").length, "/", base.acceptance.length)
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-card-body--tight"
  }, base.acceptance.map((a, i) => /*#__PURE__*/React.createElement("div", {
    key: a.id,
    className: "wb-flex",
    style: {
      gap: 10,
      padding: "10px 16px",
      borderBottom: i < base.acceptance.length - 1 ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-mono wb-muted",
    style: {
      fontSize: 11.5,
      width: 34,
      flex: "none"
    }
  }, a.id), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 13,
      flex: 1
    }
  }, a.text), /*#__PURE__*/React.createElement(StatusPill, {
    status: a.status
  }))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "flask",
    title: "Test scenarios",
    sub: "Mark each scenario as you validate"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-card-body--tight"
  }, scen.map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: s.name,
    className: "wb-flex wb-wrap",
    style: {
      gap: 10,
      padding: "11px 16px",
      borderBottom: i < scen.length - 1 ? "1px solid var(--border-subtle)" : "none"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      minWidth: 200
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-text-sm wb-strong"
  }, s.name), s.note && /*#__PURE__*/React.createElement("div", {
    className: "wb-mono wb-muted",
    style: {
      fontSize: 11,
      marginTop: 2
    }
  }, s.note)), /*#__PURE__*/React.createElement(StatusPill, {
    status: s.status
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 6
    }
  }, /*#__PURE__*/React.createElement(IconBtn, {
    icon: "check",
    size: "sm",
    title: "Mark passed",
    onClick: () => setScenario(s.name, "Passed")
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: "x",
    size: "sm",
    title: "Mark failed",
    onClick: () => setScenario(s.name, "Failed")
  })))), scen.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-muted wb-text-sm"
  }, "No scenarios defined.")))), /*#__PURE__*/React.createElement("div", {
    className: "wb-grid wb-grid-2"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "database",
    title: "Oracle data assumptions"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-md"
  }, /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0
    }
  }, base.oracleAssumptions.map((x, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, x)))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "cpu",
    title: "API validation notes"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-md"
  }, /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0
    }
  }, base.apiNotes.map((x, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, x)))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "box",
    title: "Angular UI validation notes"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-md"
  }, /*#__PURE__*/React.createElement("ul", {
    style: {
      margin: 0
    }
  }, base.uiNotes.map((x, i) => /*#__PURE__*/React.createElement("li", {
    key: i
  }, x)))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "shield-check",
    title: "Security & access review"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-stack-sm"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, "Permission / RBAC review"), /*#__PURE__*/React.createElement(StatusPill, {
    status: base.security
  })), /*#__PURE__*/React.createElement("div", {
    className: "wb-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, "Secrets in output"), /*#__PURE__*/React.createElement(Badge, {
    tone: "safe",
    icon: "check"
  }, "None")), /*#__PURE__*/React.createElement("div", {
    className: "wb-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, "Accessibility check"), /*#__PURE__*/React.createElement(StatusPill, {
    status: base.a11y
  }))))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "scroll-text",
    title: "Tester notes",
    sub: "Append-only evidence log"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-card-body--tight"
  }, notes.length === 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      padding: 16
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-muted wb-text-sm"
  }, "No tester notes yet.")), notes.map((n, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    className: "wb-flex",
    style: {
      gap: 11,
      padding: "12px 16px",
      borderBottom: "1px solid var(--border-subtle)",
      alignItems: "flex-start"
    }
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: n.author,
    sm: true
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-flex",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-strong"
  }, n.author), /*#__PURE__*/React.createElement("span", {
    className: "wb-mono wb-muted",
    style: {
      fontSize: 11
    }
  }, n.time)), /*#__PURE__*/React.createElement("div", {
    className: "wb-secondary",
    style: {
      fontSize: 13,
      marginTop: 3
    }
  }, n.text))))), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-foot",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("input", {
    className: "wb-input",
    placeholder: "Add a tester note\u2026",
    value: noteText,
    onChange: e => setNoteText(e.target.value),
    onKeyDown: e => e.key === "Enter" && addNote()
  }), /*#__PURE__*/React.createElement(Btn, {
    size: "sm",
    variant: "secondary",
    icon: "plus",
    onClick: addNote
  }, "Add note")))), /*#__PURE__*/React.createElement("div", {
    className: "wb-stack"
  }, /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "git-commit",
    title: "Tested build"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body"
  }, /*#__PURE__*/React.createElement(Kv, {
    rows: [["Branch", /*#__PURE__*/React.createElement("span", {
      className: "wb-mono wb-text-sm",
      style: {
        color: "var(--accent-text)"
      }
    }, base.branch)], ["Commit", /*#__PURE__*/React.createElement("span", {
      className: "wb-mono wb-text-sm"
    }, base.commitSha)], ["Environment", "QA (simulated)"]]
  }))), /*#__PURE__*/React.createElement(Card, null, /*#__PURE__*/React.createElement(CardHead, {
    icon: "check-circle",
    title: "Validation summary"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-card-body wb-stack-sm"
  }, /*#__PURE__*/React.createElement(Progress, {
    value: Math.round(scen.filter(s => s.status === "Passed").length / Math.max(1, scen.length) * 100),
    tone: allPassed ? "safe" : "warn"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, "Scenarios passed"), /*#__PURE__*/React.createElement("span", {
    className: "wb-mono wb-strong"
  }, scen.filter(s => s.status === "Passed").length, "/", scen.length)), /*#__PURE__*/React.createElement("div", {
    className: "wb-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, "Acceptance passed"), /*#__PURE__*/React.createElement("span", {
    className: "wb-mono wb-strong"
  }, base.acceptance.filter(a => a.status === "Passed").length, "/", base.acceptance.length)), /*#__PURE__*/React.createElement("div", {
    className: "wb-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, "Environment readiness"), /*#__PURE__*/React.createElement(Badge, {
    tone: "safe",
    icon: "check"
  }, "Ready")), /*#__PURE__*/React.createElement("hr", {
    className: "wb-divider"
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-between"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-secondary"
  }, "Final decision"), /*#__PURE__*/React.createElement(StatusPill, {
    status: decision
  })))), /*#__PURE__*/React.createElement(Banner, {
    tone: "neutral",
    icon: "shield"
  }, "Validation evidence is recorded immutably and linked to the issue, the PR, and the tested commit \u2014 so the audit trail stays intact after release."))));
}
Object.assign(window, {
  ValidationScreen
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "workbench/screen-validation.jsx", error: String((e && e.message) || e) }); }

// workbench/screen-workqueue.jsx
try { (() => {
/* ============================================================
   AI Delivery Workbench — Screen: Work Queue (the cockpit)
   ============================================================ */
const {
  useApp: _useAppWQ
} = window;

// Shared helper: which stage is "current" for an issue
function currentStage(issue) {
  const defs = window.WBData.stageDefs;
  let idx = issue.s.findIndex(v => v === "run" || v === "fail" || v === "review");
  if (idx === -1) idx = issue.s.findIndex(v => v === "ready");
  if (idx === -1) {
    // all done or none — pick last done, else first
    const lastDone = issue.s.lastIndexOf("done");
    idx = lastDone === -1 ? 0 : lastDone;
  }
  return {
    def: defs[idx],
    status: issue.s[idx],
    idx
  };
}
window.currentStage = currentStage;
function QueueChip({
  active,
  icon,
  onClick,
  children
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-chip" + (active ? " is-active" : ""),
    onClick: onClick
  }, /*#__PURE__*/React.createElement(Icon, {
    name: icon,
    size: 13
  }), children);
}
function WorkQueue() {
  const {
    state,
    actions
  } = useApp();
  const f = state.filters;
  const issues = window.WBData.issues.map(i => state.issues[i.key]);
  const filtered = issues.filter(it => {
    if (f.search && !(it.key + " " + it.title).toLowerCase().includes(f.search.toLowerCase())) return false;
    if (f.assignedToMe && it.assignee !== window.WBData.meta.user.name) return false;
    if (f.lifecycle && it.lifecycle !== f.lifecycle) return false;
    if (f.surface && it.surface !== f.surface) return false;
    if (f.hasPR && !it.pr) return false;
    if (f.needsReview && !(it.flags.needsReview || it.s.includes("review"))) return false;
    if (f.failed && !it.s.includes("fail")) return false;
    if (f.stale && !it.s.includes("stale")) return false;
    return true;
  });
  const totals = {
    all: issues.length,
    review: issues.filter(i => i.flags.needsReview || i.s.includes("review")).length,
    failed: issues.filter(i => i.s.includes("fail")).length,
    stale: issues.filter(i => i.s.includes("stale")).length
  };
  const nextActionClick = (e, it) => {
    e.stopPropagation();
    const tgt = it.next.target;
    if (tgt === "issue") actions.openIssue(it.key);else actions.navigate(tgt, it.key);
  };
  const lifecycles = ["", ...Array.from(new Set(window.WBData.issues.map(i => i.lifecycle)))];
  const surfaces = ["", ...window.WBData.surfaces];
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-page wb-page-wide"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-page-head"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "eyebrow wb-mb-8"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "layout-grid",
    size: 13
  }), " Cockpit"), /*#__PURE__*/React.createElement("div", {
    className: "wb-page-title"
  }, "Work Queue"), /*#__PURE__*/React.createElement("div", {
    className: "wb-page-desc"
  }, "Every governed AI delivery run in one place \u2014 what needs attention, what stage it is in, and the next best action. Click any issue to open its command center.")), /*#__PURE__*/React.createElement("div", {
    className: "wb-spacer"
  }), /*#__PURE__*/React.createElement(Btn, {
    variant: "secondary",
    icon: "refresh-cw",
    onClick: () => actions.toast("info", "Syncing Jira (simulated)", "No real Jira connection — demo mode.")
  }, "Sync Jira")), /*#__PURE__*/React.createElement("div", {
    className: "wb-grid wb-grid-4 wb-mb-16"
  }, /*#__PURE__*/React.createElement(StatTile, {
    label: "Active runs",
    icon: "workflow",
    value: totals.all,
    meta: "across 7 finance domains"
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "Needs human review",
    icon: "alert-triangle",
    value: totals.review,
    meta: totals.review ? "awaiting reviewer gate" : "all clear",
    metaTone: totals.review ? "warn" : "safe"
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "Failed verification",
    icon: "x-circle",
    value: totals.failed,
    meta: totals.failed ? "blocked — fixes required" : "none",
    metaTone: totals.failed ? "danger" : "safe"
  }), /*#__PURE__*/React.createElement(StatTile, {
    label: "Stale downstream",
    icon: "ban",
    value: totals.stale,
    meta: totals.stale ? "re-run required after redo" : "none",
    metaTone: totals.stale ? "warn" : "safe"
  })), /*#__PURE__*/React.createElement("div", {
    className: "wb-filterbar"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-search"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "search",
    size: 16
  }), /*#__PURE__*/React.createElement("input", {
    placeholder: "Search issues by key or title\u2026",
    value: f.search,
    onChange: e => actions.setFilter({
      search: e.target.value
    })
  })), /*#__PURE__*/React.createElement("div", {
    className: "wb-select",
    style: {
      width: 160
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: f.lifecycle,
    onChange: e => actions.setFilter({
      lifecycle: e.target.value
    })
  }, lifecycles.map(l => /*#__PURE__*/React.createElement("option", {
    key: l,
    value: l
  }, l || "All lifecycle states"))), /*#__PURE__*/React.createElement(Icon, {
    name: "chevrons-up-down",
    size: 15,
    className: "wb-select-ico"
  })), /*#__PURE__*/React.createElement("div", {
    className: "wb-select",
    style: {
      width: 150
    }
  }, /*#__PURE__*/React.createElement("select", {
    value: f.surface,
    onChange: e => actions.setFilter({
      surface: e.target.value
    })
  }, surfaces.map(l => /*#__PURE__*/React.createElement("option", {
    key: l,
    value: l
  }, l || "All surfaces"))), /*#__PURE__*/React.createElement(Icon, {
    name: "chevrons-up-down",
    size: 15,
    className: "wb-select-ico"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "wb-filterbar"
  }, /*#__PURE__*/React.createElement(QueueChip, {
    icon: "user",
    active: f.assignedToMe,
    onClick: () => actions.setFilter({
      assignedToMe: !f.assignedToMe
    })
  }, "Assigned to me"), /*#__PURE__*/React.createElement(QueueChip, {
    icon: "git-pull-request",
    active: f.hasPR,
    onClick: () => actions.setFilter({
      hasPR: !f.hasPR
    })
  }, "Has PR"), /*#__PURE__*/React.createElement(QueueChip, {
    icon: "alert-triangle",
    active: f.needsReview,
    onClick: () => actions.setFilter({
      needsReview: !f.needsReview
    })
  }, "Needs review"), /*#__PURE__*/React.createElement(QueueChip, {
    icon: "x-circle",
    active: f.failed,
    onClick: () => actions.setFilter({
      failed: !f.failed
    })
  }, "Failed verification"), /*#__PURE__*/React.createElement(QueueChip, {
    icon: "ban",
    active: f.stale,
    onClick: () => actions.setFilter({
      stale: !f.stale
    })
  }, "Stale downstream"), (f.assignedToMe || f.hasPR || f.needsReview || f.failed || f.stale || f.lifecycle || f.surface || f.search) && /*#__PURE__*/React.createElement("div", {
    className: "wb-chip",
    onClick: () => actions.setFilter({
      search: "",
      assignedToMe: false,
      lifecycle: "",
      surface: "",
      hasPR: false,
      needsReview: false,
      failed: false,
      stale: false
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 13
  }), "Clear"), /*#__PURE__*/React.createElement("div", {
    className: "wb-spacer",
    style: {
      marginLeft: "auto"
    }
  }), /*#__PURE__*/React.createElement("span", {
    className: "wb-text-sm wb-muted"
  }, filtered.length, " of ", issues.length)), /*#__PURE__*/React.createElement(Card, {
    className: "wb-card--flat",
    style: {
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-table-wrap cr-scroll"
  }, /*#__PURE__*/React.createElement("table", {
    className: "wb-table"
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, /*#__PURE__*/React.createElement("th", null, "Issue"), /*#__PURE__*/React.createElement("th", null, "Title"), /*#__PURE__*/React.createElement("th", null, "Domain"), /*#__PURE__*/React.createElement("th", null, "Surface"), /*#__PURE__*/React.createElement("th", null, "Lifecycle"), /*#__PURE__*/React.createElement("th", null, "Current AI Stage"), /*#__PURE__*/React.createElement("th", null, "Last Run"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "center"
    }
  }, "Artifacts"), /*#__PURE__*/React.createElement("th", null, "Branch"), /*#__PURE__*/React.createElement("th", {
    style: {
      textAlign: "center"
    }
  }, "PR"), /*#__PURE__*/React.createElement("th", null, "Next Action"), /*#__PURE__*/React.createElement("th", null, "Risk"))), /*#__PURE__*/React.createElement("tbody", null, filtered.map(it => {
    const cs = currentStage(it);
    return /*#__PURE__*/React.createElement("tr", {
      key: it.key,
      onClick: () => actions.openIssue(it.key)
    }, /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement("span", {
      className: "wb-row-key"
    }, it.key)), /*#__PURE__*/React.createElement("td", {
      style: {
        minWidth: 210
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "wb-row-title"
    }, it.title)), /*#__PURE__*/React.createElement("td", {
      className: "wb-secondary wb-nowrap"
    }, it.domain), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(SurfaceBadge, {
      value: it.surface
    })), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(LifecycleBadge, {
      value: it.lifecycle
    })), /*#__PURE__*/React.createElement("td", {
      className: "wb-nowrap"
    }, /*#__PURE__*/React.createElement("div", {
      className: "wb-flex",
      style: {
        gap: 7
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "wb-secondary",
      style: {
        fontSize: 12.5
      }
    }, cs.def.name), /*#__PURE__*/React.createElement(StatusBadge, {
      status: cs.status
    }))), /*#__PURE__*/React.createElement("td", {
      className: "wb-mono wb-muted wb-nowrap",
      style: {
        fontSize: 12
      }
    }, it.lastRun), /*#__PURE__*/React.createElement("td", {
      style: {
        textAlign: "center"
      }
    }, /*#__PURE__*/React.createElement("span", {
      className: "wb-mono"
    }, it.artifacts)), /*#__PURE__*/React.createElement("td", {
      className: "wb-mono wb-muted",
      style: {
        fontSize: 11.5,
        maxWidth: 150,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap"
      }
    }, it.branch), /*#__PURE__*/React.createElement("td", {
      style: {
        textAlign: "center"
      }
    }, it.pr ? /*#__PURE__*/React.createElement("span", {
      className: "wb-mono wb-strong",
      style: {
        color: "var(--accent-text)"
      }
    }, "#", it.pr) : /*#__PURE__*/React.createElement("span", {
      className: "wb-muted"
    }, "\u2014")), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(Btn, {
      size: "sm",
      variant: "secondary",
      iconRight: "arrow-right",
      onClick: e => nextActionClick(e, it)
    }, it.next.label)), /*#__PURE__*/React.createElement("td", null, /*#__PURE__*/React.createElement(RiskBadge, {
      risk: it.risk
    })));
  })))), filtered.length === 0 && /*#__PURE__*/React.createElement(EmptyState, {
    icon: "search",
    title: "No issues match these filters",
    action: /*#__PURE__*/React.createElement(Btn, {
      variant: "secondary",
      onClick: () => actions.setFilter({
        search: "",
        assignedToMe: false,
        lifecycle: "",
        surface: "",
        hasPR: false,
        needsReview: false,
        failed: false,
        stale: false
      })
    }, "Clear filters")
  }, "Try removing a filter or clearing the search.")));
}
Object.assign(window, {
  WorkQueue,
  currentStage
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "workbench/screen-workqueue.jsx", error: String((e && e.message) || e) }); }

// workbench/shell.jsx
try { (() => {
/* ============================================================
   AI Delivery Workbench — App shell + overlay hosts
   ============================================================ */
const {
  useApp
} = window;
const {
  useState: _useState,
  useEffect: _useEffect
} = React;
const NAV = [{
  group: "Workflow",
  items: [{
    id: "queue",
    label: "Work Queue",
    icon: "layout-grid"
  }, {
    id: "issue",
    label: "Issue Detail",
    icon: "workflow"
  }, {
    id: "artifacts",
    label: "Artifacts",
    icon: "file-code"
  }, {
    id: "github",
    label: "GitHub / PR",
    icon: "git-pull-request"
  }, {
    id: "validation",
    label: "Validation Evidence",
    icon: "flask"
  }]
}, {
  group: "Platform",
  items: [{
    id: "architecture",
    label: "Architecture",
    icon: "network"
  }, {
    id: "settings",
    label: "Settings",
    icon: "sliders"
  }]
}];
const ROUTE_TITLES = {
  queue: "Work Queue",
  issue: "Issue Detail",
  artifacts: "Artifacts",
  github: "GitHub / PR",
  validation: "Validation Evidence",
  architecture: "Architecture",
  settings: "Settings"
};
function BrandMark() {
  return /*#__PURE__*/React.createElement("svg", {
    className: "wb-brand-mark",
    viewBox: "0 0 32 32",
    fill: "none",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M11.5 11.5 H20.5 V20.5 H11.5 Z",
    fill: "var(--accent)"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "3.4",
    y: "3.4",
    width: "17.2",
    height: "17.2",
    rx: "4.2",
    stroke: "var(--accent)",
    strokeWidth: "2.4"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "11.4",
    y: "11.4",
    width: "17.2",
    height: "17.2",
    rx: "4.2",
    stroke: "var(--text-primary)",
    strokeWidth: "2.4"
  }));
}
function Sidebar() {
  const {
    state,
    actions
  } = useApp();
  const issues = window.WBData.issues;
  const needsReview = Object.values(state.issues).filter(i => i.flags.needsReview || i.s.includes("review")).length;
  const failed = Object.values(state.issues).filter(i => i.s.includes("fail")).length;
  const counts = {
    queue: issues.length,
    github: needsReview || null,
    validation: failed || null
  };
  return /*#__PURE__*/React.createElement("aside", {
    className: "wb-side"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-brand"
  }, /*#__PURE__*/React.createElement(BrandMark, null), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    className: "wb-brand-name"
  }, "AI Delivery Workbench"), /*#__PURE__*/React.createElement("div", {
    className: "wb-brand-sub"
  }, "Governed AI SDLC"))), /*#__PURE__*/React.createElement("nav", {
    className: "wb-nav cr-scroll"
  }, NAV.map(sec => /*#__PURE__*/React.createElement(React.Fragment, {
    key: sec.group
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-nav-label"
  }, sec.group), sec.items.map(it => /*#__PURE__*/React.createElement("div", {
    key: it.id,
    className: "wb-nav-item" + (state.route === it.id ? " is-active" : ""),
    onClick: () => actions.navigate(it.id)
  }, /*#__PURE__*/React.createElement(Icon, {
    name: it.icon,
    size: 17,
    className: "wb-nav-ico"
  }), /*#__PURE__*/React.createElement("span", null, it.label), counts[it.id] != null && /*#__PURE__*/React.createElement("span", {
    className: "wb-nav-count"
  }, counts[it.id])))))), /*#__PURE__*/React.createElement("div", {
    className: "wb-side-foot"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-user"
  }, /*#__PURE__*/React.createElement(Avatar, {
    name: window.WBData.meta.user.name
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-user-meta"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-user-name"
  }, window.WBData.meta.user.name), /*#__PURE__*/React.createElement("div", {
    className: "wb-user-role"
  }, window.WBData.meta.user.role)))));
}
function useTheme() {
  const [theme, setTheme] = _useState(() => localStorage.getItem("wb-theme") || "light");
  _useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("wb-theme", theme);
  }, [theme]);
  return [theme, setTheme];
}
function Header({
  theme,
  setTheme
}) {
  const {
    state,
    actions
  } = useApp();
  const issue = state.issues[state.selectedKey];
  const showIssue = ["issue", "artifacts", "github", "validation"].includes(state.route);
  return /*#__PURE__*/React.createElement("header", {
    className: "wb-header"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-crumbs"
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-crumb"
  }, "Workbench"), /*#__PURE__*/React.createElement("span", {
    className: "wb-crumb-sep"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 14
  })), /*#__PURE__*/React.createElement("span", {
    className: "wb-crumb" + (!showIssue ? " is-current" : "")
  }, ROUTE_TITLES[state.route]), showIssue && issue && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "wb-crumb-sep"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "chevron-right",
    size: 14
  })), /*#__PURE__*/React.createElement("span", {
    className: "wb-crumb is-current wb-mono"
  }, issue.key))), /*#__PURE__*/React.createElement("div", {
    className: "wb-disclaimer",
    title: window.WBData.meta.aboutNote
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-dot"
  }), window.WBData.meta.disclaimer), /*#__PURE__*/React.createElement("div", {
    className: "wb-header-actions"
  }, /*#__PURE__*/React.createElement(IconBtn, {
    icon: theme === "dark" ? "info" : "info",
    size: "sm",
    title: "About this prototype",
    onClick: () => actions.openModal({
      title: "About this prototype",
      icon: "shield-check",
      body: /*#__PURE__*/React.createElement("div", {
        className: "wb-stack-sm"
      }, /*#__PURE__*/React.createElement("p", null, window.WBData.meta.aboutNote), /*#__PURE__*/React.createElement("p", {
        className: "wb-text-sm wb-muted"
      }, "Clean-room build \xB7 no previous-employer code, data, prompts, schemas, or branding \xB7 synthetic finance-software themes only.")),
      confirmLabel: "Got it"
    })
  }), /*#__PURE__*/React.createElement(IconBtn, {
    icon: theme === "dark" ? "zap" : "box",
    size: "sm",
    title: theme === "dark" ? "Switch to light" : "Switch to dark",
    onClick: () => setTheme(theme === "dark" ? "light" : "dark")
  })));
}

/* ---------- Toast host ---------- */
function ToastHost() {
  const {
    state,
    actions
  } = useApp();
  const map = {
    success: "check-circle",
    warn: "alert-triangle",
    error: "x-circle",
    info: "info"
  };
  const titleMap = {
    success: "Success",
    warn: "Warning",
    error: "Error",
    info: "Working"
  };
  if (!state.toasts.length) return null;
  return /*#__PURE__*/React.createElement("div", {
    className: "wb-toast-wrap"
  }, state.toasts.map(t => /*#__PURE__*/React.createElement("div", {
    key: t.id,
    className: "wb-toast wb-toast--" + t.kind + (t.leaving ? " is-leaving" : "")
  }, /*#__PURE__*/React.createElement(Icon, {
    name: map[t.kind],
    size: 18,
    className: "wb-toast-ico" + (t.kind === "info" ? "" : "")
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      minWidth: 0
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-toast-title"
  }, t.title || titleMap[t.kind]), t.msg && /*#__PURE__*/React.createElement("div", {
    className: "wb-toast-msg"
  }, t.msg)), /*#__PURE__*/React.createElement("button", {
    className: "wb-toast-close",
    onClick: () => actions.dispatch({
      type: "TOAST_REMOVE",
      id: t.id
    })
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "x",
    size: 15
  })))));
}

/* ---------- Drawer host (logs) ---------- */
function DrawerHost() {
  const {
    state,
    actions
  } = useApp();
  const d = state.drawer;
  if (!d) return null;
  const issue = state.issues[d.key];
  const stageDef = window.WBData.stageDefs.find(s => s.id === d.stageId);
  const lines = window.WBData.logsFor(issue, d.stageId);
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "wb-scrim",
    onClick: actions.closeDrawer
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-drawer"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-drawer-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-drawer-title"
  }, /*#__PURE__*/React.createElement(Icon, {
    name: "terminal",
    size: 16
  }), "Run logs \u2014 ", stageDef ? stageDef.name : d.stageId), /*#__PURE__*/React.createElement("div", {
    className: "wb-spacer",
    style: {
      marginLeft: "auto"
    }
  }), /*#__PURE__*/React.createElement(Badge, {
    tone: "neutral",
    icon: "hash"
  }, issue.key), /*#__PURE__*/React.createElement(IconBtn, {
    icon: "x",
    size: "sm",
    title: "Close",
    onClick: actions.closeDrawer,
    style: {
      marginLeft: 8
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "wb-drawer-body cr-scroll"
  }, /*#__PURE__*/React.createElement(Banner, {
    tone: "neutral",
    icon: "info"
  }, "Logs are simulated for this interview prototype. No real execution occurred."), /*#__PURE__*/React.createElement("div", {
    className: "wb-code wb-mt-12",
    style: {
      border: "1px solid var(--border-subtle)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-code-body",
    style: {
      whiteSpace: "pre-wrap"
    }
  }, lines.map((l, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      color: /FAIL|error|non-zero/.test(l) ? "var(--danger)" : /audit|done|exit: 0|complete/.test(l) ? "var(--safe)" : "var(--text-secondary)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    className: "wb-muted"
  }, String(i + 1).padStart(2, "0")), "  ", l)))))));
}

/* ---------- Modal host ---------- */
function ModalHost() {
  const {
    state,
    actions
  } = useApp();
  const m = state.modal;
  if (!m) return null;
  const onConfirm = () => {
    if (m.onConfirm) m.onConfirm();
    actions.closeModal();
  };
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "wb-scrim",
    onClick: actions.closeModal
  }), /*#__PURE__*/React.createElement("div", {
    className: "wb-modal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-modal-head"
  }, /*#__PURE__*/React.createElement("div", {
    className: "wb-modal-title",
    style: {
      display: "flex",
      alignItems: "center",
      gap: 9
    }
  }, m.icon && /*#__PURE__*/React.createElement(Icon, {
    name: m.icon,
    size: 19,
    style: {
      color: m.tone ? "var(--" + m.tone + ")" : "var(--accent)"
    }
  }), m.title)), /*#__PURE__*/React.createElement("div", {
    className: "wb-modal-body"
  }, m.body), /*#__PURE__*/React.createElement("div", {
    className: "wb-modal-foot"
  }, m.onConfirm && /*#__PURE__*/React.createElement(Btn, {
    variant: "ghost",
    onClick: actions.closeModal
  }, m.cancelLabel || "Cancel"), /*#__PURE__*/React.createElement(Btn, {
    variant: m.tone === "danger" ? "danger" : "primary",
    onClick: onConfirm
  }, m.confirmLabel || "Confirm"))));
}
Object.assign(window, {
  Sidebar,
  Header,
  ToastHost,
  DrawerHost,
  ModalHost,
  useTheme,
  BrandMark
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "workbench/shell.jsx", error: String((e && e.message) || e) }); }

// workbench/store.jsx
try { (() => {
/* ============================================================
   AI Delivery Workbench — App state store
   A small React context store that simulates the platform's
   services entirely in local state: stage runs with timed
   loading, stale cascades, toasts, drawers, modals, PR &
   validation state. No external calls.
   ============================================================ */
const {
  createContext,
  useContext,
  useReducer,
  useRef,
  useCallback
} = React;
const STAGE_IDS = window.WBData.stageDefs.map(s => s.id);
const stageIdx = id => STAGE_IDS.indexOf(id);
function cloneIssues() {
  const map = {};
  window.WBData.issues.forEach(it => {
    map[it.key] = {
      ...it,
      s: [...it.s],
      flags: {
        ...it.flags
      }
    };
  });
  return map;
}
const initialState = {
  route: "queue",
  selectedKey: "FIN-1150",
  issues: cloneIssues(),
  toasts: [],
  drawer: null,
  modal: null,
  selectedArtifact: {},
  prState: {},
  // key -> { reviewed, status, checks override, approvedForValidation }
  valState: {},
  // key -> { decision, scenarioStatus overrides... }
  settings: JSON.parse(JSON.stringify(window.WBData.settings)),
  busy: {},
  filters: {
    search: "",
    assignedToMe: false,
    lifecycle: "",
    surface: "",
    hasPR: false,
    needsReview: false,
    failed: false,
    stale: false
  }
};
let TID = 0;
function reducer(state, a) {
  switch (a.type) {
    case "ROUTE":
      return {
        ...state,
        route: a.route,
        selectedKey: a.key || state.selectedKey
      };
    case "SELECT_ISSUE":
      return {
        ...state,
        selectedKey: a.key,
        route: a.route || "issue"
      };
    case "SET_STAGE":
      {
        const it = state.issues[a.key];
        if (!it) return state;
        const s = [...it.s];
        s[a.idx] = a.status;
        return {
          ...state,
          issues: {
            ...state.issues,
            [a.key]: {
              ...it,
              s
            }
          }
        };
      }
    case "PATCH_ISSUE":
      {
        const it = state.issues[a.key];
        if (!it) return state;
        return {
          ...state,
          issues: {
            ...state.issues,
            [a.key]: {
              ...it,
              ...a.patch,
              flags: {
                ...it.flags,
                ...(a.patch.flags || {})
              }
            }
          }
        };
      }
    case "STALE_FROM":
      {
        const it = state.issues[a.key];
        if (!it) return state;
        const s = it.s.map((v, i) => i >= a.fromIdx && v === "done" ? "stale" : v);
        return {
          ...state,
          issues: {
            ...state.issues,
            [a.key]: {
              ...it,
              s,
              flags: {
                ...it.flags,
                staleDownstream: true
              }
            }
          }
        };
      }
    case "TOAST_ADD":
      return {
        ...state,
        toasts: [...state.toasts, a.toast]
      };
    case "TOAST_LEAVE":
      return {
        ...state,
        toasts: state.toasts.map(t => t.id === a.id ? {
          ...t,
          leaving: true
        } : t)
      };
    case "TOAST_REMOVE":
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== a.id)
      };
    case "DRAWER":
      return {
        ...state,
        drawer: a.drawer
      };
    case "MODAL":
      return {
        ...state,
        modal: a.modal
      };
    case "SELECT_ARTIFACT":
      return {
        ...state,
        selectedArtifact: {
          ...state.selectedArtifact,
          [a.key]: a.name
        }
      };
    case "PR":
      return {
        ...state,
        prState: {
          ...state.prState,
          [a.key]: {
            ...(state.prState[a.key] || {}),
            ...a.patch
          }
        }
      };
    case "VAL":
      return {
        ...state,
        valState: {
          ...state.valState,
          [a.key]: {
            ...(state.valState[a.key] || {}),
            ...a.patch
          }
        }
      };
    case "BUSY":
      return {
        ...state,
        busy: {
          ...state.busy,
          [a.id]: a.on
        }
      };
    case "FILTER":
      return {
        ...state,
        filters: {
          ...state.filters,
          ...a.patch
        }
      };
    case "TOGGLE_GOV":
      {
        const gov = state.settings.governance.map(g => g.id === a.id && !g.locked ? {
          ...g,
          on: !g.on
        } : g);
        return {
          ...state,
          settings: {
            ...state.settings,
            governance: gov
          }
        };
      }
    default:
      return state;
  }
}
const AppCtx = createContext(null);
function AppProvider({
  children
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const toast = useCallback((kind, title, msg) => {
    const id = "t" + ++TID;
    dispatch({
      type: "TOAST_ADD",
      toast: {
        id,
        kind,
        title,
        msg
      }
    });
    setTimeout(() => dispatch({
      type: "TOAST_LEAVE",
      id
    }), 4200);
    setTimeout(() => dispatch({
      type: "TOAST_REMOVE",
      id
    }), 4600);
    return id;
  }, []);
  const navigate = useCallback((route, key) => dispatch({
    type: "ROUTE",
    route,
    key
  }), []);
  const openIssue = useCallback(key => dispatch({
    type: "SELECT_ISSUE",
    key,
    route: "issue"
  }), []);
  const openLogs = useCallback((key, stageId) => dispatch({
    type: "DRAWER",
    drawer: {
      type: "logs",
      key,
      stageId
    }
  }), []);
  const closeDrawer = useCallback(() => dispatch({
    type: "DRAWER",
    drawer: null
  }), []);
  const openModal = useCallback(modal => dispatch({
    type: "MODAL",
    modal
  }), []);
  const closeModal = useCallback(() => dispatch({
    type: "MODAL",
    modal: null
  }), []);
  const selectArtifact = useCallback((key, name) => dispatch({
    type: "SELECT_ARTIFACT",
    key,
    name
  }), []);

  // Run a stage with simulated loading
  const runStage = useCallback((key, stageId, opts = {}) => {
    const idx = stageIdx(stageId);
    const def = window.WBData.stageDefs[idx];
    dispatch({
      type: "SET_STAGE",
      key,
      idx,
      status: "run"
    });
    dispatch({
      type: "BUSY",
      id: key + ":" + stageId,
      on: true
    });
    toast("info", "Running " + def.name + "…", "Simulated execution in a clean workspace — no external writes.");
    setTimeout(() => {
      const status = opts.failStatus || "done";
      dispatch({
        type: "SET_STAGE",
        key,
        idx,
        status
      });
      dispatch({
        type: "BUSY",
        id: key + ":" + stageId,
        on: false
      });
      if (opts.lifecycle) dispatch({
        type: "PATCH_ISSUE",
        key,
        patch: {
          lifecycle: opts.lifecycle
        }
      });
      if (opts.onDone) opts.onDone();
      if (status === "done") {
        toast("success", def.name + " complete", opts.doneMsg || "Artifacts recorded with prompt provenance.");
      } else {
        toast("error", def.name + " failed", opts.failMsg || "Verification failed — see logs and retry.");
      }
    }, opts.delay || 1300);
  }, [toast]);
  const setStage = useCallback((key, stageId, status) => dispatch({
    type: "SET_STAGE",
    key,
    idx: stageIdx(stageId),
    status
  }), []);
  const staleFrom = useCallback((key, stageId) => dispatch({
    type: "STALE_FROM",
    key,
    fromIdx: stageIdx(stageId)
  }), []);
  const patchIssue = useCallback((key, patch) => dispatch({
    type: "PATCH_ISSUE",
    key,
    patch
  }), []);
  const setPR = useCallback((key, patch) => dispatch({
    type: "PR",
    key,
    patch
  }), []);
  const setVal = useCallback((key, patch) => dispatch({
    type: "VAL",
    key,
    patch
  }), []);
  const setFilter = useCallback(patch => dispatch({
    type: "FILTER",
    patch
  }), []);
  const toggleGov = useCallback(id => dispatch({
    type: "TOGGLE_GOV",
    id
  }), []);
  const actions = {
    toast,
    navigate,
    openIssue,
    openLogs,
    closeDrawer,
    openModal,
    closeModal,
    selectArtifact,
    runStage,
    setStage,
    staleFrom,
    patchIssue,
    setPR,
    setVal,
    setFilter,
    toggleGov,
    dispatch
  };
  return /*#__PURE__*/React.createElement(AppCtx.Provider, {
    value: {
      state,
      actions
    }
  }, children);
}
function useApp() {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}

// Helper: the live (mutable) issue object
function useIssue(key) {
  const {
    state
  } = useApp();
  return state.issues[key];
}
Object.assign(window, {
  AppProvider,
  useApp,
  useIssue,
  stageIdx,
  STAGE_IDS
});
})(); } catch (e) { __ds_ns.__errors.push({ path: "workbench/store.jsx", error: String((e && e.message) || e) }); }

})();
