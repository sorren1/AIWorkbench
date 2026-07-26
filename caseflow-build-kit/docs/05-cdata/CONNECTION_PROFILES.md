# Connection Profiles

## Profile A — Accessible baseline

| Alias | Source | Content |
|---|---|---|
| `CaseFlowCRM` | Google Sheets | Accounts, Contacts, Cases |
| `CaseFlowOperations` | PostgreSQL | invoices, lines, payments, credits, shipments, events, ledger |
| `CaseFlowPolicy` | Google Drive | versioned Markdown policy |

## Profile B — Enhanced CRM

Replace `CaseFlowCRM` with Salesforce Developer Org. Keep PostgreSQL and Drive.

## Profile C — Read-only fallback

Use only sources that can be configured without paid connectors. Execute all writes through local mock adapters and record CData live reads.

## Profile D — Offline

Use official Query API mock plus repository fixtures. This mode must remain complete enough for all UI, policy, approval, idempotency, failure, and handoff demonstrations.

## Selection rule

Choose the profile during T03 based on actual connector access, setup burden, remaining call budget, and safety. Do not delay the project merely to force Salesforce into the demo.
