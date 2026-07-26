# 25 — Live Validation and Sanitized Evidence Capture

**Executor:** Human + Codex 5.6 sol extra-high
**Task ID:** `T25`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T24 COMPLETE.
- Synthetic CData sources are available or T03 limitations are understood.

## Read first
- `caseflow-build-kit/docs/05-cdata/LIVE_VALIDATION_RUNBOOK.md`
- `caseflow-build-kit/docs/05-cdata/QUOTA_BUDGET.md`
- `caseflow-build-kit/docs/03-security/SAFE_WRITE_MODEL.md`
- `caseflow-build-kit/docs/07-backend/EVIDENCE_CAPTURE.md`
- `caseflow-build-kit/contracts/schemas/live-evidence-manifest.schema.json`
- `caseflow-build-kit/reference/CAPABILITY_PROBE_RESULTS.md`

## Objective
Produce the narrowest credible live CData evidence while preserving safety, quota, and public-boundary controls.

## Instructions
1. Human verifies sources are synthetic, secrets are local, and remaining call budget is sufficient.
2. Run a clean local live-read investigation for the canonical case using current source schema fingerprints.
3. Record SDK/MCP version, tool/query template IDs, source aliases, row counts, timing, retries, and result digests in raw ignored evidence.
4. Run sanitizer, deny-pattern scan, schema validation, and manual diff review before copying any artifact to public evidence.
5. If the human previously approved a synthetic write and the source supports it, enable the triple gate, create one approved credit, prove idempotent replay, disable writes immediately, and inspect source state. Otherwise record read-only completion without penalty.
6. Generate a live evidence manifest bound to the current source commit and update public claim classifications only for validated behavior.
7. Update the call ledger and preserve reserve.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- No live write without fresh human confirmation in this task.
- No non-synthetic source.
- No raw evidence publication.
- No interview depends on live availability.

## Required outputs
- Sanitized live/recorded evidence under `public/caseflow-evidence/`
- Validated live evidence manifest
- Updated claim records/capability results
- T25 live-validation report

## Acceptance gate
- [ ] A sanitized live read is captured or a precise limitation is documented.
- [ ] Any write was human-approved, synthetic, idempotent, and immediately disabled.
- [ ] Manifest validates and hashes match.
- [ ] No secret/account identifier is public.
- [ ] Call budget remains acceptable.

## Human checkpoint
Human must confirm the source is synthetic and separately authorize any live write. Silence or prior generic approval is not sufficient.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T25.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
