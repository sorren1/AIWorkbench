# One-Page Engagement Brief

## Customer objective

Reduce investigation and resolution effort for invoice disputes that require evidence and actions across CRM, finance, fulfillment, and policy systems.

## Intended users

Resolution analysts, finance approvers, Support/Customer Success, and implementation/support engineers.

## Business outcome

Produce a reviewable resolution packet and safely execute an approved credit while preserving source authority, evidence provenance, customer communication, and operational ownership.

## Authoritative sources

| Fact/action | Authority |
|---|---|
| Account, contact, support case | CRM source |
| Invoice, payment, credit memo | Finance source |
| Shipment commitment, events, delivery, cause | Operations source |
| Eligibility, amount rule, approval threshold | Versioned policy source |
| Approval decision | CaseFlow approval journal / production approval service |
| Final customer communication | CRM case history |

## Constraints

- Entire demo uses synthetic data.
- Developer Edition and local-only credentials.
- Public Vercel application is replay-only.
- Human approval required for consequential financial actions.
- Source writes must be idempotent and auditable.
- Unsupported or conflicting evidence must escalate.

## Acceptance criteria

See `ACCEPTANCE_CRITERIA.md`.

## Non-goals

See `../00-product/NON_GOALS.md`.

## Phases

1. Read-only evidence and recommendation.
2. Human approval and simulated execution.
3. Local approved write to a synthetic target.
4. Production architecture model for identity, workspace isolation, observability, and support ownership.

## Reusable assets

Discovery worksheet, source-authority matrix, schema mapping, service-tool contracts, policy rules, approval pattern, failure suite, runbook, evaluation set, and product-friction log.
