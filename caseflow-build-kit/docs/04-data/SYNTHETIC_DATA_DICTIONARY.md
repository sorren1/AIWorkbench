# Synthetic Data Dictionary

## Naming

All organizations and people are fictional. Public email addresses use `example.com`. IDs use obvious project prefixes.

## Key records

| Record | Value |
|---|---|
| Account | `ACC-10042` / Northstar Industrial Supply |
| Contact | `CON-2042` / Jordan Lee / jordan.lee@example.com |
| Case | `CS-2026-1042` |
| Invoice | `INV-88201` |
| Order | `ORD-77309` |
| Shipment | `SHP-77431` |
| Policy | `POL-2026.2` |
| Proposal | `PROP-CS-2026-1042-001` |
| Approval | `APR-CS-2026-1042-001` |
| Idempotency key | `caseflow:CS-2026-1042:PROP-001` |

## Time zone

Business timestamps are stored with offset. Normalized evidence additionally records UTC. The canonical scenario uses Central Daylight Time (`-05:00`).

## Money

USD values use two-decimal strings in JSON contracts and `NUMERIC(18,2)` in PostgreSQL.
