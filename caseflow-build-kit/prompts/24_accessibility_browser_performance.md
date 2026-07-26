# 24 — Accessibility, Browser, Visual, and Performance Gates

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T24`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T23 COMPLETE.

## Read first
- `caseflow-build-kit/docs/06-frontend/ACCESSIBILITY.md`
- `caseflow-build-kit/docs/06-frontend/RESPONSIVE.md`
- `caseflow-build-kit/docs/08-testing/RELEASE_GATES.md`
- `caseflow-build-kit/deliverables/design/responsive-and-accessibility.md`

## Objective
Bring all four views to interview-grade accessibility, responsiveness, cross-browser stability, visual consistency, and performance.

## Instructions
1. Add Playwright coverage for direct stage routes, guided tours, keyboard flows, reset, no external network, and existing-site no-link assertions.
2. Run axe on every stage/state and manually verify keyboard focus, heading order, landmarks, tables, dialogs, live regions, and reduced motion.
3. Create deterministic desktop/tablet/mobile visual captures using fixed viewport, clock, data, fonts, and reduced motion.
4. Set and enforce reasonable CaseFlow bundle and Lighthouse budgets without weakening existing repository budgets.
5. Test Chromium, Firefox, and WebKit if supported by existing pipeline.
6. Verify Teams-friendly readability at 1280×720 and 110–125% zoom.
7. Fix all serious/critical accessibility findings and material visual overflow.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Do not solve performance by removing necessary disclosure/evidence.
- Do not relax existing global quality gates.

## Required outputs
- CaseFlow browser/accessibility/visual/performance tests
- Deterministic captures
- Performance baseline and audit report

## Acceptance gate
- [ ] Zero serious/critical axe finding.
- [ ] All critical keyboard flows work.
- [ ] Four routes pass supported browsers and responsive captures.
- [ ] No unexpected external network.
- [ ] Performance budgets pass.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T24.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
