# Workflow State Machine

## States

| State | Meaning |
|---|---|
| `NEW` | case reference accepted but not resolved |
| `IDENTITY_RESOLVING` | account/invoice/shipment mapping in progress |
| `EVIDENCE_COLLECTING` | required source facts being collected |
| `EVIDENCE_INCOMPLETE` | required evidence absent or ambiguous |
| `EVIDENCE_CONFLICT` | material sources disagree |
| `RECOMMENDATION_READY` | deterministic disposition available |
| `APPROVAL_REQUIRED` | proposal exceeds authority threshold or action class requires review |
| `APPROVED` | valid approval bound to proposal digest |
| `REJECTED` | reviewer denied proposal |
| `EXECUTION_PENDING` | approval valid and action not started |
| `EXECUTING` | source writes in progress |
| `RECONCILIATION_REQUIRED` | at least one write succeeded and a later action failed |
| `COMPLETED` | all required action receipts succeeded |
| `CLOSED_NO_ACTION` | policy determines no credit/action |
| `FAILED_SAFE` | failure occurred before any consequential write |

## Guard examples

- `EVIDENCE_COLLECTING → RECOMMENDATION_READY` requires all mandatory evidence and no material conflict.
- `RECOMMENDATION_READY → APPROVAL_REQUIRED` whenever a consequential source
  action is proposed; the deterministic amount threshold selects
  `SUPERVISOR` or `FINANCE_MANAGER` authority.
- `APPROVAL_REQUIRED → APPROVED` requires distinct reviewer, matching digest, allowed action set, and unexpired record.
- `APPROVED → EXECUTING` requires live writes enabled, synthetic target allow-listed, and unique idempotency key.
- `EXECUTING → COMPLETED` requires all required receipts.
- `EXECUTING → RECONCILIATION_REQUIRED` when a prior consequential action succeeded and a subsequent action failed.

## Invalid transitions

The implementation must reject:

- approval before recommendation;
- self-approval;
- approval of a stale proposal digest;
- execution after approval expiration;
- execution in replay mode;
- execution with incomplete/conflicting evidence;
- re-execution with a new action payload under an existing idempotency key;
- customer “completed” communication before required receipts.
