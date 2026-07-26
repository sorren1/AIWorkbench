# 21 — Guided Interview Tours and Presenter Controls

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T21`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T20 COMPLETE.

## Read first
- `caseflow-build-kit/deliverables/design/tour-step-map.json`
- `caseflow-build-kit/deliverables/design/interaction-state-matrix.json`
- `caseflow-build-kit/docs/10-interviews/SHARED_20_SECOND_RESET.md`
- `caseflow-build-kit/docs/06-frontend/ACCESSIBILITY.md`
- `caseflow-build-kit/contracts/ui/stage-route-contract.json`

## Objective
Implement timeboxed, accessible, interruption-safe guided tours for all four interview stages.

## Instructions
1. Implement URL-addressable tour steps using query parameters or hashes, preserving the stage route.
2. Implement start, next, previous, pause, resume, exit, reset, keyboard help, and copy-link controls.
3. Ensure a step scrolls/focuses predictably without trapping the user and respects reduced motion.
4. Show optional presenter notes only in a local/presenter flag that is excluded from public build or contains only public-safe text.
5. Add elapsed/target timing assistance that does not auto-advance or create correctness dependency.
6. Test deep links, browser navigation, interruption/resume, keyboard behavior, mobile behavior, and reset determinism.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- No auto-play.
- No private interviewer names/notes in public static assets unless already intentionally public and necessary.
- Tour must not hide normal navigation.

## Required outputs
- Guided tour implementation
- All stage tour tests
- Presenter run sheet export or generated index

## Acceptance gate
- [ ] Every tour step has a stable deep link.
- [ ] Tours are fully keyboard-operable and reduced-motion safe.
- [ ] Interruption/resume works.
- [ ] Target durations are visible but not enforced by automation.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T21.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
