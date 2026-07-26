# Terminology

| Term | CaseFlow meaning |
|---|---|
| CaseFlow | Independent synthetic reference implementation; never call it a CData product |
| Query MCP | CData remote MCP surface for source discovery, SQL query, and procedures |
| Management MCP | CData remote MCP surface for account connection management |
| Universal tools | Generic catalog/schema/query/procedure tools exposed by Query MCP |
| CaseFlow service tool | Purpose-specific application-layer operation such as `get_invoice_evidence`; not automatically a CData Toolkit |
| Toolkit | A CData product construct for curated source-specific tools; actual account capability must be probed |
| Evidence packet | Immutable-for-run collection of normalized source facts, provenance, completeness, conflicts, and digests |
| Proposal | Non-authoritative recommended resolution calculated from evidence and deterministic policy |
| Approval | Distinct human decision tied to proposal digest, reviewer, scope, and expiration |
| Execution receipt | Source response and idempotency result from an approved write |
| Reconciliation | Controlled recovery process after only part of a multi-source action succeeds |
| Replay | Deterministic browser rendering from checked-in synthetic/recorded artifacts; not a live integration |
| Recorded live | Sanitized evidence produced by a local live CData run, viewed later without a network dependency |
| Production design | Architecture that would be required in a customer deployment but is not implemented in the public prototype |
| Source authority | Declared system that owns a particular business fact or action |
| Gold case | Synthetic scenario with expected disposition and required evidence |
