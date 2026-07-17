# ADR: Human approval boundaries

- Status: Accepted
- Date: 2026-07-17
- Decision owners: repository maintainers

## Context

Risky file writes, validation evidence finalization, and release decisions require more than an “approve” button. A decision must identify who requested and decided, what exact action was reviewed, whether the decision is still fresh, and whether the reviewer is independent where policy requires it.

## Decision

Create approval requests only after capability, scope, resource, target, and policy evaluation. Bind each request to canonical arguments, agent/tool/policy versions and hashes, context pack, change targets, requester, risk, expiry, and required approver scopes/personas. Prohibit self-approval when separation of duties is configured. Deny takes precedence; approval can authorize only the bound request and cannot widen it.

Represent state as hash-chained events and materialize pending/approved/rejected/expired/invalidated outcomes. On resume, recompute all bindings and consume an eligible approval once. Policy/context/argument/target changes invalidate the old decision and require a new request/run.

Browser storage remains clearly synthetic and local. CLI files remain gitignored. Neither is presented as authenticated enterprise durability.

## Consequences

- Reload and pause/resume can be demonstrated without implying a production identity service.
- Approval UX must show the requested effect and policy basis, not only a generic confirmation.
- Production adoption requires authoritative identity, transactional single-use consumption, immutable retention, access review, delegation/revocation, and incident procedures.

## Alternatives considered

- **Synchronous confirmation dialog only:** rejected because it cannot support durable review, separation of duties, expiry, or safe resume.
- **Agent self-review:** rejected because the generator must not become the authority for its own risky effect.
