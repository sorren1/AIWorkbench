# AI Delivery Workbench architecture

## Purpose and boundary

AI Delivery Workbench is a static public case study and a separate React demo for a governed coding-agent delivery workflow. It demonstrates how a controller can select versioned capabilities, assemble bounded context, require human decisions, enforce execution budgets, and bind validation to evidence. It is not a hosted agent or execution service.

The browser never contacts Jira, GitHub, a model provider, a database, Docker, E2B, LiteLLM, an MCP server, or localhost. External behavior shown in the browser is synthetic. Real file modification and command execution happen only after a developer explicitly runs the fixed local CLI against `examples/toy-repo`.

```text
Static visitor
  ├─ /                         semantic case study, no application JavaScript
  ├─ /writing/...              semantic technical article
  └─ /demo/                    lazy React workbench with synthetic local state

Developer-only local boundary
  ├─ registry/context generators
  ├─ approval and model-gateway CLIs
  └─ controlled sandbox runner ──> disposable toy-repository copy ──> evidence/trace
```

## Four-plane model

The planes separate policy decisions from effects and make evidence ownership explicit. They are logical boundaries in one repository, not claims of independently deployed services.

| Plane                | Owns                                                                                                               | Receives                                                              | Emits                                                                         | Must not do                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Control Plane**    | Stage state, versioned agent/tool registry, personas/scopes, policy evaluation, approvals, budgets, lifecycle      | Synthetic issue, requested transition, capability/policy versions     | Approved stage manifest, decision records, stale markers, budget action       | Execute arbitrary commands or treat discovery as authorization                                   |
| **Context Plane**    | Versioned context records, deterministic selection, sensitivity/stage/persona rules, freshness, exclusions, digest | Issue/stage scope, approved agent and memory policy                   | Inspectable context pack plus digest                                          | Claim semantic retrieval, retain arbitrary prompt history, or include unauthorized/stale records |
| **Execution Plane**  | Typed provider adapters, exact tool invocation, disposable workspace, bounded command execution                    | Approved manifest, context digest, checked-in fixture and targets     | Tool/command receipts, changed-file list, diff, file hashes                   | Broaden paths/commands, accept visitor input, or self-authorize                                  |
| **Validation Plane** | Pre/post checks, diff review state, acceptance evidence, trace/evidence normalization, release guards              | Execution receipts, tested tree, approvals, policy/context references | Validation outcome, normalized trace, hash-bound evidence, readiness decision | Let the generator approve its own output or detach evidence from the tested tree                 |

See [ADR: four-plane architecture](docs/adr/four-plane-architecture.md).

## Governed delivery workflow

The interactive workflow is:

`Seed → Intake → Spec → Plan → Change Targets → Implement → Verify → PR Review`

Each stage has typed inputs and artifacts. Pure transition guards determine whether the next stage can begin. Redoing an upstream stage marks dependent outputs stale: redoing Plan invalidates Change Targets, Implement, Verify, and Review where those outputs exist. Failed Verify blocks pull-request and validation readiness. Validation approval requires reviewed diffs and all required checks; release readiness additionally requires complete validation evidence.

The reducer is the browser demo’s authority for local state. Deep links select a screen, synthetic issue, artifact, or subview, but invalid URL state is rejected and normalized rather than injected into the reducer.

## Registry, authorization, and approval

Seven versioned `AgentCard` records cover Intake through PR Review; Seed remains a human-selected input. Each card references versioned tools, model policy, memory policy, budgets, lifecycle, provenance, and a content hash. A capability is eligible only when its schema and hash validate and its lifecycle is `APPROVED`.

Authorization is an intersection, not a union:

```text
persona scopes
  ∩ delegation envelope
  ∩ stage policy
  ∩ agent-card grants
  ∩ tool descriptor scopes and resource boundaries
  = effective authority
```

Explicit deny wins. Missing policy fails closed. Risky calls create a request bound to canonical arguments, agent/tool versions and hashes, change-target digest, context-pack digest, requester, expiry, and separation-of-duties policy. Approval never mutates the tool descriptor or expands the request. Resume revalidates every binding before a single-use decision can be consumed.

The browser journal is versioned local storage and is labeled synthetic/local. The CLI journal is gitignored under `.workbench/runs/`. Neither is production identity, append-only shared storage, or tamper-resistant audit evidence. See [ADR: human approval boundaries](docs/adr/human-approval-boundaries.md).

## Context packs

The Context Plane uses deterministic selection over checked-in public/synthetic records. Selection considers record state, sensitivity, allowed stage/persona/agent, tags, scope, freshness/TTL, priority, recency, episodic-memory permission, and token/character budget. Included and excluded candidates both retain a reason. Stable ordering and canonical serialization produce a SHA-256 pack digest.

