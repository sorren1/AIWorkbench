# 07 — Optional CData CLI Schema-Development Spike

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T07`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T03 COMPLETE or COMPLETE_WITH_LIMITATION.

## Read first
- `caseflow-build-kit/docs/05-cdata/CLI_SETUP.md`
- `caseflow-build-kit/docs/04-data/QUERY_CATALOG.md`
- `caseflow-build-kit/reference/CDATA_CURRENT_CAPABILITIES.md`

## Objective
Demonstrate the distinct CData CLI/JDBC path for schema-grounded coding-agent development without making it a core dependency.

## Instructions
1. Verify Java 17+ and install CData CLI using the current official installer only with human awareness.
2. Install `CDataSoftware/cli-skills` if useful for the local coding environment.
3. Search/download/activate one driver for an owner-controlled synthetic source, observing current trial/licensing instructions.
4. Create a local CLI connection without exposing credentials to chat or tracked files.
5. Run table and column metadata discovery and one narrow SQL query. Record sanitized output.
6. Compare CLI development-time schema discovery to Connect AI MCP/SDK runtime access and document the architectural distinction.
7. If Java/licensing/OAuth cannot be completed within 60 minutes, stop and complete with limitation; do not delay core implementation.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Do not claim CLI is the Connect AI SDK or MCP runtime.
- No real enterprise source.
- No source write.

## Required outputs
- `experiments/cdata-cli-spike/README.md`
- `caseflow-build-kit/deliverables/cdata-cli-spike.md`
- Optional sanitized schema/query sample

## Acceptance gate
- [ ] CLI path is demonstrated or responsibly completed with limitation.
- [ ] Architectural distinction from Connect AI is clear.
- [ ] No secret or license key is tracked.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T07.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
