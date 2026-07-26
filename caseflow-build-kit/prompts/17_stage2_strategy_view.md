# 17 — Stage 2 Strategy and Discovery View

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T17`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T16 COMPLETE.

## Read first
- `caseflow-build-kit/deliverables/design/strategy-view.md`
- `caseflow-build-kit/docs/10-interviews/STAGE_2_NICK.md`
- `caseflow-build-kit/docs/01-discovery/ENGAGEMENT_BRIEF.md`
- `caseflow-build-kit/docs/01-discovery/DISCOVERY_QUESTION_BANK.md`
- `caseflow-build-kit/docs/01-discovery/SOURCE_AUTHORITY_MATRIX.md`
- `caseflow-build-kit/docs/01-discovery/PHASED_ROLLOUT.md`

## Objective
Implement the Director/hiring-manager lens over the canonical CaseFlow evidence and architecture.

## Instructions
1. Implement the strategy route according to the design handoff: problem/outcome, personas, discovery sample, source authority, assumptions, architecture, acceptance criteria, phased rollout, and concise result.
2. Use typed data and generated public evidence; do not duplicate case facts in components.
3. Add an explicit `What is customer-specific vs reusable` preview without taking over the Stage 5 narrative.
4. Add the Stage 2 claim/disclosure state and professional-evidence bridge panel marked as private presenter notes if it contains employer names.
5. Add component, responsive, keyboard, and visual tests for the route.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- The page must lead with business outcome, not implementation details.
- Private interviewer notes must not expose private recruiter details.

## Required outputs
- Completed `/caseflow/strategy` view
- Stage 2 tests and capture
- T17 completion report

## Acceptance gate
- [ ] A reviewer can understand the customer problem and architecture in under 60 seconds.
- [ ] All discovery/authority facts match canonical docs.
- [ ] Route works independently and at responsive breakpoints.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T17.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
