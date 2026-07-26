# Project Status

> Generated from `project/status.json` by `tools/render_status.py`. Do not hand-edit task rows.

**Project:** CaseFlow â€” Governed Multi-System Customer Resolution
**Version:** 0.1.0-planning
**Last updated:** 2026-07-26
**Current task:** T02

| ID | Task | Owner | Status | Evidence / limitation summary |
|---|---|---|---|---|
| T00 | Bootstrap and operator decisions | Human | COMPLETE | Evidence: caseflow-build-kit/deliverables/operator-decisions.md, caseflow-build-kit/deliverables/completion-reports/T00.md, caseflow-build-kit/project/STATUS.md — Host repository, feature branch, /caseflow routes, Profile A with C/D fallbacks, synthetic-only boundary, replay-only public runtime, local live-read permission, T25 write-decision gate, T01-T07 preauthorization, and post-T02 Claude Design parallelization are locked. Broad host-repository build commands are intentionally identified and executed during T01 repository preflight. |
| T01 | Repository preflight and branch baseline | Codex | COMPLETE | Evidence: caseflow-build-kit/deliverables/repository-preflight.md, caseflow-build-kit/deliverables/completion-reports/T01.md, caseflow-build-kit/project/STATUS.md — Baseline commit de11d11944b826c7b8b9087450be6ddc7e0de8a3 on feature/caseflow-reference-implementation. The build emitted 77 files and no CaseFlow/build-kit output. npm run check passed; the first check:all attempt reached Playwright but default port 4175 was occupied by an unrelated user project, and the documented port-4177 rerun passed all gates. No product code, dependency, route, navigation, sitemap, deployment, or public claim changed. D-006 preserves the local build-kit exclusion while allowing only required T01 evidence paths into the focused commit; R-013 tracks the remaining archive-durability risk. |
| T02 | Architecture and contract reconciliation | Codex | NOT_STARTED | — |
| T03 | CData Developer Edition capability probe | Human + Codex | NOT_STARTED | — |
| T04 | Python SDK and official mock-server spike | Codex | NOT_STARTED | — |
| T05 | Query MCP and Management MCP spike | Codex | NOT_STARTED | — |
| T06 | Official agent scaffold spike | Codex | NOT_STARTED | — |
| T07 | Optional CData CLI schema-development spike | Codex | NOT_STARTED | — |
| T08 | Claude Design visual system | Claude Design | NOT_STARTED | — |
| T09 | Claude Design four-stage interaction specification | Claude Design | NOT_STARTED | — |
| T10 | CaseFlow frontend shell and hidden route | Codex | NOT_STARTED | — |
| T11 | Local FastAPI service and mode architecture | Codex | NOT_STARTED | — |
| T12 | Synthetic domain, policy engine, and fixtures | Codex | NOT_STARTED | — |
| T13 | CData adapters and source discovery | Codex | NOT_STARTED | — |
| T14 | Evidence collection and provenance | Codex | NOT_STARTED | — |
| T15 | Approval, idempotent execution, and reconciliation | Codex | NOT_STARTED | — |
| T16 | Replay recorder, sanitizer, and evidence binding | Codex | NOT_STARTED | — |
| T17 | Stage 2 strategy and discovery view | Codex | NOT_STARTED | — |
| T18 | Stage 3 technical view | Codex | NOT_STARTED | — |
| T19 | Stage 4 operations and handoff view | Codex | NOT_STARTED | — |
| T20 | Stage 5 product leverage view | Codex | NOT_STARTED | — |
| T21 | Guided interview tours and presenter controls | Codex | NOT_STARTED | — |
| T22 | Observability, evaluations, and failure injection | Codex | NOT_STARTED | — |
| T23 | Security, clean-room, and claim-boundary audit | Codex | NOT_STARTED | — |
| T24 | Accessibility, browser, visual, and performance gates | Codex | NOT_STARTED | — |
| T25 | Live validation and sanitized evidence capture | Human + Codex | NOT_STARTED | — |
| T26 | Same-site Vercel integration | Codex | NOT_STARTED | — |
| T27 | Release evidence, deployment, and rollback proof | Human + Codex | NOT_STARTED | — |
| T28 | Interview scripts and rehearsal package | Human + Codex | NOT_STARTED | — |
| T29 | Final independent audit | Codex | NOT_STARTED | — |
| T30 | Optional post-interview enhancements | Codex | NOT_STARTED | — |

Run `python caseflow-build-kit/tools/next_task.py` to identify the next executable task.
