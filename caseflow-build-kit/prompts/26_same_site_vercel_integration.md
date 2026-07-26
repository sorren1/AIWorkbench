# 26 — Same-Site Vercel Integration

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T26`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T25 COMPLETE or COMPLETE_WITH_LIMITATION.

## Read first
- `caseflow-build-kit/docs/09-deployment/SAME_SITE_INTEGRATION.md`
- `caseflow-build-kit/docs/09-deployment/VERCEL_ROUTE_CONTRACT.md`
- `caseflow-build-kit/reference/EXISTING_SITE_INSPECTION.md`
- `caseflow-build-kit/deliverables/repository-preflight.md`
- `caseflow-build-kit/contracts/ui/stage-route-contract.json`

## Objective
Integrate CaseFlow into the existing Vite/Vercel build under direct-only routes without changing existing Workbench navigation or behavior.

## Instructions
1. Add/verify the CaseFlow Vite input and production emission path according to actual repository plugin behavior.
2. Extend page metadata/page-kind handling safely and add CaseFlow noindex/noarchive metadata.
3. Add Vercel rewrites for base and stage routes, plus noindex header where supported, while preserving all existing redirects/rewrites/headers.
4. Update robots generation to disallow CaseFlow and keep it out of sitemap.
5. Add static/browser tests asserting zero links from existing homepage, Workbench, article, and demo.
6. Run every existing Workbench gate plus CaseFlow gates. Resolve compatibility regressions rather than weakening tests.
7. Build and preview locally; test direct URLs and asset paths.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Do not add CaseFlow to sitemap or navigation.
- Do not broaden CSP for live calls.
- Do not remove or rewrite existing release evidence.

## Required outputs
- Updated Vite/plugin/Vercel/metadata/robots configuration
- Same-site compatibility tests
- Local production preview evidence

## Acceptance gate
- [ ] All required `/caseflow/*` routes load in production preview.
- [ ] Existing routes and gates pass.
- [ ] No existing page links to CaseFlow.
- [ ] Noindex/robots/sitemap rules pass.
- [ ] CSP remains restrictive.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T26.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
