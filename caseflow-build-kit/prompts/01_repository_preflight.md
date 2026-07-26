# 01 — Repository Preflight and Branch Baseline

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T01`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T00 COMPLETE.
- Working tree is available locally.

## Read first
- `caseflow-build-kit/AGENTS.md`
- `caseflow-build-kit/reference/EXISTING_SITE_INSPECTION.md`
- `caseflow-build-kit/docs/09-deployment/SAME_SITE_INTEGRATION.md`
- `caseflow-build-kit/project/status.json`

## Objective
Inspect the actual host repository, establish a clean baseline, and identify every compatibility point before creating CaseFlow code.

## Instructions
1. Verify repository remote, current branch, Node version contract, package manager, Vite inputs, custom build plugin, Vercel routing, security headers, sitemap/robots generation, release-evidence workflow, and test commands.
2. Run the existing fastest normal gate and record the exact result. If the full gate is affordable, run it; otherwise record why it is deferred.
3. Create `caseflow-build-kit/deliverables/repository-preflight.md` with current commit, dirty files, key file paths, route behavior, build-output behavior, likely files to change, and known risks.
4. Compare current repository reality to `reference/EXISTING_SITE_INSPECTION.md`. Record divergences; update planning documents only when evidence supports the change.
5. Confirm that `caseflow-build-kit/` is not unintentionally emitted into the public build.
6. Do not create the CaseFlow entrypoint yet.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Do not alter current production routes or dependencies in this task.
- Do not reset or discard unrelated user changes.

## Required outputs
- `caseflow-build-kit/deliverables/repository-preflight.md`
- Baseline command/test evidence in T01 status
- Any necessary correction to `reference/EXISTING_SITE_INSPECTION.md` with a decision-log entry

## Acceptance gate
- [ ] Repository and current commit are identified.
- [ ] Existing gate result is recorded.
- [ ] All expected integration touchpoints are listed.
- [ ] No product code was added.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T01.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
