# 06 — Official Agent Scaffold Spike

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T06`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T05 COMPLETE or COMPLETE_WITH_LIMITATION.

## Read first
- `caseflow-build-kit/docs/05-cdata/AGENT_SCAFFOLD_SETUP.md`
- `caseflow-build-kit/docs/05-cdata/CONNECT_AI_SKILLS_SETUP.md`
- `caseflow-build-kit/docs/07-backend/ORCHESTRATOR.md`
- `caseflow-build-kit/reference/CLAIM_BOUNDARIES.md`

## Objective
Generate and evaluate an official CData agent scaffold, then deliberately decide which patterns belong in CaseFlow.

## Instructions
1. Run `npx @cdatasoftware/create-agent --list` and record current templates.
2. Generate the LangChain Python template under `experiments/cdata-agent-scaffold/` unless current tooling or architecture evidence supports a different template.
3. Preserve the unmodified generated baseline in git or a documented initial commit before customization.
4. Install dependencies and run the template if provider credentials are available. Credentials stay local and ignored.
5. Create a read-only CaseFlow experiment that asks for the canonical case evidence using CData Query MCP. It may synthesize a summary but may not compute policy or call write tools.
6. Document tool discovery, connection management, context handling, error behavior, and why the main deterministic orchestrator remains authoritative.
7. Identify reusable code/patterns and explicitly list what will not be copied.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Do not make the generated agent a public runtime dependency.
- Do not give the agent write authority.
- Preserve upstream license/notice files.

## Required outputs
- `experiments/cdata-agent-scaffold/`
- `caseflow-build-kit/deliverables/cdata-agent-scaffold-spike.md`
- Optional sanitized agent transcript with only synthetic data

## Acceptance gate
- [ ] A current scaffold is generated.
- [ ] Its architecture and environment contract are documented.
- [ ] Read-only CaseFlow adaptation is run or the exact provider/account limitation is recorded.
- [ ] Deterministic authority boundary is preserved.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T06.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
