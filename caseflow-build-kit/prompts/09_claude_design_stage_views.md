# 09 — Claude Design Four-Stage Interaction Specification

**Executor:** Claude Design
**Task ID:** `T09`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T08 COMPLETE.

## Read first
- `caseflow-build-kit/CLAUDE.md`
- `caseflow-build-kit/docs/06-frontend/STAGE_VIEWS.md`
- `caseflow-build-kit/docs/10-interviews/PANEL_NARRATIVE.md`
- `caseflow-build-kit/docs/10-interviews/STAGE_2_NICK.md`
- `caseflow-build-kit/docs/10-interviews/STAGE_3_TECHNICAL.md`
- `caseflow-build-kit/docs/10-interviews/STAGE_4_MEERA.md`
- `caseflow-build-kit/docs/10-interviews/STAGE_5_RAVIV.md`
- `caseflow-build-kit/contracts/ui/stage-route-contract.json`
- `caseflow-build-kit/fixtures/replay/canonical-trace.json`

## Objective
Design four audience-specific routes over one canonical case, including timed guided tours and interruption-safe navigation.

## Instructions
1. Specify each route's section order, above-the-fold content, components, progressive disclosure, and exact primary takeaway.
2. Define a tour step map for 3-minute strategy, 7-minute technical, 3–5-minute operations, 90-second product, and optional 3-minute product tours.
3. Make every tour pausable, resumable, deep-linkable, keyboard-operable, and understandable if an interviewer interrupts at any point.
4. Define the case reset and common context so all four interviewers discuss the same facts.
5. Create an interaction-state matrix covering replay actions, approval simulation, failure injection, idempotent replay, and reconciliation.
6. Define content truncation/expansion rules so the UI remains concise without hiding evidence.

## Non-negotiable constraints
- No architecture or factual changes.
- No auto-play or time-dependent behavior required for correctness.
- No route may assume the interviewer saw a prior stage.
- No live-call presentation dependency.

## Required outputs
- `caseflow-build-kit/deliverables/design/strategy-view.md`
- `caseflow-build-kit/deliverables/design/technical-view.md`
- `caseflow-build-kit/deliverables/design/operations-view.md`
- `caseflow-build-kit/deliverables/design/product-view.md`
- `caseflow-build-kit/deliverables/design/interaction-state-matrix.json`
- `caseflow-build-kit/deliverables/design/tour-step-map.json`

## Acceptance gate
- [ ] All four views are independently understandable.
- [ ] Tour times and step purposes are explicit.
- [ ] State matrix covers success, block, conflict, failure, and reconciliation.
- [ ] Handoff is implementable without design guesswork.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T09.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
