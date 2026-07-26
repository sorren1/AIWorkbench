# Decision Log

Use one section per decision. Never rewrite history; supersede a decision with a new record.

## D-001 — One implementation, four lenses

- **Status:** Accepted
- **Date:** 2026-07-26
- **Decision:** Build one end-to-end CaseFlow workflow and present it through strategy, technical, operations, and product routes.
- **Reason:** Interviewers can compare notes about the same architecture while each sees the depth relevant to their role.
- **Consequence:** Stage routes must be independently understandable and share canonical case state.

## D-002 — Static public replay, local live integration

- **Status:** Accepted
- **Date:** 2026-07-26
- **Decision:** Vercel serves deterministic static replay. CData, database, OAuth, and LLM calls run only locally and emit sanitized checked-in evidence.
- **Reason:** Preserves the existing static security model, prevents secret exposure, and eliminates interview network risk.
- **Consequence:** Public UI must clearly distinguish replay from live validation.

## D-003 — Structured facts remain structured

- **Status:** Accepted
- **Date:** 2026-07-26
- **Decision:** Query CRM, invoice, payment, shipment, and event data through relational interfaces. Use retrieval only for unstructured policy content.
- **Reason:** Avoids unnecessary vectorization, improves determinism, and demonstrates appropriate technology selection.

## D-004 — Deterministic authority

- **Status:** Accepted
- **Date:** 2026-07-26
- **Decision:** The model may explain and synthesize but cannot choose source permissions, calculate credit authority, approve action, or bypass workflow guards.
- **Reason:** The model must remain subordinate to identity, policy, approval, and evidence controls.

## D-005 — Baseline source profile

- **Status:** Accepted, probe-required
- **Date:** 2026-07-26
- **Decision:** Prefer Google Sheets for synthetic CRM, PostgreSQL for finance/operations, and Google Drive for policy. Salesforce Developer Org is an optional enhanced profile.
- **Reason:** Keeps setup accessible while preserving a credible multi-system architecture.
- **Consequence:** T03 must verify connector availability and may choose a documented fallback.

## D-006 — Preserve the local build-kit exclusion and track task evidence deliberately

- **Status:** Accepted
- **Date:** 2026-07-26
- **Decision:** Preserve the existing `/caseflow-build-kit/` rule in `.git/info/exclude`. For the explicitly requested T01 commit, force-add only T01's required governance, evidence, status, decision, and risk paths; do not add the complete build-kit archive.
- **Reason:** The repository owner deliberately keeps the separate kit beside the Workbench source, while T01 explicitly requires a focused evidence-bearing commit. Narrow force-addition satisfies the task without overwriting the local exclusion or importing unrelated future-task material.
- **Consequence:** Future tasks must intentionally add their required build-kit outputs. The untracked kit archive, including the locally corrected status renderer, is not durable branch evidence and must not be assumed available in another clone or worktree; R-013 remains open until the operator selects a durable distribution boundary.

## D-007 — Track the complete non-secret CaseFlow build kit

- **Status:** Accepted; supersedes D-006 for T02 and later work
- **Date:** 2026-07-26
- **Decision:** Remove the local `.git/info/exclude` rule that excluded
  `/caseflow-build-kit/` and track the complete non-secret kit on
  `feature/caseflow-reference-implementation`. Preserve only narrow, documented
  ignores for credentials, OAuth/local state, raw live evidence, call ledgers,
  environments, caches, generated reports, and temporary experiment clones.
- **Reason:** Prompts, contracts, fixtures, templates, controls, and required
  helpers must be available in a clone and in the post-T02 design worktree.
  Force-adding individual evidence files cannot provide that durability.
- **Consequence:** T02 includes the previously ignored kit baseline. Future
  tasks treat kit changes as normal reviewed source changes; R-013 is closed.

## D-008 — Dependency-free static stage routing with a local-only service

- **Status:** Accepted
- **Date:** 2026-07-26
- **Decision:** Use one Vite HTML entry at `caseflow/index.html`, an exact
  native-URL pathname map in `src/caseflow/routing/routes.ts`, and
  CaseFlow-scoped Vite dev/preview and Vercel rewrites. Keep public
  `PUBLIC_REPLAY`/`RECORDED_LIVE` modes separate from the loopback-only FastAPI
  service modes.
- **Reason:** This fits the current multi-page static build, restrictive CSP,
  and Vercel model without adding a router or public API.
- **Consequence:** CaseFlow assets must use root-public URLs so rewritten deep
  paths remain stable. Existing navigation and sitemap remain unchanged.

## D-009 — Contract-first authority and bounded dependencies

- **Status:** Accepted
- **Date:** 2026-07-26
- **Decision:** The corrected OpenAPI, mode, route, schema, tool, state, and
  source-authority contracts in the tracked kit govern T10–T24. Consequential
  writes always require human approval; amount selects the authorized reviewer
  class. Add no frontend runtime dependency by default and keep the local
  Python dependency ceilings defined in the T02 architecture reconciliation.
- **Reason:** The planning baseline contained route/reference gaps and
  ambiguous write semantics that would otherwise become implementation drift.
- **Consequence:** Later evidence may supersede probe-required adapter details,
  but it cannot relax the public/local or safe-write boundary without a new
  decision.
