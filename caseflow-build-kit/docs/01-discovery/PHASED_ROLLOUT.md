# Phased Rollout Model

## Phase 0 — Discovery and offline replay

- Confirm sources, identifiers, authority, policy, and acceptance criteria.
- Run five synthetic gold cases.
- No live source access or writes.

## Phase 1 — Live read, human recommendation

- Connect synthetic sources through Developer Edition.
- Collect evidence and produce proposals.
- Human performs source updates manually.
- Measure completeness, conflicts, and support burden.

## Phase 2 — Approved synthetic write

- Enable one isolated synthetic finance/CRM target.
- Require separate approval and idempotency.
- Inject partial failure and prove reconciliation.

## Phase 3 — Production design review

Before any real customer deployment, add or validate:

- user/workload identity and delegated authorization;
- workspace/source/tool isolation;
- enterprise RBAC and SSO;
- managed secrets and rotation;
- immutable audit retention;
- source-specific rate limits and change management;
- high availability and incident ownership;
- privacy, legal, and financial control review;
- shadow/canary rollout and rollback.

CaseFlow publicly demonstrates phases 0–2 on synthetic data and documents phase 3 as production design only.
