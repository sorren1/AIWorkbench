# Context packs and memory governance

## Purpose and boundary

The workbench does not give a stage an opaque “agent memory.” It assembles a versioned `ContextPack` from checked-in public or synthetic `ContextRecord` fixtures. A reviewer can inspect every candidate, inclusion, exclusion, freshness result, policy reference, estimate, truncation decision, and SHA-256 digest before trusting an artifact or execution.

This implementation is functional and deterministic in the browser and local sandbox. It does not perform semantic search, vector retrieval, live provider calls, external data ingestion, or arbitrary prompt-history recall. External Jira, repository, documentation, database, and MCP-style sources shown elsewhere remain simulated adapter examples.

## Versioned contracts

`ContextRecord` schema version 1 records:

- a stable ID and one of the declared architecture, convention, domain, issue, prior failure/fix, user preference, or custom record types;
- concise content, a public/synthetic source reference, optional source commit/version, and a canonical content hash;
- sensitivity, stage/persona/agent allow-lists, required scopes, priority, timestamps, TTL/freshness policy, lifecycle state, tags, and optional citations.

`ContextPack` schema version 1 binds one run and stage to:

- the exact agent-card and context-policy versions/hashes (the human-selected Seed stage records why no agent card applies);
- the deterministic rule version, tag query, persona/scopes, candidate IDs, and stable ordering rule;
- complete included and excluded record decisions with human-readable reasons;
- per-record TTL results, character/UTF-8 byte/estimated-token totals, budget exclusions, and the canonical pack digest.

The TypeScript contracts live in `src/demo/context/contracts.ts`; Draft 2020-12 schemas are generated publicly under `/capabilities/schemas/`. Checked-in public record and representative pack exports are under `/capabilities/context/`.

## Deterministic selection

The default adapter is `DETERMINISTIC_RULES` at `deterministic-context-v1`. It:

1. verifies the approved memory/context policy and its hash;
2. verifies the approved stage agent, agent hash, stage binding, and exact policy binding;
3. orders candidates by priority descending, update time descending, then ID ascending;
4. checks record hash, revocation, TTL/stale state, sensitivity, stage, persona, agent, delegated scope, episodic permission, record type, source type, and required tags;
5. includes eligible records until the byte or estimated-token limit would be exceeded, then records `OVER_BUDGET` exclusions without partially slicing a record;
6. hashes canonical JSON for the complete pack.

The pack displays its character count and a deliberately conservative token estimate of `ceiling(characters / 4)`. This is labeled estimated; it is not tokenizer-measured or provider-reported usage.

Prior failure and fix records are eligible only for the Implementation Agent because its bound policy explicitly permits episodic repair context. No checked-in fixture contains secrets, private organization content, arbitrary user prompt history, or live account data.

## Invalidation and evidence binding

Artifact bodies and execution manifests carry the exact pack digest. Approval requests already bind that digest alongside agent, tool, argument, and change-target hashes. Rebuilding a pack from a changed selected record or changed policy produces a different digest. The browser’s context-revision exercise marks the affected stage and non-empty dependents stale, and the UI shows the old versus candidate digest.

The repository-owned sandbox writes `context-pack.json` beside its run record. Resume validates the JSON Schema, pack digest, current deterministic selection, policy/agent hashes, and current freshness before invoking the MCP tool. A mismatch appends an `INVALIDATED` approval event, marks the run `BLOCKED`, and requires an explicitly new run. Successful `execution-evidence.json` embeds the complete context pack, digest, and context-bound stage execution manifest.

Browser workflow state remains ephemeral. The checked-in representative packs are review fixtures, not evidence that an external execution occurred.

## Extension seam

A future retrieval adapter may propose semantically ranked candidates, but it must return the same `ContextRecord` contract, declare its query/model/index versions, remain subject to all authorization/freshness/budget checks, and produce a replayable evidence record. It may not silently replace the deterministic default. See `docs/adr/deterministic-context-retrieval.md`.

## Verification

Unit tests cover schemas, selection, TTL, revocation, sensitivity/source/stage/persona/agent/scope restrictions, stable ordering, token/byte truncation, episodic gating, digest validation, record/policy invalidation, artifact binding, and execution-manifest binding. CLI tests cover persistence, successful evidence binding, and fail-closed resume after pack tampering. Playwright covers the per-stage manifest, exclusion disclosure, and stale cascade triggered by a context revision.
