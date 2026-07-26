# Safe Write and Reconciliation Model

## Pre-conditions

A write is permitted only when:

- mode is `LOCAL_LIVE_APPROVED_WRITE` or local mock;
- target equals the configured synthetic allow list;
- evidence is complete and conflict-free;
- proposal digest equals the approved digest;
- approval is valid, unexpired, and from a distinct authorized reviewer;
- amount and action set are within approval;
- idempotency key is supplied;
- execution ledger has no conflicting payload for that key.

## Action order

1. Create finance credit memo using case/proposal idempotency reference.
2. Persist finance receipt.
3. Update CRM case with resolution and credit reference.
4. Persist CRM receipt.
5. Mark completed and create customer response.

## Failure behavior

- Failure before finance success: `FAILED_SAFE`; retry may start over after cause resolution.
- Finance success, CRM failure: `RECONCILIATION_REQUIRED`; never recreate credit.
- Same idempotency key and same payload: return original result.
- Same idempotency key and different payload: hard conflict requiring operator review.

## Human approval is not a button animation

The record must include reviewer, role, timestamp, proposal digest, evidence digest, amount, action list, expiry, and decision reason.
