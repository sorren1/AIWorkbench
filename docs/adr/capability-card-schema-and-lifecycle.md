# ADR: Version capability cards and enforce local MCP tools through the host control plane

- Status: Accepted
- Date: 2026-07-16
- Decision owners: repository maintainers

## Context

The workbench needs to resolve each executable delivery stage to an exact agent definition, tool set, model policy, memory policy, and approval record. Display-only cards would not prove eligibility, version invalidation, or fail-closed behavior. The repository also needs one real local Model Context Protocol slice without creating a browser-accessible endpoint or implying that external enterprise integrations are functional.

The accepted control-plane scope remains stage-bound. It does not permit arbitrary agent uploads, remote deployment, tenant administration, or a general marketplace. The independent-development ADR prohibits copying project-specific schemas or UI from public projects.

## Decision

### Repository-owned capability-card contract

Define original strict TypeScript contracts and JSON Schema Draft 2020-12 schemas for `AgentCard`, `ToolDescriptor`, `ModelPolicy`, and `MemoryPolicy`. These are workbench domain contracts, not an A2A wire schema. Public files are called **capability cards**; the project makes no A2A compatibility claim.

Authored fixture sources are transformed into an immutable generated snapshot. Generation:

1. canonicalizes declarative content by recursively sorting object keys;
2. excludes lifecycle state, approval events, and record timestamps from the content digest;
3. computes a SHA-256 content hash over the remaining declarative fields, including ID, semantic version, policy references, boundaries, budgets, and source revision;
4. validates the complete record with its JSON Schema; and
5. fails without emitting an executable registry record if validation fails.

Excluding lifecycle metadata allows the same reviewed content to move from draft to approval without changing its identity. Changing versioned or declarative content produces a different hash, clears approval metadata, returns the resource to `DRAFT`, and invalidates manifests that refer to the prior version/hash.

### Lifecycle and selection

Use the lifecycle states required by the registry contract:

```text
DRAFT -> PENDING_APPROVAL -> APPROVED -> DEPRECATED
                         \-> REJECTED -> DRAFT
```

Only schema-valid, hash-valid `APPROVED` resources can resolve into a new execution manifest. `DEPRECATED` records remain readable in historical evidence but are not selectable. A manifest records exact ID, version, and content hash references. The previously planned emergency-disable behavior remains a future policy-layer decision rather than an undocumented sixth registry status.

The Review Assistant can summarize a diff, compare evidence, and flag risk. Its declared tools and capabilities cannot grant or record a human approval.

### Local MCP transport and trust boundary

Use the stable official TypeScript MCP SDK package `@modelcontextprotocol/sdk` version `1.29.0`. As of this decision, official SDK documentation identifies v1 as the recommended stable line while the split-package v2 line remains pre-release. Revisit the pin through a separate dependency/adapter change after v2 is stable.

Use stdio because the client owns and bounds the local child process. No port, HTTP listener, browser connection, authorization endpoint, or anonymous service is created. The process receives only:

- an absolute path to a disposable copy of the tracked synthetic toy repository; and
- a boolean indicating whether the already-evaluated host manifest granted the bounded-write policy.

The MCP server enforces its repository/path/file-size/fixed-command boundary, but its advertised annotations are not authorization. The trusted host client independently requires a matching schema-valid, hash-valid, approved local `ToolDescriptor`, stage permission, input schema, path boundary, and approval-policy grant before invoking a discovered tool. Discovery never expands authority. A tool discovered through MCP but absent from the approved stage manifest is refused before protocol invocation.

The website does not start the server. A repository script runs protocol discovery and a deterministic invocation sequence locally, sanitizes the results, and publishes read-only JSON evidence under `/capabilities/mcp/`. This proves one bounded local slice only; external enterprise MCP integrations remain simulated.

## Consequences

Positive:

- Every executable stage can identify the approved agent/tool/policy versions and content hashes used for selection.
- Invalid schemas, modified hashes, draft resources, deprecated resources, widened tool requests, and missing approvals fail closed.
- Public cards and MCP evidence are generated from the implementation rather than maintained as disconnected copy.
- Stdio keeps the real protocol slice local, optional, temporary, and unavailable to an anonymous browser.

Costs and constraints:

- Generated files must be refreshed with the committed scripts and are checked for drift in `npm run check`.
- The source-commit field anchors the authored registry fixture to the preceding reviewed repository revision because a committed file cannot contain the hash of the commit that contains itself.
- The local server proves discovery and bounded execution mechanics, not remote identity, durable audit storage, multi-user authorization, sandbox isolation, or production reliability.
- Git and Node.js are required for the disposable fixture harness; no container is produced.

## Alternatives considered

1. **Hand-authored public JSON cards** — rejected because hashes, schemas, and source fixtures could drift.
2. **Trust MCP discovery annotations as policy** — rejected because a discovered server must not grant itself authority.
3. **Browser-to-localhost HTTP MCP** — rejected because it creates a public-browser attack surface and an unnecessary live endpoint.
4. **Adopt the pre-release v2 SDK** — deferred because the official project still recommends the stable v1 line at this decision date.
5. **Claim A2A compatibility** — rejected because no A2A protocol adapter or conformance test is implemented.

## Revisit when

- the official MCP TypeScript v2 SDK is stable and its migration/security guidance is final;
- a separately authorized authenticated deployment can provide real identity, secrets, sandbox isolation, and durable audit storage; or
- the project implements and tests an actual A2A protocol boundary.
