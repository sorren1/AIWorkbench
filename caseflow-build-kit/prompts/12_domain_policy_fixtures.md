# 12 — Synthetic Domain, Policy Engine, and Fixtures

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T12`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T11 COMPLETE.

## Read first
- `caseflow-build-kit/docs/04-data/DOMAIN_MODEL.md`
- `caseflow-build-kit/docs/04-data/POLICY_MODEL.md`
- `caseflow-build-kit/docs/02-architecture/WORKFLOW_STATE_MACHINE.md`
- `caseflow-build-kit/docs/01-discovery/ACCEPTANCE_CRITERIA.md`
- `caseflow-build-kit/fixtures/gold-cases/gold-cases.json`
- `caseflow-build-kit/contracts/schemas/evidence-packet.schema.json`
- `caseflow-build-kit/contracts/schemas/resolution-proposal.schema.json`

## Objective
Implement the deterministic CaseFlow domain so all five gold cases pass without CData or an LLM.

## Instructions
1. Implement typed value objects, entities/aggregates, state enum/transitions, canonical JSON hashing, money/time handling, evidence completeness/conflict logic, and deterministic policy evaluation.
2. Copy or reference fixtures into the host repository's agreed `fixtures/caseflow/` location without altering canonical facts.
3. Implement a fixture adapter that runs the full investigation and proposal pipeline for all five gold cases.
4. Implement explanation claim structures that require supporting fact/policy IDs; a plain free-text string is not sufficient for the release gate.
5. Add heightened-coverage unit tests for policy, guards, digests, conflicts, stale invalidation, and gold cases.
6. Expose investigation/proposal behavior through the local API.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- No CData source access in domain tests.
- No model is required.
- Use Decimal for money and timezone-aware datetimes.

## Required outputs
- Domain/application implementation under `caseflow-api/src/`
- Host-repository synthetic fixtures
- Gold-case and heightened-coverage tests
- Updated contract bindings

## Acceptance gate
- [ ] All five gold cases pass.
- [ ] Canonical case yields exactly USD 1,240.00 and FINANCE_MANAGER approval.
- [ ] Conflicts/missing policy fail safe.
- [ ] State/digest invariants are tested at required coverage.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T12.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
