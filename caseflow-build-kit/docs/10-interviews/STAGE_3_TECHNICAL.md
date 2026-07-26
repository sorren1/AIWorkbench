# Stage 3 — Technical Lead Lens

## Ask before presenting

> I have a seven-minute technical slice that makes the source, evidence, authority, idempotency, and failure boundaries concrete. Would it be useful to walk through it?

## Seven-minute order

1. Source discovery and current CData capability evidence.
2. Structured SQL facts versus unstructured policy retrieval.
3. Purpose-specific CaseFlow service tools and why universal query tools do not execute financial actions.
4. Evidence packet, source provenance, completeness, and conflicts.
5. Deterministic policy and optional evidence-bound explanation.
6. Blocked write, separate approval, and digest binding.
7. Idempotent execution and partial-failure reconciliation.
8. Trace, tests, limitations, and public replay boundary.

## Prepare for interruption

They may ask to leave the tour and inspect:

- CData SDK adapter;
- MCP tool responses;
- state guard code;
- policy tests;
- idempotency ledger;
- sanitizer;
- failure injection;
- Vite/Vercel integration.

## Technical principles to state

- The model cannot define authority.
- External systems do not share one transaction.
- Structured facts should remain structured.
- Approval is bound to an exact digest.
- Evidence changes invalidate approval.
- Retry safety depends on action semantics and idempotency.
- A replay is clearly labeled and does not impersonate live behavior.
