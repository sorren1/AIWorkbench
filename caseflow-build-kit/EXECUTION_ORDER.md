# Serial Execution Order

## Operating rule

Run one numbered prompt at a time. A task is complete only when its acceptance gate passes, status is updated, and a completion report exists. A later prompt may read earlier outputs, but it must not silently repair an incomplete prerequisite; return to the failed task instead.

## Phases

1. **Foundation — T00–T09:** establish repository reality, product contracts, current CData capability evidence, and implementable design.
2. **Core system — T10–T16:** build the static shell, local service, domain behavior, CData adapters, evidence chain, safe write model, and replay artifacts.
3. **Interview lenses — T17–T21:** expose the same system through strategy, technical, operations, and product views.
4. **Assurance — T22–T27:** prove failure behavior, security, accessibility, live integration, same-site routing, and deployment binding.
5. **Interview readiness — T28–T30:** rehearse, audit, and optionally extend without destabilizing the release.

## Task table

| ID | Task | Owner | Depends on | Prompt |
|---|---|---|---|---|
| T00 | Bootstrap and operator decisions | Human | None | `prompts/00_*.md` |
| T01 | Repository preflight and branch baseline | Codex | T00 | `prompts/01_*.md` |
| T02 | Architecture and contract reconciliation | Codex | T01 | `prompts/02_*.md` |
| T03 | CData Developer Edition capability probe | Human + Codex | T02 | `prompts/03_*.md` |
| T04 | Python SDK and official mock-server spike | Codex | T03 | `prompts/04_*.md` |
| T05 | Query MCP and Management MCP spike | Codex | T03 | `prompts/05_*.md` |
| T06 | Official agent scaffold spike | Codex | T05 | `prompts/06_*.md` |
| T07 | Optional CData CLI schema-development spike | Codex | T03 | `prompts/07_*.md` |
| T08 | Claude Design visual system | Claude Design | T02 | `prompts/08_*.md` |
| T09 | Claude Design four-stage interaction specification | Claude Design | T08 | `prompts/09_*.md` |
| T10 | CaseFlow frontend shell and hidden route | Codex | T09 | `prompts/10_*.md` |
| T11 | Local FastAPI service and mode architecture | Codex | T04, T05, T10 | `prompts/11_*.md` |
| T12 | Synthetic domain, policy engine, and fixtures | Codex | T11 | `prompts/12_*.md` |
| T13 | CData adapters and source discovery | Codex | T12 | `prompts/13_*.md` |
| T14 | Evidence collection and provenance | Codex | T13 | `prompts/14_*.md` |
| T15 | Approval, idempotent execution, and reconciliation | Codex | T14 | `prompts/15_*.md` |
| T16 | Replay recorder, sanitizer, and evidence binding | Codex | T15 | `prompts/16_*.md` |
| T17 | Stage 2 strategy and discovery view | Codex | T16 | `prompts/17_*.md` |
| T18 | Stage 3 technical view | Codex | T17 | `prompts/18_*.md` |
| T19 | Stage 4 operations and handoff view | Codex | T18 | `prompts/19_*.md` |
| T20 | Stage 5 product leverage view | Codex | T19 | `prompts/20_*.md` |
| T21 | Guided interview tours and presenter controls | Codex | T20 | `prompts/21_*.md` |
| T22 | Observability, evaluations, and failure injection | Codex | T21 | `prompts/22_*.md` |
| T23 | Security, clean-room, and claim-boundary audit | Codex | T22 | `prompts/23_*.md` |
| T24 | Accessibility, browser, visual, and performance gates | Codex | T23 | `prompts/24_*.md` |
| T25 | Live validation and sanitized evidence capture | Human + Codex | T24 | `prompts/25_*.md` |
| T26 | Same-site Vercel integration | Codex | T25 | `prompts/26_*.md` |
| T27 | Release evidence, deployment, and rollback proof | Human + Codex | T26 | `prompts/27_*.md` |
| T28 | Interview scripts and rehearsal package | Human + Codex | T27 | `prompts/28_*.md` |
| T29 | Final independent audit | Codex | T28 | `prompts/29_*.md` |
| T30 | Optional post-interview enhancements | Codex | T29 | `prompts/30_*.md` |

## Human gates

- **T00:** choose direct route, branch, source profile, and whether optional Salesforce is available.
- **T03:** create the Developer Edition account, complete OAuth, and enter secrets outside the AI conversation.
- **T25:** authorize a single synthetic live test and optionally a synthetic write.
- **T27:** approve production deployment and rollback verification.

## No-shortcut rules

- Do not begin UI implementation before Claude Design outputs and architecture reconciliation are complete.
- Do not build the live adapter before the account capability probe and SDK/MCP spikes.
- Do not deploy before deterministic replay, security, accessibility, and evidence gates pass.
- Do not expose a live API from Vercel in the initial release.
- Do not add CaseFlow to existing navigation or sitemap.
