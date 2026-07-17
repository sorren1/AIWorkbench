# ADR: Keep the public site static and real execution local

- Status: Accepted
- Date: 2026-07-17
- Decision owners: repository maintainers

## Context

The case study benefits from one real file-modification/validation proof, but exposing code execution to anonymous visitors would require authentication, abuse prevention, tenant isolation, quotas, durable operations, incident response, and cost ownership. Those systems are outside a portfolio artifact and would expand risk more than credibility.

## Decision

Keep all public routes static. The browser may load only checked-in, schema/hash-validated, sanitized evidence snapshots. It cannot call localhost, Docker, a sandbox provider, a model gateway, or an execution API.

Provide one explicit developer CLI that accepts no visitor repository, patch, command, or prompt. It copies the repository-owned synthetic toy project into a disposable workspace, validates approved targets and context, applies one deterministic patch, runs fixed checks under the typed `SandboxProvider`, records evidence, and cleans up in `finally`. Local Docker is the default; optional E2B requires an explicit flag and credential.

## Consequences

- Static hosting retains a small public attack surface and no provider spend path.
- Visitors inspect recorded evidence rather than triggering a live demonstration.
- The local slice proves controller and evidence mechanics for one fixture, not safe untrusted-code hosting.
- Any future live endpoint requires a new architecture decision and threat model before implementation.

## Alternatives considered

- **Anonymous hosted runner:** rejected on abuse, isolation, operational, and cost grounds.
- **Browser-only simulated evidence:** rejected because it cannot prove real controlled modification and validation.
- **Host command execution without a sandbox:** rejected because it weakens isolation and reproducibility.
