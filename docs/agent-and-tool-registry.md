# Agent and tool registry

## Purpose

The registry makes the workbench's stage authorization inputs inspectable. For every executable delivery stage it records the exact approved agent version and content hash, declared tools and write paths, input/output schemas, model and context-selection policy, approval policies, and execution budgets.

This is a deterministic synthetic portfolio fixture. It does not represent remotely deployed agents, authenticated users, live model calls, or a production control-plane service.

## Registry contents

The seven stage agents map directly to the existing workflow after the non-agent Seed step:

| Stage     | Agent                | Primary boundary                                                     |
| --------- | -------------------- | -------------------------------------------------------------------- |
| Intake    | Intake Agent         | Reads one synthetic issue and writes the intake artifact.            |
| Spec      | Specification Agent  | Reads bounded issue/repository context and writes the specification. |
| Plan      | Planning Agent       | Produces ordered steps, risks, and verification intent.              |
| Targets   | Change-Target Agent  | Declares the file allow-list before implementation.                  |
| Implement | Implementation Agent | Applies an approved patch only to `src/**` in a disposable toy copy. |
| Verify    | Verification Agent   | Runs the fixed local validation command and records evidence.        |
| PR Review | Review Assistant     | Summarizes and flags risk; it can never grant human approval.        |

The seven execution descriptors are issue read, repository search, repository file read, controlled patch application, sandbox command execution, diff inspection, and evidence writing. Two additional browser-local workflow descriptors record human diff review and request/resume release readiness. The local MCP server exposes only the repository search/read/patch/diff/validation subset.

## Contracts and validation

Source contracts are in `src/demo/control-plane/registry/contracts.ts`. JSON Schemas—including approval policy, request, event, identity-envelope, and materialized-store contracts—are in `src/demo/control-plane/registry/schemas/` and copied to `/capabilities/schemas/` for public inspection.

`npm run registry:generate` performs canonical SHA-256 hashing and JSON Schema validation, then writes:

- `src/demo/control-plane/registry/generated.ts` for the React demo;
- `/capabilities/registry.json` for the complete read-only snapshot;
- `/capabilities/agents/index.json` and `/capabilities/agents/<id>.json` for individual capability cards; and
- public copies of the registry JSON Schemas.

`npm run registry:check` regenerates in memory and fails if a committed output is missing or stale. Invalid source content fails before a generated executable record is emitted.

The digest covers declarative identity and policy content, not lifecycle/approval timestamps. A declarative or semantic-version change produces a new digest, clears approval metadata, returns the record to `DRAFT`, and invalidates dependent execution manifests.

## Execution eligibility

`resolveStageExecutionManifest` is deny-by-default. It requires:

1. one agent registered for the requested stage;
2. valid AgentCard JSON Schema and SHA-256 content hash;
3. `APPROVED` agent lifecycle;
4. every requested tool to be declared by that agent;
5. valid, hash-valid, `APPROVED` tool records allowed for that stage; and
6. valid, hash-valid, `APPROVED` model and context-selection policies;
7. the exact current context-pack digest supplied by the deterministic selector.

The resulting manifest records exact ID, version, and content-hash references. `isExecutionManifestCurrent` fails when any current resource no longer matches or is no longer approved. Deprecated records remain visible as evidence but are ineligible for a new manifest.

## Local MCP slice

The optional repository-owned MCP server is under `tools/toy-repo-mcp/`. It uses the pinned official TypeScript MCP SDK over stdio. It can only receive a temporary copy of `fixtures/toy-repository/`, which carries an explicit synthetic marker. It makes no external network calls.

The protocol-discovered tools are:

- repository search over small allow-listed text fixtures;
- one realpath-checked bounded UTF-8 file read;
- exact single-occurrence patching under `src/**` only;
- a fixed read-only Git diff; and
- the fixed `node --test` validation command.

The host client treats discovered schemas and annotations as untrusted input. It validates each discovered schema, then checks the matching local descriptor, stage manifest, delegated persona scopes, path boundary, input schema, versioned policy, and exact bound approval. The server repeats the path and fixed-command boundary, but it does not replace host authorization.

Generate and verify sanitized evidence with:

```bash
npm run mcp:evidence:generate
npm run mcp:evidence:check
```

Outputs are `/capabilities/mcp/discovery.json` and `/capabilities/mcp/invocation-evidence.json`. They omit temporary paths, repository source bodies, diffs, command output, credentials, and timing claims. The generator closes the child process and removes the temporary repository in `finally` blocks.

## Public claim boundary

Functional in this repository:

- schema validation, canonical content hashing, lifecycle transitions, eligibility checks, manifest invalidation, public JSON generation, local stdio discovery, host-policy refusal, bounded toy-repository invocation, and process/workspace cleanup.

Still simulated or excluded:

- external enterprise MCP servers, remote repositories, Jira/GitHub writes, model providers, credentials, authenticated personas, remotely deployed agents, shared approval storage, hosted sandboxes, and production reliability.

The public files are **capability cards**, not A2A Agent Cards. No A2A conformance claim is made.
