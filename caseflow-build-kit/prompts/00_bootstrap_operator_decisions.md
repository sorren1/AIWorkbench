# 00 — Bootstrap and Operator Decisions

**Executor:** Human
**Task ID:** `T00`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- The current AIWorkbench repository can be cloned or opened.
- This build kit has been unzipped into the repository root.

## Read first
- `caseflow-build-kit/START_HERE.md`
- `caseflow-build-kit/README.md`
- `caseflow-build-kit/project/MASTER_PLAN.md`
- `caseflow-build-kit/project/ASSUMPTIONS.md`

## Objective
Lock the few human decisions that must not be delegated or repeatedly revisited.

## Instructions
1. Confirm the host repository and create a clean feature branch named `feature/caseflow-reference-implementation` or record an alternate branch name.
2. Confirm the public base route `/caseflow/` and the four stage routes. Record any approved alternative before implementation.
3. Choose the baseline source profile from `docs/05-cdata/CONNECTION_PROFILES.md`; default to Google Sheets + PostgreSQL + Google Drive. Record whether a Salesforce Developer Org is available, but do not make it a blocker.
4. Confirm that only synthetic owner-controlled sources will be used and that no employer/client account may be connected.
5. Choose whether a single synthetic live write may be attempted during T25. Default to read-only if uncertain.
6. Confirm the public artifact remains deterministic replay and that no live Python API is initially deployed.
7. Populate the T00 notes in `project/status.json` and create the operator decision record using `templates/OPERATOR_DECISIONS.md`.

## Non-negotiable constraints
- Do not create or paste credentials in this task.
- Do not modify product source code.

## Required outputs
- `caseflow-build-kit/deliverables/operator-decisions.md`
- Updated `caseflow-build-kit/project/status.json` and rendered `STATUS.md`

## Acceptance gate
- [ ] Repository, branch, route, source profile, public-mode boundary, and live-write preference are explicit.
- [ ] All decisions use synthetic-only data.
- [ ] T00 is marked COMPLETE.

## Human checkpoint
This entire task is the human gate. Do not proceed if the route or source profile remains undecided.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T00.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
