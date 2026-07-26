# Engagement Assumption Log

| ID | Assumption | Risk if false | Validation | Status |
|---|---|---|---|---|
| A-001 | Invoice line contains a distinct expedite surcharge | Amount cannot be computed deterministically | inspect finance schema and fixture | Open |
| A-002 | Shipment can be linked to invoice/order | Evidence cannot be joined | source mapping validation | Open |
| A-003 | Delay cause is available as a reviewed operational fact | Eligibility may require manual decision | inspect event/cause data | Open |
| A-004 | Policy version and effective date are available | Wrong rule may be applied | policy retrieval and date test | Open |
| A-005 | A synthetic finance target supports creating a credit memo | Live write may be read-only | T03/T25 capability probe | Open |
| A-006 | CRM case accepts a resolution note/update | Second write may be simulated only | source procedure inspection | Open |
| A-007 | A Finance Manager can approve credits over $1,000 | Approval routing changes | stakeholder validation | Accepted for synthetic scenario |
| A-008 | Public demonstration must survive without a network | Live-only design would be fragile | hard project constraint | Accepted |
