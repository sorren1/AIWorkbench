# 03 — CData Developer Edition Capability Probe

**Executor:** Human + Codex 5.6 sol extra-high
**Task ID:** `T03`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T02 COMPLETE.
- Human can create/use a non-employer CData account and synthetic sources.

## Read first
- `caseflow-build-kit/docs/05-cdata/DEVELOPER_EDITION_SETUP.md`
- `caseflow-build-kit/docs/05-cdata/MCP_SETUP.md`
- `caseflow-build-kit/docs/05-cdata/CONNECTION_PROFILES.md`
- `caseflow-build-kit/docs/05-cdata/QUOTA_BUDGET.md`
- `caseflow-build-kit/reference/CDATA_CURRENT_CAPABILITIES.md`
- `caseflow-build-kit/reference/CAPABILITY_PROBE_RESULTS.md`
- `caseflow-build-kit/.env.example`

## Objective
Replace public-document assumptions with evidence from the actual Developer Edition account while keeping all credentials outside source and chat.

## Instructions
1. Human creates the account, PAT, and baseline synthetic sources following the runbook. The agent must never receive or print secret values.
2. Verify the current account limits and visible features. Record source/user/call limits, Query MCP, Management MCP, Toolkit visibility, Gateway visibility, audit visibility, and free-tier identity controls.
3. Create/import the baseline synthetic data. Use the smallest viable connector profile; do not consume time forcing optional Salesforce.
4. Record connection aliases, connector names, high-level auth type, test status, and whether each supports required reads/writes. Do not record endpoints, tenant IDs, emails, OAuth URLs, or secrets in public artifacts.
5. Capture sanitized screenshots only if they contain no account identifiers; screenshots are optional and private by default.
6. Update `reference/CAPABILITY_PROBE_RESULTS.md` and create a machine-readable private-safe result at `deliverables/cdata-capability-probe.json`.
7. Record current tool-call counter and reserve budget.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- No live financial write.
- Do not invoke destructive Management MCP operations.
- Do not store real account email in tracked files.

## Required outputs
- Updated `caseflow-build-kit/reference/CAPABILITY_PROBE_RESULTS.md`
- `caseflow-build-kit/deliverables/cdata-capability-probe.json`
- `caseflow-build-kit/deliverables/cdata-connection-map.md`
- Initial ignored local call ledger if live probes occurred

## Acceptance gate
- [ ] At least one synthetic source connection is validated, or a precise blocker is recorded.
- [ ] Actual Query/Management MCP availability is known.
- [ ] Free-tier enterprise-control limitations are explicitly recorded.
- [ ] No credential or account identifier is tracked.
- [ ] Task is COMPLETE or COMPLETE_WITH_LIMITATION with a viable offline path.

## Human checkpoint
The human must perform sign-up, PAT creation, OAuth consent, and secret entry. The agent stops rather than asking for the PAT in chat.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T03.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
