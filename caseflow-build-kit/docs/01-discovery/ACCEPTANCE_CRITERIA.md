# Acceptance Criteria

## AC-01 — Unique identity resolution

Given case `CS-2026-1042`, the system resolves exactly one account, invoice, and shipment. Zero or multiple matches produce an evidence-incomplete state.

## AC-02 — Evidence provenance

Every material fact contains source alias, object/table, record identifier, field(s), observed value, observation timestamp, and content digest.

## AC-03 — Correct deterministic disposition

The canonical facts produce `ELIGIBLE_CREDIT`, amount `$1,240.00`, policy `2026.2`, approval class `FINANCE_MANAGER`.

## AC-04 — Conflicts block execution

A conflict in committed/actual delivery or delay cause prevents approval-ready status.

## AC-05 — Unsupported claims rejected

The explanation may contain only facts represented in the evidence packet or policy decision.

## AC-06 — Approval separation

The proposer and approver are distinct synthetic identities. Approval binds proposal digest, allowed actions, amount, expiration, and reviewer.

## AC-07 — No approval, no write

Every write adapter rejects a request that lacks a valid approval record.

## AC-08 — Idempotent execution

Reusing the same idempotency key returns the original receipt and creates no second credit memo.

## AC-09 — Partial failure visibility

If finance succeeds and CRM fails, state becomes `RECONCILIATION_REQUIRED`; the finance receipt remains visible and automatic replay does not create a second credit.

## AC-10 — Customer truthfulness

Customer response says “credit applied” only after finance receipt success. If reconciliation remains open, response explicitly states the pending internal case update without exposing irrelevant implementation detail.

## AC-11 — Public boundaries

Public application contains no credentials, live raw responses, real personal data, or unqualified production claims.

## AC-12 — Support ownership

Every terminal/degraded state maps to a failure category, initial owner, next action, and escalation path.
