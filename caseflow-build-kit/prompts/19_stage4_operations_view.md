# 19 — Stage 4 Operations and Customer Handoff View

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T19`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T18 COMPLETE.

## Read first
- `caseflow-build-kit/deliverables/design/operations-view.md`
- `caseflow-build-kit/docs/10-interviews/STAGE_4_MEERA.md`
- `caseflow-build-kit/contracts/schemas/support-handoff.schema.json`
- `caseflow-build-kit/docs/07-backend/ERROR_MODEL.md`
- `caseflow-build-kit/docs/08-testing/FAILURE_INJECTION.md`
- `caseflow-build-kit/templates/SUPPORT_HANDOFF.md`

## Objective
Implement the customer-trust, supportability, escalation, and handoff lens over the same technical workflow.

## Instructions
1. Implement customer-visible status and explanation that remain consistent with action receipts.
2. Implement source/workflow health, failure classification, customer impact, current owner, next update, and escalation presentation.
3. Implement RACI/ownership and a support handoff checklist generated from the canonical handoff contract.
4. Implement the partial-failure view showing what succeeded, what did not, why duplicate action is prevented, and who owns reconciliation.
5. Add training/adoption, known limitation, acceptance, and change-control panels.
6. Add tests for truthfulness across completed, failed-safe, conflict, and reconciliation states.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Avoid deep MCP implementation detail unless supporting an operational decision.
- Do not expose internal-only raw errors to the customer view.

## Required outputs
- Completed `/caseflow/operations` view
- Generated public support handoff
- Stage 4 tests and capture

## Acceptance gate
- [ ] A customer-facing leader can identify customer impact and owner immediately.
- [ ] Failure categories distinguish source, data, configuration, workflow, model, and product issues.
- [ ] Partial failure is truthful and actionable.
- [ ] Handoff is complete without relying on the original author.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T19.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
