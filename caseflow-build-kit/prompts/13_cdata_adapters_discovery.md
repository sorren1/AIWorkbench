# 13 — CData Adapters and Source Discovery

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T13`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T12 COMPLETE.

## Read first
- `caseflow-build-kit/docs/05-cdata/CONNECTION_PROFILES.md`
- `caseflow-build-kit/docs/04-data/SOURCE_MODELS.md`
- `caseflow-build-kit/docs/04-data/QUERY_CATALOG.md`
- `caseflow-build-kit/docs/07-backend/ADAPTER_CONTRACTS.md`
- `caseflow-build-kit/deliverables/cdata-python-sdk-spike.md`
- `caseflow-build-kit/deliverables/cdata-mcp-spike.md`
- `caseflow-build-kit/reference/CAPABILITY_PROBE_RESULTS.md`

## Objective
Implement capability-driven CData read adapters that normalize actual source data into the same domain contracts as fixture mode.

## Instructions
1. Implement the Python SDK adapter with parameterized approved query templates, selected columns, explicit timeouts/retry classification, row limits, and connection lifecycle.
2. Implement an MCP discovery/proof adapter or script that records catalogs/schemas/tables/columns and schema fingerprints. Keep it separate from core domain behavior.
3. Create per-source mapping modules for the chosen connection profile. Source-specific naming must not leak into domain rules.
4. Implement startup/pre-run schema contract validation and fail closed on material drift.
5. Add contract tests that run the same normalized evidence assertions against fixture/mock and, when credentials are available, narrow live reads.
6. Record query template IDs, row counts, timings, retries, and safe source aliases.
7. Update call ledger without consuming unnecessary live quota.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Read-only adapters only in this task.
- No arbitrary SQL endpoint.
- No source or credential names in public output beyond approved aliases.

## Required outputs
- CData SDK/discovery adapters under `caseflow-api/src/`
- Approved query templates and mapping configuration
- Schema fingerprint artifacts/tests
- T13 adapter report

## Acceptance gate
- [ ] Fixture/mock adapter contracts pass.
- [ ] Live read contract passes when available or limitation is explicit.
- [ ] Schema drift fails closed.
- [ ] No domain rule imports CData-specific modules.
- [ ] No write path exists.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T13.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
