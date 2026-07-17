# AI Delivery Workbench architecture

AI Delivery Workbench is a static portfolio case study plus a separate React demo. It demonstrates governance around an AI-assisted software-delivery workflow without requiring a backend, credentials, or live enterprise integrations.

## Delivery planes

- **Control Plane** — workflow state, versioned stage agents and tools, lifecycle, policy decisions, human gates, budgets, and evidence references.
- **Execution Plane** — simulated delivery-stage runs, one optional bounded local MCP process, and one explicit developer-invoked validation slice operating only on a disposable synthetic repository. Local Docker is the default; an optional E2B provider is available only by CLI flag and is implemented but not live-validated in this revision.
- **Context Plane** — synthetic issue, artifact, and toy-repository inputs with explicit source and memory boundaries.
- **Validation Plane** — changed-file inspection, acceptance evidence, local test evidence, OpenTelemetry-compatible run traces, explicit execution budgets, review decisions, and release gates.

The browser application never contacts Jira, GitHub, an AI provider, a database, an MCP server, Docker, E2B, or localhost. Local MCP and sandbox processes are started only by explicit repository commands and are not part of ordinary static website browsing.

## Versioned agent and tool registry

The registry is the stage-resolution boundary between the Control Plane and Execution Plane.

```text
authored typed fixtures
  -> canonical declarative content
  -> SHA-256 digest
  -> JSON Schema validation
  -> generated registry snapshot
  -> approved stage manifest
  -> tool invocation policy
  -> evidence with exact version/hash references
```

Seven AgentCards map to Intake, Spec, Plan, Change Targets, Implement, Verify, and PR Review. Seed is a human-selected workflow input rather than an executable agent. Every card declares capabilities, skills, schema references, allowed tools and write paths, model/memory policies, approval policies, duration/tool/repair limits, optional estimated token/cost ceilings, source revision, timestamps, lifecycle, approval metadata, and a SHA-256 content hash.

Tool descriptors declare actual input/output JSON Schemas, side effects, scopes, stage allow-lists, timeouts, idempotency, network requirements, filesystem boundaries, approval policies, implementation references, lifecycle, and hashes. Model and memory records make runtime and context constraints independently versionable.

Approval policies are independently versioned and content-hashed. The generated snapshot includes tool/stage/risk/agent/path matchers, allow/notify/approval/deny modes, approver scopes/personas, expiry/cache rules, separation-of-duties controls, and provenance.

New execution is allowed only when all referenced records are schema-valid, hash-valid, and `APPROVED`. Changing declarative content or version returns the record to `DRAFT` and invalidates manifests with the old reference. `DEPRECATED` records remain inspectable for historical evidence but cannot be selected.

Public read-only cards live under `/capabilities/`. They are original workbench capability contracts. The project does not claim A2A compatibility.

## Scoped authorization and durable approvals

The browser and local CLI import the same pure authorization evaluator. Effective scopes are the intersection of the initiating synthetic persona, delegated envelope, stage policy, approved agent card, approved tool descriptor, and resource/write boundaries. Deny takes precedence and no policy match fails closed.

Risky actions produce a request bound to canonical argument, agent, tool, change-target, and context-pack hashes. Append-only hash-chained events are materialized into pending, approved, rejected, expired, or invalidated state. Browser state uses a disclosed versioned local store; CLI state uses `.workbench/runs/`. Resume revalidates every binding before the MCP host invokes a tool.

## Local MCP adapter

The local adapter uses `@modelcontextprotocol/sdk` 1.29.0 and stdio. The client spawns the server with an absolute path to a fresh temporary copy of `fixtures/toy-repository/`. The server checks the fixture marker, resolves real paths to prevent symlink/path traversal and `.git` access, limits readable formats and file size, restricts writes to `src/**`, exposes no arbitrary command, and makes no network call.

Tool discovery is protocol-driven. The host validates discovered schemas but never treats discovery metadata as authorization. Before invocation it resolves an approved stage manifest, matches the discovered tool to an approved local descriptor, validates arguments and paths, evaluates scoped policy, and revalidates any required bound approval. The server then enforces its own narrower execution boundary. Either layer can deny; discovery cannot widen authority.

The static website reads only sanitized generated snapshots. It never opens stdio, starts a process, or connects to localhost. This is evidence for one local adapter boundary, not a remotely deployed MCP platform.

## Static delivery boundary

Vite builds the root case study, technical article, demo entry, and 404 page as static assets. Root case-study content remains authored HTML and readable without React. React loads only for `/demo/`. Public capability JSON and MCP evidence are generated before commit and checked for drift during `npm run check`.

The local Docker slice applies one deterministic host-side patch to an exact allow-listed path in a temporary copy, then runs fixed build/test commands in fresh network-disabled, non-root, read-only containers with CPU, memory, process, and timeout limits. It records hashes, diff, output, durations, tool/image versions, cleanup, registry/context references, and final status. OpenTelemetry JavaScript spans capture the run/stage/agent/tool/approval/sandbox/validation/evidence hierarchy into a local normalized JSON trace. Evidence schema v3 binds that trace to source, tested-tree, context, agent, approval-policy, budget-policy, and evidence hashes. Vite validates and renders only the latest checked-in successful evidence; it cannot invoke the runner. See `docs/sandbox-security-model.md` and `docs/observability-and-budgeting.md`.

The same typed provider contract has an explicit `--provider e2b` implementation using the pinned official E2B SDK. It uploads only the synthetic repository snapshot and approved artifacts, requests deny-all egress, requires a blocked outbound probe, records provider-specific metadata in evidence schema v3, and uses `finally` cleanup plus a two-minute provider lifecycle. Because no `E2B_API_KEY` was available for this revision, it is implemented but not live-validated and contributes no checked-in run evidence.

See `docs/agent-and-tool-registry.md`, `docs/authorization-and-separation-of-duties.md`, `docs/human-approval-protocol.md`, and `docs/threat-model.md` for contract, lifecycle, transport, threat, and claim details.
