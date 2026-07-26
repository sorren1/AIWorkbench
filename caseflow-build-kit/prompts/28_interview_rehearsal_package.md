# 28 — Interview Scripts and Rehearsal Package

**Executor:** Human + Codex 5.6 sol extra-high
**Task ID:** `T28`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T27 COMPLETE.

## Read first
- `caseflow-build-kit/docs/10-interviews/PANEL_NARRATIVE.md`
- `caseflow-build-kit/docs/10-interviews/STAGE_2_NICK.md`
- `caseflow-build-kit/docs/10-interviews/STAGE_3_TECHNICAL.md`
- `caseflow-build-kit/docs/10-interviews/STAGE_4_MEERA.md`
- `caseflow-build-kit/docs/10-interviews/STAGE_5_RAVIV.md`
- `caseflow-build-kit/docs/10-interviews/PROFESSIONAL_EVIDENCE_BRIDGES.md`
- `caseflow-build-kit/docs/10-interviews/REHEARSAL_SCORECARD.md`
- `caseflow-build-kit/templates/INTERVIEW_RUN_SHEET.md`

## Objective
Convert the deployed artifact into concise, truthful, stage-specific interview execution that answers questions before presenting.

## Instructions
1. Generate final presenter run sheets for Stage 2, 3, 4, and 5 with opening, permission ask, step timing, likely interruptions, professional bridges, stop points, and closing question.
2. Generate 30-second, 90-second, and three-minute explanations of CaseFlow; generate the seven-minute technical version.
3. Rehearse every stage from the deployed URL with Teams-style screen sharing and record actual timing.
4. Score each rehearsal and revise wording/navigation—not architecture—until no relevant category is below 4.
5. Test interruption: answer a technical/business question, return to the route, and resume without losing place.
6. Verify audio input, browser zoom, notification suppression, and direct deep-link recovery.
7. Create a one-page interview cheat sheet with claims/limitations and the three strongest professional bridges.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Do not memorize a long monologue.
- Do not force the demo into an interview without permission.
- Do not mention private recruiter/benefit/compensation details in the artifact.

## Required outputs
- `caseflow-build-kit/deliverables/interview/stage-2-run-sheet.md`
- `stage-3-run-sheet.md`
- `stage-4-run-sheet.md`
- `stage-5-run-sheet.md`
- `caseflow-build-kit/deliverables/interview/one-page-cheat-sheet.md`
- Rehearsal scorecards and timing

## Acceptance gate
- [ ] All tours meet time targets.
- [ ] Every answer starts with a conclusion and can stop cleanly.
- [ ] Professional bridges are accurate.
- [ ] Interruption/recovery and Teams setup are verified.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T28.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
