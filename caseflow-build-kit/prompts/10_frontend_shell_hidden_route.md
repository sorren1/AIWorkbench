# 10 — CaseFlow Frontend Shell and Hidden Route

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T10`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T09 COMPLETE.

## Read first
- `caseflow-build-kit/AGENTS.md`
- `caseflow-build-kit/deliverables/design/design-principles.md`
- `caseflow-build-kit/deliverables/design/tokens.json`
- `caseflow-build-kit/deliverables/design/component-specs.md`
- `caseflow-build-kit/deliverables/design/tour-step-map.json`
- `caseflow-build-kit/docs/09-deployment/SAME_SITE_INTEGRATION.md`
- `caseflow-build-kit/contracts/ui/stage-route-contract.json`

## Objective
Create the isolated CaseFlow React entrypoint, route selection, design tokens, public disclosure, and four empty-but-real stage shells without changing existing navigation.

## Instructions
1. Add `caseflow/index.html` and an isolated strict-TypeScript `src/caseflow/` entry.
2. Implement pathname-based stage selection and unknown-stage handling. Do not add a router dependency unless T02 explicitly approved it.
3. Implement the persistent shell, case reset, route-local navigation, mode/claim badges, disclosure panel, and accessible keyboard help from the design handoff.
4. Add the four stage shells with stable landmarks and placeholder components fed from typed fixture selectors—not lorem ipsum.
5. Add scoped `--cf-*` tokens/styles and local SVG icons. Ensure no collision with existing Workbench styles.
6. Add direct local Vite behavior for `/caseflow/strategy` etc. if needed through dev middleware or documented URL handling, but defer Vercel rewrites to T26.
7. Add initial unit/component tests and verify existing build inputs still work.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- No API/live integration yet.
- Do not modify homepage/Workbench content.
- No external assets, fonts, analytics, or trackers.

## Required outputs
- `caseflow/index.html`
- `src/caseflow/**` shell/design implementation
- Initial frontend tests
- T10 completion report

## Acceptance gate
- [ ] Four stage shells render from direct local paths.
- [ ] Disclosure and replay mode are visible.
- [ ] No existing page links to CaseFlow.
- [ ] Build/type/lint/component tests pass.
- [ ] No style leakage into Workbench.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T10.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
