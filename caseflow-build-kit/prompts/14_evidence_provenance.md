# 14 — Evidence Collection and Provenance

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T14`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T13 COMPLETE.

## Read first
- `caseflow-build-kit/docs/07-backend/EVIDENCE_CAPTURE.md`
- `caseflow-build-kit/contracts/schemas/evidence-packet.schema.json`
- `caseflow-build-kit/contracts/schemas/audit-event.schema.json`
- `caseflow-build-kit/reference/CLAIM_BOUNDARIES.md`
- `caseflow-build-kit/fixtures/replay/canonical-evidence-packet.json`

## Objective
Build the inspectable evidence chain that binds every material decision to normalized source facts and policy.

## Instructions
1. Implement evidence fact normalization, source references, observation timestamps, query template IDs, field lists, canonical serialization, and digests.
2. Implement completeness and material/non-material conflict detection.
3. Implement ordered audit events for source queries, evidence completion, conflicts, policy, and proposal.
4. Implement explanation claim-to-evidence mapping and a deterministic evaluator that rejects unsupported claims.
5. Expose evidence and trace through local API endpoints with public-safe response models.
6. Add tests for digest stability, source-order independence where appropriate, conflict detection, unsupported claims, and schema validation.
7. Regenerate canonical replay evidence from implementation rather than hand-maintaining the planning fixture.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Hashes are evidence-change detectors, not signatures.
- Do not publish raw source payloads.
- No write behavior yet.

## Required outputs
- Evidence/provenance implementation
- Generated canonical evidence and trace candidate
- Evidence/claim tests
- T14 completion report

## Acceptance gate
- [ ] Every proposal-supporting fact has provenance.
- [ ] Unsupported explanation claims fail.
- [ ] Evidence digest is deterministic.
- [ ] Conflicts block recommendation-ready state.
- [ ] Generated evidence validates against schemas.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T14.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
