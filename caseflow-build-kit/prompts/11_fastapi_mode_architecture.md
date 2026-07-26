# 11 — Local FastAPI Service and Mode Architecture

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T11`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T04 COMPLETE.
- T05 COMPLETE or COMPLETE_WITH_LIMITATION.
- T10 COMPLETE.

## Read first
- `caseflow-build-kit/docs/07-backend/API_ARCHITECTURE.md`
- `caseflow-build-kit/docs/07-backend/ADAPTER_CONTRACTS.md`
- `caseflow-build-kit/docs/02-architecture/LIVE_REPLAY_MODES.md`
- `caseflow-build-kit/contracts/openapi/caseflow.openapi.yaml`
- `caseflow-build-kit/contracts/config/mode-contract.json`
- `caseflow-build-kit/deliverables/cdata-python-sdk-spike.md`
- `caseflow-build-kit/deliverables/cdata-mcp-spike.md`

## Objective
Create a local-only, typed FastAPI service with explicit runtime modes and dependency-injected ports, without implementing business behavior prematurely.

## Instructions
1. Create `caseflow-api/` with Python 3.11+, `pyproject.toml`, src layout, type checking, formatting/linting, pytest, and safe settings loading.
2. Implement mode parsing and invariants from the mode contract. Public mode must not be a server runtime and live-write mode must be impossible without all required flags.
3. Create FastAPI health/capabilities endpoints and route skeletons matching the OpenAPI contract.
4. Define domain/application ports and adapter placeholders with no CData imports leaking into domain modules.
5. Add stable error response model, correlation ID, redacted logging, fixed/test clock, and local-only CORS.
6. Add tests proving mode guards, no arbitrary SQL inputs, no secrets in errors, and that live write is disabled by default.
7. Document local startup and exact command integration with the host repository.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Do not deploy FastAPI to Vercel.
- Do not implement a live write adapter.
- Do not add a model dependency.

## Required outputs
- `caseflow-api/**` foundation
- Updated/local OpenAPI if implementation requires evidence-backed corrections
- Backend tests and run commands

## Acceptance gate
- [ ] Health/capabilities endpoints work locally.
- [ ] Mode invariants are tested.
- [ ] Ports/adapters are cleanly separated.
- [ ] Errors/logs are redacted.
- [ ] Python quality gates pass.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T11.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
