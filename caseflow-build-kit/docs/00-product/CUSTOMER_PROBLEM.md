# Customer Problem and Business Framing

## Current-state workflow

1. Support receives a disputed charge.
2. An analyst opens CRM, billing, shipment, and policy systems independently.
3. The analyst manually reconciles identifiers and dates.
4. A policy interpretation is written in free text.
5. Approval is requested through email or chat.
6. Finance applies a credit.
7. Support updates the case and sends a response.
8. If one step fails, ownership is unclear and duplicate work is possible.

## Failure modes

- The wrong customer, invoice, or shipment is selected.
- One source is stale or unavailable.
- The analyst omits a material event.
- The policy version is not recorded.
- The explanation contains unsupported statements.
- A credit is applied twice after retry.
- Finance succeeds but CRM update fails.
- Support cannot determine whether the problem is data, configuration, source availability, implementation, or product behavior.

## Desired business outcome

A resolution packet can be reviewed quickly because the required facts, source provenance, policy decision, approval state, and action receipts are already assembled.

## What is measured in this reference implementation

- evidence completeness and conflict detection;
- expected disposition agreement on five gold cases;
- unsupported-claim count;
- unauthorized-write blocks;
- duplicate-write prevention;
- partial-failure classification;
- tool/query count and elapsed time in measured local runs;
- support-handoff completeness.

Do not publish unmeasured ROI claims such as “80% faster.”
