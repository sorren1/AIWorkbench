# 04 — Python SDK and Official Mock-Server Spike

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T04`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T03 COMPLETE or COMPLETE_WITH_LIMITATION.

## Read first
- `caseflow-build-kit/docs/05-cdata/PYTHON_SDK_SETUP.md`
- `caseflow-build-kit/reference/CAPABILITY_PROBE_RESULTS.md`
- `caseflow-build-kit/contracts/openapi/caseflow.openapi.yaml`
- `caseflow-build-kit/docs/07-backend/ADAPTER_CONTRACTS.md`

## Objective
Prove the official Python DB-API package and its mock/testing path before building the main service.

## Instructions
1. Create an isolated Python 3.11+ spike under `experiments/cdata-python-sdk-spike/` with a locked development dependency file and ignored local env.
2. Install `cdata-connect-ai` and record the exact resolved version.
3. Clone or inspect the official `CDataSoftware/cdata-connect-ai-python` repository in an ignored/temp location and run its relevant unit/integration tests or minimal mock demo.
4. Implement a tiny script that executes one parameterized SELECT against the official mock or compatible local fixture, reads cursor metadata, classifies an unreachable-host error, and proves timeout/retry settings can be supplied.
5. When T03 live access is available, run one narrow read-only query through the SDK and sanitize the result. Do not make live access a prerequisite for the mock proof.
6. Document API behavior, exception classes, streaming/row handling, and any difference between official mock and live endpoint.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Do not build the main CaseFlow API yet.
- No live write.
- Pin versions in the spike report.

## Required outputs
- `experiments/cdata-python-sdk-spike/`
- `caseflow-build-kit/deliverables/cdata-python-sdk-spike.md`
- Sanitized mock/live sample under `deliverables/evidence-spikes/`

## Acceptance gate
- [ ] SDK imports and performs a parameterized query.
- [ ] At least one error is classified without secret leakage.
- [ ] Official mock/testing approach is understood.
- [ ] A recommendation for the main adapter is documented.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T04.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
