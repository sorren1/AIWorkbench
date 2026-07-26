# Source Models and Baseline Mapping

## `CaseFlowCRM` — Google Sheets baseline

Sheets/tables:

- `Accounts`
- `Contacts`
- `Cases`

Optional enhanced profile: Salesforce Developer Org with `Account`, `Contact`, and `Case`.

## `CaseFlowOperations` — PostgreSQL

Schemas/tables:

- `finance.invoices`
- `finance.invoice_lines`
- `finance.payments`
- `finance.credit_memos`
- `operations.shipments`
- `operations.shipment_events`
- `caseflow.execution_ledger`

## `CaseFlowPolicy` — Google Drive or fallback fixture

- `resolution-policy-2026-2.md`
- file metadata and content retrieval are recorded;
- a local checked-in copy remains the deterministic replay authority.

## Cross-source keys

- CRM case stores `invoice_id` and `shipment_id`.
- Invoice stores `account_external_id` and `order_id`.
- Shipment stores `order_id` and `account_external_id`.
- CaseFlow validates all three relationships before recommendation.
