# 22 — Observability, Evaluations, and Failure Injection

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T22`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T21 COMPLETE.

## Read first
- `caseflow-build-kit/docs/07-backend/OBSERVABILITY.md`
- `caseflow-build-kit/docs/08-testing/EVALUATION_PLAN.md`
- `caseflow-build-kit/docs/08-testing/FAILURE_INJECTION.md`
- `caseflow-build-kit/docs/00-product/SUCCESS_METRICS.md`
- `caseflow-build-kit/contracts/schemas/audit-event.schema.json`

## Objective
Prove the system behaves safely under failure and make the measured evidence visible in the technical and operations views.

## Instructions
1. Implement trace/span/event capture with safe attributes and deterministic correlation IDs in tests/replay.
2. Implement all mandatory failure injections F-001 through F-014 where applicable; document any production-design-only injection.
3. Implement evaluation runner for gold cases, evidence completeness, unsupported claims, blocked writes, duplicate prevention, partial failure, and handoff completeness.
4. Generate machine-readable and public-safe evaluation summaries from current code, replacing planning values.
5. Add tool/query count and latency measurement for mock/local runs; clearly label measurements and environment.
6. Update technical/operations/product views to consume generated summaries rather than hard-coded metrics.
7. Enforce heightened coverage thresholds.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Do not invent latency or customer ROI.
- Do not use an LLM-only judge as the release authority.
- No public raw stack traces.

## Required outputs
- Evaluation/failure runner
- Generated evaluation and trace summaries
- Updated views/metrics
- Coverage evidence

## Acceptance gate
- [ ] All gold cases pass.
- [ ] All mandatory failure behaviors pass or have explicit design-only limitation.
- [ ] Unsupported claims are zero.
- [ ] No unauthorized or duplicate action succeeds.
- [ ] Metrics are generated and correctly classified.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T22.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
