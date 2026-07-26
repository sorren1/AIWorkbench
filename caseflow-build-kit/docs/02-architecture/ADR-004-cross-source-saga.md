# ADR-004 — Explicit Saga and Reconciliation

- **Status:** Accepted
- **Decision:** Treat finance credit and CRM update as separate actions with durable receipts. Do not pretend they are a distributed transaction.
- **Reason:** External systems do not share one ACID boundary. Retries can duplicate financial actions.
- **Consequence:** A finance success followed by CRM failure enters `RECONCILIATION_REQUIRED`; rerun reuses the finance receipt and retries only the incomplete action.
