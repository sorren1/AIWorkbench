# AGENTS.md — Codex Instructions for CaseFlow

These instructions apply to Codex 5.6 sol extra-high when operating in the host `AIWorkbench` repository.

## Mandatory operating procedure

1. Read the current numbered prompt in full.
2. Read every path under its `Read first` section.
3. Inspect current repository state before proposing changes. Repository reality overrides stale planning assumptions; document any divergence.
4. Implement only the current task and its necessary prerequisites. Do not opportunistically begin later views.
5. Preserve all existing Workbench behavior, route contracts, evidence boundaries, and tests.
6. Add tests with each behavior. Do not defer verification to the final task.
7. Update status, decisions, risks, and the task completion report before stopping.

## Truthfulness rules

- Never claim a feature is live-validated without a sanitized evidence manifest tied to a timestamp, source catalog aliases, query/tool names, and output hashes.
- Never call a browser replay “live.”
- Never call a local implementation “production.”
- Never imply that Developer Edition provides workspace isolation, RBAC, or SSO; those are explicitly outside the current free-tier limits unless the actual account proves otherwise.
- Treat CData Toolkits and Management MCP capabilities as probe-required. Public documentation can change or vary by account.
- Preserve the distinction between universal Query MCP tools, CaseFlow application service tools, and any actual Connect AI Toolkit tools.
- Do not invent customer outcomes, latency, accuracy, or cost. Use measured values or clearly labeled targets.

## Security rules

- No secret may appear in source, generated assets, logs, screenshots, traces, tests, completion reports, shell history excerpts, or git history.
- Read secrets only from ignored local environment files or the user's secret manager.
- Never ask the user to paste a PAT or provider key into chat.
- Public Vercel output must be fully functional without CData, LLM, database, or OAuth credentials.
- Live writes are disabled by default and require all three controls: `CASEFLOW_ENABLE_LIVE_WRITES=true`, an approved proposal, and a unique idempotency key.
- Never run a live write against any non-synthetic or employer-owned source.

## Code quality

- TypeScript strict mode; no `any` without a documented boundary.
- Python 3.11+ with type hints, Ruff/formatting, pytest, and explicit exception classification.
- Prefer pure domain functions and ports/adapters.
- Use deterministic fixtures and clocks in tests.
- Treat partial writes as first-class workflow states; never hide them behind a generic retry.
- All IDs shown publicly must be synthetic.
- No external fonts, analytics, trackers, or remotely hosted UI assets.
- Maintain WCAG 2.2 AA behavior, visible focus, keyboard operation, reduced motion, and responsive layouts.

## Route and discoverability constraints

- CaseFlow direct route: `/caseflow/` with stage paths.
- Add no links to CaseFlow from `/`, `/workbench/`, the Workbench demo, article, sitemap, or existing navigation.
- Add `noindex,nofollow,noarchive` metadata and an `X-Robots-Tag` header where supported.
- Add a robots disallow entry, but never treat route obscurity as security.

## Completion format

Every completion report must list:

- files changed;
- decisions made;
- commands and tests run;
- measured results;
- security/claim review;
- remaining limitations;
- exact next task.
