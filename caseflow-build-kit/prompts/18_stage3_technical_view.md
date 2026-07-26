# 18 — Stage 3 Technical View

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T18`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T17 COMPLETE.

## Read first
- `caseflow-build-kit/deliverables/design/technical-view.md`
- `caseflow-build-kit/docs/10-interviews/STAGE_3_TECHNICAL.md`
- `caseflow-build-kit/docs/02-architecture/WORKFLOW_STATE_MACHINE.md`
- `caseflow-build-kit/docs/03-security/SAFE_WRITE_MODEL.md`
- `caseflow-build-kit/docs/07-backend/OBSERVABILITY.md`
- `caseflow-build-kit/contracts/tools/tool-registry.json`
- `public/caseflow-evidence/manifest.json`

## Objective
Implement the inspectable technical lens and a seven-minute architecture path that can withstand interruption and probing.

## Instructions
1. Implement source/capability summary, schema fingerprint, approved query catalog, universal CData tool versus CaseFlow service-tool distinction, and SDK/MCP roles.
2. Render evidence facts with provenance, completeness, conflicts, and digests.
3. Render structured-data versus policy-retrieval decision and deterministic policy evaluation.
4. Render blocked unauthorized write, exact approval record, idempotent execution, and partial failure/reconciliation variants.
5. Render trace, evaluation, test, and claim-boundary panels with links to public-safe source/evidence where configured.
6. Add query/code excerpts only from current implementation with synchronized source markers or generated extraction; avoid stale copied snippets.
7. Add focused tests for every technical demo step and network-free replay.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Do not label planning fixtures as live.
- Do not reveal local paths or account details.
- Do not make an arbitrary SQL console.

## Required outputs
- Completed `/caseflow/technical` view
- Technical deep links/step anchors
- Stage 3 tests and capture

## Acceptance gate
- [ ] Technical view shows source, evidence, authority, execution, and failure boundaries.
- [ ] Blocked/duplicate/partial scenarios are inspectable.
- [ ] Seven-minute sequence can be followed without live calls.
- [ ] Claim labels match evidence.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T18.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
