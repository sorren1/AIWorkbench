# Human approval protocol

## Purpose and boundary

A risky action pauses before invocation. Approval is a separate append-only decision bound to the proposed action; it is not a remembered tool-name grant. Browser records are durable only in this browser profile through versioned local storage. CLI records are durable only in a gitignored local run directory. Neither store is authenticated, shared, tamper-resistant, or suitable as a production audit system.

## Versioned policy contract

`ApprovalPolicy` is defined in TypeScript and `approval-policy.schema.json`. Each content-hashed policy declares tool/stage/risk/agent/path matchers, mode (`ALLOW`, `NOTIFY`, `REQUIRE_APPROVAL`, or `DENY`), approver personas/scopes, timeout, optional decision-cache TTL, self-approval behavior, reason requirements, and independent provenance.

The default set covers bounded repository reads, controlled writes inside approved targets, writes outside approved targets, sandbox network access, fixed local validation, finalized/mutable evidence, human diff review, and release readiness. Generated public schemas are under `/capabilities/schemas/`; the complete policy set is in `/capabilities/registry.json` and as inspectable records under `/capabilities/policies/`.

## Request and event model

An approval request binds request/run/stage identifiers; exact agent and tool versions/hashes; canonical SHA-256 proposed-arguments hash; target paths; requester/effective subject; delegated identity; exact policy version/hash; change-target/context-pack digests; timestamps; status; and decision actor/reason/hash.

The immutable request file and append-only event log are separate from materialized current state. Events have monotonically increasing per-request sequence numbers, a previous-event hash, and their own SHA-256 content hash. Materialized states are `PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`, and `INVALIDATED`.

## Pause and resume

The browser Approval Inbox records a decision but does not execute the action. `Resume bound local action` revalidates the request before changing browser-local workflow state.

The functional local sandbox flow is:

```bash
npm run demo:sandbox -- --scenario approval-required
npm run demo:approve -- --request <request-id> --as synthetic-code-reviewer --reason "Reviewed bounded synthetic diff"
npm run demo:resume -- --run <run-id>
```

Use `npm run demo:reject` with the same request/persona/reason options to reject. Commands print a one-line JSON summary. Runs are stored under `.workbench/runs/` by default and are gitignored. `--run-root <path>` is available for isolated tests.

`demo:sandbox` copies the synthetic fixture into the run directory, creates a pending request, appends `REQUESTED`, and records `WAITING_FOR_APPROVAL`. It does not start MCP or write the patch. `demo:approve`/`demo:reject` validates request/event schemas and persona policy, then appends one event. `demo:resume` recomputes the current manifest and every bound digest before it starts local stdio MCP.

## Revalidation and replay defense

Resume fails when proposed arguments, agent version/hash, tool version/hash, change-target digest, or context-pack digest differs. It also fails on request expiry, decision-cache expiry, a no-longer-authorized approver, rejection, or prior run completion. A mismatch appends `INVALIDATED` and blocks the run. The MCP host independently repeats authorization and binding validation immediately before invocation; a write-enabled child or previously approved tool name does not bypass the host.

## Production replacement

A production adapter would use an authenticated API, transactional append-only event store, optimistic concurrency/idempotency keys, trusted time, immutable retention, signed request/decision envelopes, OIDC/OAuth2 on-behalf-of identities, policy-distribution versioning, revocation, and a durable workflow engine. Those are requirements, not capabilities claimed by this static project.
