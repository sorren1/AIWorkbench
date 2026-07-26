# 15 — Approval, Idempotent Execution, and Reconciliation

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T15`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T14 COMPLETE.

## Read first
- `caseflow-build-kit/docs/03-security/AUTHORIZATION_MATRIX.md`
- `caseflow-build-kit/docs/03-security/SAFE_WRITE_MODEL.md`
- `caseflow-build-kit/docs/02-architecture/ADR-004-cross-source-saga.md`
- `caseflow-build-kit/contracts/schemas/approval-record.schema.json`
- `caseflow-build-kit/contracts/schemas/execution-record.schema.json`
- `caseflow-build-kit/docs/08-testing/FAILURE_INJECTION.md`

## Objective
Implement the complete safe action model in mock/fixture mode and define—but do not yet enable—the live write adapters.

## Instructions
1. Implement approval request, approve/reject, role/identity separation, digest binding, expiration, and stale invalidation.
2. Implement execution ledger reservation, same-payload replay, conflicting-payload rejection, and stable receipts.
3. Implement mock FinanceActionPort and CrmActionPort, including injected failures.
4. Implement ordered saga execution and `RECONCILIATION_REQUIRED` behavior after finance success/CRM failure.
5. Implement reconciliation that reuses the finance receipt and retries only the incomplete CRM action.
6. Implement customer-response state guard so wording never claims completion before receipts.
7. Expose approval/execute/reconcile APIs and add comprehensive negative/duplicate/partial-failure tests.
8. Create live adapter interfaces but keep them disabled/unimplemented until T25.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- No actual live source write.
- The proposer cannot self-approve.
- Do not use database transaction language for cross-source atomicity.

## Required outputs
- Approval/execution/reconciliation implementation
- Mock action adapters and failure injection
- Generated approval/execution replay candidates
- High-coverage tests

## Acceptance gate
- [ ] Unapproved/stale/self-approved writes are blocked.
- [ ] Duplicate execution creates zero duplicate credits.
- [ ] Partial failure preserves receipt and enters reconciliation.
- [ ] Reconciliation completes without repeating finance action.
- [ ] Customer wording matches actual state.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T15.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