Artifacts, approvals, stage manifests, traces, and sandbox evidence bind to that digest. A selected-record or memory-policy change produces a different pack and marks dependent stage output stale. Resume/replay rejects a mismatch unless the caller creates a new run. Semantic/vector retrieval is only a future adapter; the current repository makes no semantic-retrieval claim.

## Local execution and evidence

`npm run demo:sandbox` performs a fixed failing-before/passing-after flow:

1. create a temporary workspace and copy the original synthetic toy repository;
2. validate the synthetic issue, approved targets, registry references, context pack, and budget;
3. inspect Git state and prove the pre-patch test fails for the intended reason;
4. apply one repository-owned replacement to `src/report.js` after traversal, real-path, symlink, and allow-list checks;
5. reject unexpected changes;
6. run fixed build/test commands in fresh network-disabled, non-root, read-only Docker containers with CPU, memory, PID, output, and timeout limits;
7. normalize file hashes, diff, command results, tool/image versions, budget/accounting, trace, cleanup, and final status into JSON and Markdown evidence.

Cleanup runs in `finally`. The provider contract also has an explicit E2B implementation, but no credential was available for this revision, so it is implemented but not live-validated and contributes no checked-in cloud-run evidence.

Evidence schema v3 binds the source commit/tree, tested tree, changed files, context, approved agent/tool/policy, execution budget, trace ID/hash, command receipts, and evidence digest. Hashes detect modification but are not signatures, attestations, or trusted timestamps. The checked-in public snapshot is a recording; Vite validates and renders it but cannot invoke the runner. See [ADR: static site and local execution](docs/adr/static-public-site-and-local-execution.md).

## Tracing, budgets, and models

The local controller emits nested OpenTelemetry spans for run, stage, agent, tool, approval, sandbox, validation, and evidence operations. Allow-listed attributes include safe identifiers, policy versions/hashes, context digest, attempt counts, duration, and outcome; prompts, code, arguments, credentials, source content, and raw exception bodies are excluded.

Execution budgets cover wall-clock and stage duration, tool calls, repair attempts, and optional token/cost ceilings with `WARN`, `STOP_STAGE`, or `STOP_RUN` actions. The deterministic sandbox invokes no model, so its exact model usage and cost are zero. Estimated and provider-returned accounting are distinct types.

The default `ModelGateway` is deterministic and offline. An optional loopback LiteLLM profile can vend and revoke a model-limited, budget-limited per-agent/run key. It is never available to browser code. No live provider credential was available in this revision; configured fallback or independent-review policies are not described as exercised without corresponding model spans.

## Static delivery

Vite creates a multi-page static build: root case-study HTML and the article retain their substantive content without JavaScript; React is bundled only for `/demo/`. Build-time generation injects optional configured links and metadata, synchronized code excerpts, the latest validated evidence, `robots.txt`, `sitemap.xml`, and static-host header manifests. Assets are local and the CSP does not require `unsafe-eval` or external runtime origins.

Vercel is the selected Git-backed static host. The immutable v1.0.7 evidence commit has a verified Preview, while v1.0.8 is a separate source candidate and `<PRODUCTION_ORIGIN>` is the intended stable Production origin. Preview builds omit canonical-dependent output. Production builds accept the origin only through validated `SITE_CANONICAL_URL`, which drives HTML metadata, robots/sitemap output, and RFC 9116 canonical identity. Generated release summaries and deployment bindings—not a mutable architecture status sentence—prove the exact source/evidence/tag/deployment relation. No v1.0.8 Production result is claimed here. See [ADR: static hosting](docs/adr/static-hosting-and-security-headers.md) and [deployment verification](docs/deployment-verification.md).

## Deliberate non-goals and tradeoffs

- No full AWS account, Cognito, ECS, RDS, VPC, or PrivateLink deployment.
- No anonymous agent endpoint or arbitrary repository/patch/command input.
- No general multi-tenant marketplace or full A2A service network.
- No decorative fleet analytics unrelated to the coding-delivery path.
- No claim that browser-local approvals or containers alone satisfy enterprise isolation.
- No backend merely to make the portfolio demo look more production-like.

The static split minimizes public attack surface and runtime weight, but it means public evidence is recorded rather than live. Deterministic fixtures improve reproducibility, but they do not estimate real-world agent quality. Logical planes make ownership inspectable without paying the operational complexity of separate services in a portfolio prototype.

## Detailed records

- [Decision log](docs/decision-log.md)
- [Agent and tool registry](docs/agent-and-tool-registry.md)
- [Authorization and separation of duties](docs/authorization-and-separation-of-duties.md)
- [Context and memory governance](docs/context-pack-and-memory-governance.md)
- [Sandbox security model](docs/sandbox-security-model.md)
- [Observability and budgeting](docs/observability-and-budgeting.md)
- [Model gateway and routing](docs/model-gateway-and-routing.md)
- [Threat model](THREAT_MODEL.md)
