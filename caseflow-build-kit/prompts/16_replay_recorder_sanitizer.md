# 16 — Replay Recorder, Sanitizer, and Evidence Binding

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T16`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T15 COMPLETE.

## Read first
- `caseflow-build-kit/docs/07-backend/EVIDENCE_CAPTURE.md`
- `caseflow-build-kit/docs/03-security/SECRET_HANDLING.md`
- `caseflow-build-kit/contracts/schemas/live-evidence-manifest.schema.json`
- `caseflow-build-kit/contracts/schemas/claim-record.schema.json`
- `caseflow-build-kit/reference/CLAIM_BOUNDARIES.md`
- `caseflow-build-kit/fixtures/replay/`

## Objective
Create the deterministic public-evidence generation pipeline that allows the static UI to present implementation and recorded-live behavior truthfully.

## Instructions
1. Implement a local evidence export command that runs canonical success, blocked write, duplicate replay, and partial failure scenarios.
2. Implement explicit field allow-list sanitization plus deny-pattern scanning for secrets, emails, DSNs, paths, OAuth details, and raw headers.
3. Canonicalize JSON, compute SHA-256 hashes, generate manifest and public claim records, and validate all schemas.
4. Generate public evidence into `public/caseflow-evidence/` only after sanitizer passes; retain raw output only in ignored local workspace.
5. Add tests that intentionally inject token/email/connection-string patterns and confirm publication is blocked.
6. Add frontend typed loaders/selectors for the generated evidence but do not complete stage views yet.
7. Replace planning replay artifacts with implementation-generated artifacts and preserve their classification.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- No raw-to-public directory copy.
- No LIVE_VALIDATED label until T25 evidence exists.
- Manifest must bind source commit when generated from git.

## Required outputs
- Evidence export/sanitizer tools
- `public/caseflow-evidence/**` generated replay
- Claim records and manifest
- Sanitizer/evidence tests

## Acceptance gate
- [ ] Public evidence is deterministic and schema-valid.
- [ ] Secret-bearing fixtures block publication.
- [ ] Replay loader works without external network.
- [ ] Every public claim has a classification and evidence reference.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T16.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
