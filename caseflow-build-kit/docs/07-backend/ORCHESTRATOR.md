# Orchestrator Design

The orchestrator is an explicit application service, not an unconstrained autonomous loop.

## Investigation pipeline

1. validate case ID format;
2. resolve cross-source identities;
3. collect required facts using approved query templates;
4. normalize values and timestamps;
5. compute completeness and conflicts;
6. retrieve policy version;
7. evaluate deterministic policy;
8. optionally draft evidence-bound explanation;
9. create proposal and approval requirement;
10. persist run/evidence/proposal artifacts.

## Execution pipeline

1. validate current state and approval;
2. reserve idempotency key;
3. check for existing finance credit;
4. create or reuse finance receipt;
5. update CRM case;
6. classify result as completed or reconciliation required;
7. draft customer communication consistent with receipts;
8. export trace and handoff.

## Agent usage

An optional scaffolded agent may perform source discovery or compose a natural-language answer from read-only tools. It does not replace the deterministic orchestrator or gain access to write adapters.
