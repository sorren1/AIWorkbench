# AI Delivery Workbench architecture

AI Delivery Workbench is a static portfolio case study plus a separate React demo. It demonstrates governance around an AI-assisted software-delivery workflow without requiring a backend, credentials, or live enterprise integrations.

## Delivery planes

- **Control Plane** — workflow state, versioned stage agents and tools, lifecycle, policy decisions, human gates, budgets, and evidence references.
- **Execution Plane** — simulated delivery-stage runs plus one optional bounded local MCP process operating on a disposable synthetic repository.
- **Context Plane** — synthetic issue, artifact, and toy-repository inputs with explicit source and memory boundaries.
- **Validation Plane** — changed-file inspection, acceptance evidence, local test evidence, review decisions, and release gates.

The browser application never contacts Jira, GitHub, an AI provider, a database, or an MCP server. The optional MCP process is started only by repository commands and is not part of ordinary static website browsing.

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

New execution is allowed only when all referenced records are schema-valid, hash-valid, and `APPROVED`. Changing declarative content or version returns the record to `DRAFT` and invalidates manifests with the old reference. `DEPRECATED` records remain inspectable for historical evidence but cannot be selected.

Public read-only cards live under `/capabilities/`. They are original workbench capability contracts. The project does not claim A2A compatibility.

## Local MCP adapter

The local adapter uses `@modelcontextprotocol/sdk` 1.29.0 and stdio. The client spawns the server with an absolute path to a fresh temporary copy of `fixtures/toy-repository/`. The server checks the fixture marker, resolves real paths to prevent symlink/path traversal and `.git` access, limits readable formats and file size, restricts writes to `src/**`, exposes no arbitrary command, and makes no network call.

Tool discovery is protocol-driven. The host validates discovered schemas but never treats discovery metadata as authorization. Before invocation it resolves an approved stage manifest, matches the discovered tool to an approved local descriptor, validates arguments and paths, and requires the declared approval policy. The server then enforces its own narrower execution boundary. Either layer can deny; discovery cannot widen authority.

The static website reads only sanitized generated snapshots. It never opens stdio, starts a process, or connects to localhost. This is evidence for one local adapter boundary, not a remotely deployed MCP platform.

## Static delivery boundary

Vite builds the root case study, technical article, demo entry, and 404 page as static assets. Root case-study content remains authored HTML and readable without React. React loads only for `/demo/`. Public capability JSON and MCP evidence are generated before commit and checked for drift during `npm run check`.

See `docs/agent-and-tool-registry.md` and `docs/adr/capability-card-schema-and-lifecycle.md` for contract, lifecycle, transport, and claim details.
