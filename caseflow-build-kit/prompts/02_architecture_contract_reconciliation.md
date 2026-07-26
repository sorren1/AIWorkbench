# 02 — Architecture and Contract Reconciliation

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T02`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T01 COMPLETE.

## Read first
- `caseflow-build-kit/project/MASTER_PLAN.md`
- `caseflow-build-kit/docs/00-product/PRODUCT_BRIEF.md`
- `caseflow-build-kit/docs/01-discovery/ENGAGEMENT_BRIEF.md`
- `caseflow-build-kit/docs/02-architecture/CONTAINER_COMPONENT_ARCHITECTURE.md`
- `caseflow-build-kit/docs/03-security/SECURITY_MODEL.md`
- `caseflow-build-kit/contracts/openapi/caseflow.openapi.yaml`
- `caseflow-build-kit/contracts/tools/tool-registry.json`
- `caseflow-build-kit/deliverables/repository-preflight.md`

## Objective
Reconcile the proposed product architecture and contracts with the actual repository before any visual or application implementation.

## Instructions
1. Validate every JSON contract and fixture as parseable. Inspect the OpenAPI document for path/reference errors.
2. Create the target implementation tree and dependency plan in `deliverables/architecture-reconciliation.md`, including exact host-repository paths and ownership by frontend/API/tooling.
3. Confirm that the static public/local-live split is compatible with the existing CSP and Vercel model.
4. Define the exact mechanism for route selection without unnecessary dependencies.
5. Identify any contract that is too broad, underspecified, or inconsistent with the state machine, safe-write model, or source authority. Correct the canonical docs/contracts now and record decisions.
6. Create a dependency budget. Reuse existing dependencies where sensible; justify every new runtime dependency.
7. Create a file-level implementation map for T10–T24.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- No product implementation code beyond validation utilities or schema fixes.
- Do not change the core case facts without a documented decision.

## Required outputs
- `caseflow-build-kit/deliverables/architecture-reconciliation.md`
- Validated/corrected contracts and fixture documents
- Updated decision/risk records

## Acceptance gate
- [ ] All machine-readable kit contracts parse.
- [ ] Implementation paths are exact and compatible with repository reality.
- [ ] Public/local security boundary remains intact.
- [ ] No unresolved high-severity contract contradiction remains.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T02.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
