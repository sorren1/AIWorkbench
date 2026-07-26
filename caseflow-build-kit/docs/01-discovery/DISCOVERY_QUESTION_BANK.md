# Discovery Question Bank

## Outcome and scope

- What does “resolved” mean: recommendation, customer response, credit creation, case closure, or all four?
- What is the cost of a slow or incorrect resolution?
- Which dispute types are in the first phase?
- What actions are strictly advisory?
- What actions can be automated after approval?

## Sources and semantics

- Which system is authoritative for customer, invoice, payment, shipment, and policy?
- How are identifiers linked across systems?
- Which timestamps and time zones govern SLA decisions?
- How is delay cause encoded and who can override it?
- How are policy versions and effective dates recorded?
- What should happen when sources disagree?
- What data can be stale, and for how long?

## Identity and authority

- Does the agent use the end user's identity, a service account, or both?
- Which records and fields may each persona read?
- Which source actions are allowed?
- What financial threshold requires which approver?
- Can the approver also execute?
- When does approval expire or become stale?

## Reliability and operations

- What latency is acceptable for investigation and action?
- Which source failures should retry automatically?
- What failures require a human?
- How are duplicate requests detected?
- What happens when one write succeeds and the second fails?
- Which team owns source, connector, workflow, model, data-quality, and product defects?

## Evaluation and rollout

- What gold cases represent normal, edge, and prohibited behavior?
- How will unsupported claims be detected?
- What is the acceptable escalation rate?
- What must Support receive before go-live?
- What is the rollback plan?
- What field learning should become reusable product capability?
