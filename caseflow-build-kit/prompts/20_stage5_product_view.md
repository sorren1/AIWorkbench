# 20 — Stage 5 Product Leverage View

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T20`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T19 COMPLETE.

## Read first
- `caseflow-build-kit/deliverables/design/product-view.md`
- `caseflow-build-kit/docs/10-interviews/STAGE_5_RAVIV.md`
- `caseflow-build-kit/docs/10-interviews/PANEL_NARRATIVE.md`
- `caseflow-build-kit/templates/PRODUCT_FRICTION_ITEM.md`
- `caseflow-build-kit/project/CHANGE_CONTROL.md`

## Objective
Implement the executive lens that converts one synthetic engagement into reusable architecture, field learning, and product leverage.

## Instructions
1. Implement a concise outcome and architecture thesis above the fold.
2. Implement a matrix separating customer-specific mappings/policy from reusable discovery, source, tool, approval, evaluation, operations, and product assets.
3. Implement a reusable blueprint/layer view and next-customer adaptation flow.
4. Implement product-friction items using evidence, customer impact, and disposition categories: configuration, documentation, FDE reference pattern, or platform opportunity.
5. Do not assert an internal roadmap or label friction as a defect without evidence.
6. Implement measured reusability indicators from repository structure/tests, and label targets versus measurements.
7. Add the 90-second and 3-minute content variants in the same view without duplicating data.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Executive view must not be a code tour.
- No speculative CData criticism.
- Keep claims measurable and bounded.

## Required outputs
- Completed `/caseflow/product` view
- Product friction/reuse artifacts
- Stage 5 tests and capture

## Acceptance gate
- [ ] Executive takeaway is understandable in 30 seconds.
- [ ] Reusable versus customer-specific assets are explicit.
- [ ] Product feedback is evidence-based and respectfully classified.
- [ ] View supports both 90-second and 3-minute paths.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T20.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
