# ADR: Focus the agent control plane on the coding-delivery workflow

- Status: Accepted for planned implementation
- Date: 2026-07-16
- Decision owners: repository maintainers

## Context

The clean-room prototype already contains eight ordered delivery stages, synthetic issues, stage status transitions, artifact generation, review gates, settings, mocked MCP tool boundaries, and evidence-like outputs. It demonstrates the shape of AI-assisted delivery but does not make the governing decision chain inspectable.

The portfolio thesis is that a credible coding-agent demonstration must show more than generated output. It should show which agent/tool versions were eligible, what context was selected, which actor and policy authorized each action, where human approval interrupted a risky call, which model/runtime and budgets applied, and how evidence connects the result back to those decisions.

A broad agent catalog, marketplace, or cloud administration product would obscure that thesis. The public project must remain static-host compatible, deterministic, low-complexity, honest about simulations, and free of real credentials or anonymous agent endpoints.

## Decision

Add a focused control plane inside the AI Delivery Workbench. It governs only the existing coding-delivery stages and their bounded tools. The control plane is a domain layer and evidence view for the workbench, not an independent product.

### User experience boundary

- Add one compact Control Plane destination for the stage-agent registry, lifecycle, persona policy, and pending local approvals.
- Put context manifests, runtime/model policy, budgets, traces, and evidence on the relevant issue/run detail path.
- Keep capability cards concise and stage-specific. Do not offer arbitrary uploads, public discovery, monetization, tenant administration, or unrelated fleet analytics.
- Preserve the existing visual identity and reuse its artifact/evidence vocabulary where that remains honest.

### Domain objects

The original domain model will include:

- `StageAgentVersion`: immutable stage binding, purpose, lifecycle, capability-card reference, version/digest, provenance, and supersession.
- `ToolVersion`: immutable tool contract, risk class, input/output references, boundary, approval rule, version/digest, and provenance.
- `CapabilityCard`: input/output, allowed/denied/gated tools, memory/context policy, model/runtime policy, budgets, approval requirements, and provenance.
- `PolicyDecision`: actor/persona, resource/action, effect, stable reason code, policy version, inputs digest, and timestamp.
- `ApprovalRequest` plus `ApprovalEvent`: risky call envelope and append-only lifecycle history.
- `ContextPackManifest`: included/excluded resources, provenance, freshness, redactions, canonical digest, and policy version.
- `RuntimeReceipt`: selected model alias/runtime class/credential reference, fallback decision, usage basis, and simulated/provider status.
- `BudgetLedger`: limits, consumption, measurement bases, and stop reason.
- `TraceRecord`: OpenTelemetry-compatible span hierarchy and project governance attributes.
- `EvidenceEnvelope`: source revision, tool/check identity, result status, digest, trace link, and artifact reference.

Exact field names and schemas will be designed and tested in this repository; they will not be copied from public projects.

### Registry lifecycle

Use these states:

```text
draft -> in_review -> approved -> deprecated
   |          |
   |          +-> rejected
   +-> disabled (emergency policy action from any eligible state)
```

- A version is immutable after submission; changes create a new version.
- Only `approved` versions are eligible for new runs.
- Deprecation prevents new selection but preserves historical resolution.
- Disabling prevents new runs immediately and records the policy decision without rewriting history.
- New external-write/privileged capability, wider context, or wider credential scope requires security review.

### Authorization and separation of duties

The public demo uses fictional personas and a functional local policy evaluator. It does not authenticate a real person.

- Builders can author registry drafts but cannot approve their own versions.
- Operators can initiate runs but cannot approve their own gated tool request.
- Control reviewers can approve ordinary capability/runtime changes they did not author.
- Security reviewers are required for privileged/external-write tools, credential-scope expansion, and security exceptions.
- Auditors are read-only.
- Deny is the default when no explicit action/resource grant matches.

Every decision records an inspectable reason code and the exact policy/version inputs. Persona switching remains clearly labeled as simulated identity.

### Human approval durability

Risky tool requests become immutable envelopes linked to exact agent/tool versions, redacted arguments, context digest, policy, trace, requester, risk reason, required approver persona, and expiry. State changes are append-only events: pending, approved, rejected, expired, cancelled, executed, or failed.

For the static public release, IndexedDB provides browser-local persistence across reloads. Export/import makes the journal portable and reset makes the demo recoverable. This is “durable in this browser profile,” not multi-user, authenticated, tamper-resistant, or production audit storage. A production implementation would require a transactional server-side event store and real identity; that adapter is not part of the public release.

