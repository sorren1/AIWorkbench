# 05 — Query MCP and Management MCP Spike

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T05`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T03 COMPLETE or COMPLETE_WITH_LIMITATION.

## Read first
- `caseflow-build-kit/docs/05-cdata/MCP_SETUP.md`
- `caseflow-build-kit/reference/CAPABILITY_PROBE_RESULTS.md`
- `caseflow-build-kit/contracts/tools/tool-registry.json`
- `caseflow-build-kit/docs/05-cdata/QUOTA_BUDGET.md`

## Objective
Validate the current remote MCP surfaces, tool contracts, and safe discovery/query path without embedding credentials in the repository.

## Instructions
1. Register or invoke Query MCP and Management MCP in a local MCP-aware client using secret-safe environment configuration.
2. Capture a sanitized `tools/list` summary from each server.
3. Use Query MCP to list approved catalogs, schemas, tables, and columns, then run one narrow read-only query for the canonical case.
4. Use Management MCP only for non-destructive list/test behavior against CaseFlow connections. Do not delete or recreate a working connection without human approval.
5. Record exact tool names, parameter shapes, response shapes, errors, and whether source-specific instructions are exposed.
6. Compare actual tools to `contracts/tools/tool-registry.json`; update the registry only with evidence and retain compatibility aliases if needed.
7. Update the call ledger and document how the main product will use MCP versus the Python SDK.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- No destructive management action.
- No live write/procedure execution.
- Sanitize Basic-auth values and account identity.

## Required outputs
- `caseflow-build-kit/deliverables/cdata-mcp-spike.md`
- Sanitized tool summaries under `deliverables/evidence-spikes/`
- Updated capability probe and tool registry if evidence requires

## Acceptance gate
- [ ] Query MCP tool discovery is proven or a precise blocker is recorded.
- [ ] Management MCP behavior is proven or a precise blocker is recorded.
- [ ] One narrow source query is demonstrated when access exists.
- [ ] MCP versus SDK responsibilities are explicit.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T05.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
