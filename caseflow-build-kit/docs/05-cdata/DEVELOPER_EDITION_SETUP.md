# CData Connect AI Developer Edition Setup

**Source freshness:** checked 2026-07-26. Confirm current UI and limits before proceeding.

## Publicly documented baseline

- Free account; no credit card.
- Up to 5 sources and 5 users.
- 500 pooled queries/tool calls per month.
- Query MCP and Developer Edition Management MCP.
- Free-tier exclusions currently include premium connectors, caching, scheduled jobs, workspace isolation, RBAC, and SSO.

## Human setup

1. Sign up through the official Developer Edition page: https://www.cdata.com/developers/ai/developer-edition/
2. Use a personal/non-employer account and only synthetic sources.
3. Create a Personal Access Token under **Settings → Access Tokens**.
4. Copy it directly into ignored local secret storage; it is shown only once.
5. Create the baseline source profile:
   - `CaseFlowCRM` — Google Sheets containing Accounts, Contacts, Cases.
   - `CaseFlowOperations` — PostgreSQL containing finance/operations tables.
   - `CaseFlowPolicy` — Google Drive containing the policy file.
6. Optional: create `CaseFlowSalesforce` in a Salesforce Developer Org and use it instead of Sheets for CRM.
7. Record actual source/connector availability in `reference/CAPABILITY_PROBE_RESULTS.md`.

## Safety

- Never use current employer/client tenants.
- Never paste tokens into an AI prompt.
- Use synthetic connection names and records.
- Do not create a live financial action until T25.
- Reserve at least 150 monthly calls after implementation for interview rehearsal and debugging.
