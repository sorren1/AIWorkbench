# Domain Model

## Aggregate roots

### ResolutionCase

Owns case identity, workflow state, evidence packet reference, proposal, approval, execution receipts, reconciliation tasks, and customer-response status.

### EvidencePacket

Immutable for a run. Contains normalized facts, source references, completeness result, conflicts, policy version, collection time, and digest.

### ResolutionProposal

Contains disposition, amount, currency, policy rule, explanation facts, required approval class, proposed actions, and digest.

### ApprovalRecord

Contains decision, reviewer, role, proposal/evidence digests, allowed amount/actions, reason, timestamp, and expiry.

### ExecutionRecord

Contains idempotency key, action attempts, receipts, errors, reconciliation state, and final status.

## Value objects

- `CaseId`, `AccountId`, `InvoiceId`, `ShipmentId`
- `Money`
- `UtcInstant` and source time-zone context
- `SourceReference`
- `EvidenceFact`
- `Digest`
- `PolicyVersion`
- `IdempotencyKey`
- `ApprovalClass`
- `FailureCategory`

## Invariants

- Money uses decimal, never binary floating point.
- Every evidence fact has provenance.
- Proposal amount comes from deterministic policy.
- Approval binds the exact proposal/evidence.
- A completed action has a receipt.
- Customer response cannot outrun execution state.