### Context selection and provenance

Each stage assembles a deterministic context-pack manifest from synthetic resources. The manifest records revisions/digests, origin, retrieval and modification times, maximum age/freshness, trust classification, inclusion reasons, explicit exclusion reasons, and redactions. Canonical JSON is hashed with browser Web Crypto SHA-256. The digest is linked to the approval request, trace, and evidence.

Resource bodies and prompts are not recorded in telemetry by default. No feature accepts employer/client context or private files in the public release.

### Runtime/model and credential policy

Use provider-neutral model aliases and runtime classes. An agent version declares permitted aliases, fallback constraints, request limits, and an opaque credential-reference identifier scoped to that agent/capability. Local policy selection is functional; model output, provider exchange, and credential issuance are simulated.

No secret value is accepted, bundled, persisted, logged, or exported. A future real gateway must be authenticated, server-side, and backed by scoped/short-lived credentials. It is optional architecture, not a required public endpoint.

### Budgets and measurement truth

Enforce per-stage and per-run limits for tokens, calculated cost, iterations, tool calls, retries, and elapsed time before execution and after each iteration. Do not silently expand a limit.

Every value carries one of these bases: measured, provider-reported, calculated, estimated, simulated fixture, or not available. Local elapsed time/counters may be measured. Token usage is provider-reported only from a future trusted adapter; otherwise it is estimated with a named method or unavailable. Cost is calculated from a timestamped pricing fixture and always labeled estimated, never billed/actual/saved.

### Trace and evidence

Use parent/child spans for workflow, policy, context, agent/model, approval wait, tool execution, and evidence generation. Export a pinned OTLP/HTTP JSON-compatible document and applicable OpenTelemetry GenAI semantic-convention fields. Keep workbench governance attributes in a documented namespace. Capture metadata/digests rather than sensitive bodies.

Render the same data in an accessible waterfall with a tabular alternative. Historical fixture spans are simulated; only timings observed during the current local interaction are measured.

Supply-chain evidence covers secret scanning, SAST, dependency scanning/review, CycloneDX SBOM generation, and container scanning when a container exists. Results preserve pass/fail/threshold exception/unavailable/not-applicable distinctions. Because the initial static release produces no container, its container status is explicitly not applicable.

## Explicit exclusions for the initial public release

- A full AWS account deployment.
- Cognito, ECS, RDS, VPC, or PrivateLink infrastructure.
- A live anonymous agent endpoint.
- A full A2A network of independently deployed services.
- A general-purpose multi-tenant agent marketplace.
- Decorative admin analytics unrelated to the coding-agent workflow.

Also excluded are real enterprise identity, a shared audit database, live remote tool calls, live provider credentials, and claims of production reliability or measured external performance.

## Consequences

Positive:

- The demo proves governance decisions around a concrete coding workflow.
- Versioned manifests and pure policy/budget/context functions provide strong unit-test seams.
- Static hosting, deterministic behavior, and no-secret operation remain intact.
- Trace, context, approval, and supply-chain evidence give reviewers concrete artifacts rather than marketing assertions.

Costs and constraints:

- Browser-local durability is intentionally limited and needs prominent disclosure.
- A focused control-plane view adds information density that must be handled carefully for mobile and accessibility.
- OpenTelemetry GenAI conventions evolve; the adapter/version must be pinned and upgrade-tested.
- The demo can prove policy logic and evidence construction, not real authentication or integration security.

## Alternatives considered

1. **Generic agent marketplace/control product** — rejected because it dilutes the coding-agent thesis, adds tenancy/catalog complexity, and invites unsupported production claims.
2. **AWS-native reference deployment** — rejected for the initial release because it breaks the static/no-credential boundary and introduces cloud infrastructure unrelated to portfolio proof.
3. **Visual-only capability cards and approval fixtures** — rejected because they would not prove enforcement, durability across reloads, or inspectable decision reasons.
4. **Required backend for approvals and traces** — deferred because it adds deployment/secrets/operations complexity. The local event model and export contract preserve a credible upgrade path.
5. **Live browser-to-model gateway** — rejected because it would expose credentials or require an anonymous endpoint and undermine the public safety boundary.

## Revisit when

- A real authenticated deployment is separately authorized and can provide server-side secrets, identity, transactional storage, and audit retention.
- A concrete use case requires more than the fixed coding-delivery stages.
- OpenTelemetry GenAI conventions used by the adapter stabilize or materially change.
- The repository begins producing a container artifact, making container scanning mandatory rather than not applicable.
