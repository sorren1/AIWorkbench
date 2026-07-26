# 30 — Optional Post-Interview Enhancements

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T30`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T29 COMPLETE and audit status READY.

## Read first
- `caseflow-build-kit/deliverables/FINAL_AUDIT.md`
- `caseflow-build-kit/project/RISK_REGISTER.md`
- `caseflow-build-kit/reference/CAPABILITY_PROBE_RESULTS.md`
- `caseflow-build-kit/docs/10-interviews/STAGE_5_RAVIV.md`

## Objective
Consider carefully bounded enhancements only after the interview-stable release exists.

## Instructions
1. Prioritize enhancements by interview value, reusable architecture value, risk, and cost.
2. Possible options: actual Connect AI Toolkit if account supports it; Connect Gateway private-source proof; optional Salesforce profile; PII masking demonstration; service-account design; additional dispute type; schema-drift dashboard; healthcare or insurance extension; recorded live agent-scaffold path.
3. For each selected enhancement, create a new task/ADR, test plan, claim boundary, and separate release version.
4. Do not modify the stable interview release without a new full gate and deployment binding.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- This task is optional.
- Protect the stable release from novelty-driven regressions.

## Required outputs
- Optional enhancement backlog or a deliberate `NO_CHANGE` decision
- New ADR/tasks only for approved enhancements

## Acceptance gate
- [ ] Every enhancement has a clear value and boundary.
- [ ] Stable release remains reproducible.
- [ ] No speculative feature is presented as current CData capability.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T30.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
