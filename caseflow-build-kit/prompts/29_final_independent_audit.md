# 29 — Final Independent Audit

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T29`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T28 COMPLETE.

## Read first
- `caseflow-build-kit/project/DEFINITION_OF_DONE.md`
- `caseflow-build-kit/project/status.json`
- `caseflow-build-kit/project/RISK_REGISTER.md`
- `caseflow-build-kit/reference/CLAIM_BOUNDARIES.md`
- `caseflow-build-kit/docs/08-testing/RELEASE_GATES.md`
- `caseflow-build-kit/deliverables/interview/one-page-cheat-sheet.md`

## Objective
Audit the completed project as a skeptical technical interviewer, security reviewer, customer-experience leader, and CPTO. Do not merely rerun tests.

## Instructions
1. Verify every Definition of Done item with a concrete source, command, or hosted evidence reference.
2. Review the four routes as four different interviewers and identify ambiguity, overclaiming, missing business context, missing failure behavior, or unnecessary detail.
3. Review source architecture for accidental coupling, arbitrary tool access, authorization gaps, idempotency flaws, and public/local boundary violations.
4. Review all CData claims against the actual capability probe and current official sources.
5. Review existing Workbench compatibility and release evidence lineage.
6. Run a clean-clone reproduction of build/tests/public replay when feasible.
7. Write a final audit with severity, evidence, and decision. Fix critical/high findings and rerun affected gates.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Do not waive high findings for schedule reasons.
- Do not expand scope beyond defects or critical clarity fixes.

## Required outputs
- `caseflow-build-kit/deliverables/FINAL_AUDIT.md`
- Completed Definition of Done evidence matrix
- Resolved findings and final gate output

## Acceptance gate
- [ ] Zero unresolved critical/high finding.
- [ ] Every mandatory DoD item is evidenced or explicitly marked not complete.
- [ ] Hosted artifact and source evidence agree.
- [ ] Final audit declares READY or NOT READY with defensible reasons.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T29.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
