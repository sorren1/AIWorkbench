# Canonical Demonstration Scenario

## Case

- **Case:** `CS-2026-1042`
- **Customer:** Northstar Industrial Supply (`ACC-10042`)
- **Invoice:** `INV-88201`
- **Invoice amount:** `$24,800.00`
- **Disputed charge:** Expedite surcharge, `$1,240.00`
- **Shipment:** `SHP-77431`
- **Committed delivery:** `2026-07-10T17:00:00-05:00`
- **Actual delivery:** `2026-07-12T09:20:00-05:00`
- **Delay:** 40 hours 20 minutes
- **Cause:** carrier capacity failure; customer was available and address was valid
- **Policy:** `Resolution Policy 2026.2`
- **Rule:** carrier-caused delay greater than 24 hours permits refund of the expedite fee
- **Approval:** credits greater than `$1,000.00` require Finance Manager approval
- **Expected proposal:** credit `$1,240.00`

## Presentation arc

1. The customer request is vague and distributed across systems.
2. Source authority and required evidence are explicit.
3. CaseFlow gathers facts and reports completeness/conflicts.
4. A deterministic rule computes eligibility and amount.
5. The model may draft an explanation but cannot change facts or authority.
6. The system blocks the credit before approval.
7. A separate approver signs the exact proposal digest.
8. An idempotency key prevents duplicate execution.
9. An injected CRM failure creates a reconciliation task rather than pretending the workflow completed.
10. The same implementation produces a support handoff and reusable deployment blueprint.
