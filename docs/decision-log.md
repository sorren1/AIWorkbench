# Decision log

## 2026-07-18 — Treat checked pull requests as the approval boundary for sanitized-history releases

- **Decision:** Keep the account-specific GitHub noreply address as the only permitted public author, committer, and annotated-tag address. For a sanitized-history release, run every required check on an up-to-date pull request, reproduce the reviewed linear commit locally with the identical parent and tree, and use a named maintainer ruleset bypass only for the guarded `--force-with-lease` ref correction. Remove and verify the bypass immediately, then require fresh Quality and CodeQL success on the exact corrected commit before evidence generation, tagging, or deployment.
- **Why:** GitHub assigns `noreply@github.com` as the committer of a web-created squash merge. Accepting that additional identity would violate the deliberately narrow public-history policy even though the reviewed source tree is unchanged.
- **Boundary:** This is not a standing administrator bypass and does not waive pull-request review, required checks, dependency review, CodeQL, linear history, or immutable-tag controls. The final ruleset has no bypass actors; any ref correction must name the expected old SHA, be followed by a fresh all-ref history and Gitleaks audit, and remain blocked from production until the replacement commit's hosted checks pass.

## 2026-07-18 — Audit the public PR head, not GitHub's ephemeral merge commit

- **Decision:** Quality-workflow jobs explicitly check out the pull request's head SHA. Push and manual runs continue to check out `github.sha`; CodeQL and dependency review retain their native pull-request context.
- **Why:** GitHub creates an ephemeral test-merge commit for `pull_request` workflows using a GitHub-controlled identity. That commit cannot enter the public graph, but including it in `git log --all` makes the public-history identity gate fail even when every branch and tag is sanitized.
- **Boundary:** The active ruleset still requires the pull request to be up to date with `main`, uses linear squash merges, and requires quality, CodeQL, dependency review, and code-scanning results. The public-history gate remains unchanged and still rejects any unexpected identity in the actual PR head or repository refs.

## 2026-07-18 — Keep performance policy valid across the evidence-only child

- **Decision:** Record deterministic bundle measurements on the audited source commit. On its direct evidence child, continue enforcing every gzip, script-count, and external-request budget, but permit the expected HTML measurement difference only after the release-evidence validator proves the commit changes only `public/security/release-summary.json` and binds to its direct parent.
- **Why:** The public case study renders the generated summary. Requiring its HTML bytes to equal a parent that intentionally has no summary makes a valid evidence-only commit fail by construction; recording the changed measurement in the child would violate the one-file evidence boundary.
- **Boundary:** This exception does not relax a performance ceiling or cover JavaScript, CSS, source, or any other path. An unreachable/mismatched parent, nonzero CodeQL result, or second changed path remains release-blocking. The evidence pull request may run before tag creation, but the separate deployment gate still requires an annotated release tag pointing to the final evidence commit.

## 2026-07-18 — Separate audited source, release evidence, and deployment identity

- **Decision:** Audit a clean code commit with no public release summary, then create one direct evidence child whose sole changed path is `public/security/release-summary.json`. Put the annotated public release tag on that evidence child.
- **Why:** A commit cannot truthfully include its own SHA. Binding the generated summary to its reachable parent removes the previous amended/unreachable-commit failure mode while keeping the evidence diff independently reviewable.
- **Deployment boundary:** Vercel must expose `VERCEL_GIT_COMMIT_SHA` and it must equal a separately supplied `APPROVED_DEPLOYMENT_COMMIT_SHA`. The static build publishes the full deployment/audit relation in `security/deployment-binding.json`; it refuses an absent or mismatched binding.
- **Hosted analysis boundary:** CodeQL must run against the audited parent. While the repository remains private without GitHub Advanced Security, the hosted action gates and retains SARIF without claiming GitHub code-scanning ingestion.

## 2026-07-17 — Pause Dependabot version PRs during sanitized-history publication

- **Decision:** Retain the npm and GitHub Actions Dependabot configuration but set both `open-pull-requests-limit` values to zero during publication.
- **Why:** GitHub creates permanent pull refs for Dependabot PRs. Those bot-authored commits would make the exact noreply-identity acceptance gate fail even after the temporary branch was deleted.
- **Follow-up:** Re-enabling version updates requires an explicit expansion of the allowed-identity policy and a new fresh-mirror audit. Dependency review, npm audit, Gitleaks, SBOM, image scanning, pinned-action review, and CodeQL remain active release gates.

## 2026-07-17 — Make public-history privacy and provenance reachability release gates

- **Decision:** Add a deterministic history gate that requires the intended GitHub noreply identity for every reachable commit and annotated tag, rejects the retired organization token across all reachable refs, and verifies generated source-commit provenance resolves within the rewritten graph.
- **Why:** A working-tree secret scan cannot prove that rewritten public history, tags, or generated provenance are safe after commit hashes change.
- **Boundary:** The private pre-public `git bundle --all` archive remains outside the repository and is never referenced or copied into public history.

This file records durable architecture and product-boundary decisions. Add a new numbered entry when a decision materially changes build, hosting, runtime, data boundaries, disclosures, or contributor workflow.

## ADR-001 — Use a static multi-page Vite build with React isolated to the demo

- Status: Accepted
- Date: 2026-07-16
- Decision owners: repository maintainers

### Context

The baseline is a React prototype loaded through development UMD builds and browser-side Babel. The public project needs a statically renderable case-study page, a separate interactive demo route, strict TypeScript, conventional imports, a production build, and compatibility with a static Git-backed host. It should not add a backend or replace the established visual identity.

The case study must remain readable and indexable without JavaScript. The workbench already benefits from React’s component/state model and should be preserved rather than rewritten into a different UI framework.

### Decision

Use Vite as a multi-page static build with two HTML entries:

- `index.html` is the public case study. Its substantive content is semantic HTML present at build time. CSS provides the core presentation; a small TypeScript module may progressively enhance theme or navigation.
- `demo/index.html` mounts the migrated strict-TypeScript React workbench at `/demo/`.

Use conventional ES modules, typed fixtures, a typed reducer, shared local CSS tokens, and local assets. Configure asset paths for a repository subpath/static host. Do not add a server or a client-side router dependency unless a later requirement proves reducer-based demo routing insufficient.

### Consequences

Positive:

- The public narrative has zero React runtime cost and remains readable with scripts disabled.
- React and its bundle are paid only by visitors who open the demo.
- Two physical HTML entries make static-host direct navigation predictable.
- Vite supplies a standard development server and optimized production build with relatively little configuration.
- The existing workbench component/state model can migrate incrementally.

Costs and constraints:

- Shared copy between static HTML and typed demo code can drift. Canonical disclosures will live in a small shared source where feasible, with tests/content scans for the required wording.
- Static HTML editing is less componentized than an SSG, but the case study is intentionally one page and does not justify a content framework yet.
- Host subpath behavior must be verified from the built output, not only the dev server.
- Vite does not create accessibility, SEO, or security guarantees; those remain explicit implementation and test work.

### Alternatives considered

1. Single React SPA for case study and demo — rejected because it makes the public narrative client-rendered, increases root-route runtime weight, and weakens progressive enhancement.
2. Astro with a React island — viable, but rejected for now because one static case-study page does not justify an additional framework and integration layer.
3. Pure HTML/CSS/JavaScript rewrite of the workbench — rejected because it discards a suitable React component/state model and adds migration risk without a user benefit.
4. Next.js or another server-capable framework — rejected because no backend, server rendering, or dynamic content is required and static hosting is a hard constraint.

### Revisit when

- The public site grows into several content-heavy pages that need shared layouts/content collections.
- Demo screens need durable, shareable per-screen URLs beyond the `/demo/` route.
- The selected static host imposes asset or fallback constraints that Vite MPA cannot satisfy cleanly.

## ADR-002 — Keep all external integrations simulated and make only local browser utilities functional

- Status: Accepted for the planned implementation
- Date: 2026-07-16

### Context

The public demo has no credentials or backend and must not imply real Jira, GitHub, AI, Oracle, MCP, test, review, deployment, or production operations. Some current controls are local no-ops presented as copy/download actions.

### Decision

Keep all enterprise/external operations deterministic simulations. Make only bounded browser-local utilities functional where they improve credibility without a backend: filtering, navigation, theme preference, state-machine interactions, copying artifact text, downloading a generated local artifact, and resetting demo state.

Every external-system action and result will carry adjacent “Simulated” labeling. Functional local actions will carry “Functional locally” labeling in explanatory content where the distinction matters. No demo interaction will perform a network write.

### Consequences

- The project can be hosted as static files with no secrets or service dependencies.
- Reviewers can exercise meaningful UI behavior without confusing it for integration evidence.
- Production architecture remains illustrative; it cannot be described as implemented infrastructure.
- Canned metrics/durations must be removed or clearly labeled as fixture data rather than observed performance.

## ADR-003 — Add a stage-bound agent control plane, not a general agent platform

- Status: Accepted for the planned implementation
- Date: 2026-07-16
- Detailed record: [`docs/adr/agent-control-plane-scope.md`](adr/agent-control-plane-scope.md)

### Context

The baseline already models eight coding-delivery stages, deterministic agent-like execution, mocked tool boundaries, governance settings, review gates, and evidence artifacts. It does not yet prove which version was authorized, what context was selected, why a tool was allowed, who approved a risky action, which runtime/budget policy applied, or how a result can be traced.

Expanding into a generic agent catalog, multi-tenant marketplace, or cloud control product would dilute the coding-agent case study and conflict with static-host and honest-demo constraints.

### Decision

Add a focused control plane that governs only the workbench's stage agents and tools. It will provide versioned registry manifests, capability cards, lifecycle approval, persona-scoped policy, browser-local durable approval events, context-pack digests, budget enforcement, OpenTelemetry-compatible traces, a provider-neutral gateway contract, and supply-chain evidence.

The local policy and evidence mechanics may be functional. Identity, provider calls, remote tools, credentials, and enterprise durability remain simulated or architectural and are labeled at the point of use. The public release keeps one compact control-plane surface and contextual run evidence; it does not become a stand-alone agent-management product.

### Consequences

- The portfolio demonstrates governance around a recognizable coding workflow instead of adding unrelated feature breadth.
- Static hosting remains viable, but browser-local approval persistence must not be described as shared, authenticated, or tamper-proof.
- Production adapters for identity, secrets, transactional storage, telemetry collection, and model/tool execution remain explicit future work.
- Registry, policy, approval, context, budget, and trace behavior become testable domain seams rather than presentation-only fixtures.

## ADR-004 — Use public patterns and open standards through documented independent implementation

- Status: Accepted
- Date: 2026-07-16
- Detailed record: [`docs/adr/public-inspiration-and-independent-implementation.md`](adr/public-inspiration-and-independent-implementation.md)
- Influence register: [`docs/design-influences.md`](design-influences.md)

### Context

Public documentation for AWS Labs Loom describes useful enterprise-agent control concepts. OpenTelemetry, Model Context Protocol, and CycloneDX provide relevant vendor-neutral interoperability concepts. The repository must remain original and must not adopt Loom implementation source, copy, schemas, screenshots, components, or AWS-specific product UI. The existing clean-room boundary against non-public third-party material remains unchanged.

### Decision

Use public project documentation and standards only to identify high-level problems and interoperability targets. Record each consulted influence, the concept considered, the independently designed result, and what was deliberately not adopted. Do not copy third-party source, UI assets, copy, or project-specific schemas. Pin evolving standards at implementation time, isolate their adapters, and write the workbench domain model and UI from first principles.

### Consequences

- Reviewers can audit provenance and understand where industry conventions end and original design begins.
- Public references are context, not endorsements, dependencies, or evidence that this project implements their deployment architecture.
- Any future reference that materially affects design must be added to the influence register before related implementation lands.

## ADR-005 — Separate public positioning into three evidence categories

- Status: Accepted
- Date: 2026-07-16

### Context

The production foundation preserved useful workflow specificity but inherited one-off submission framing, an author-like fixture persona, and production-shaped fixture values. A durable public case study needs to lead with its engineering thesis while making provenance easy to inspect and impossible to confuse with prototype outcomes.

### Decision

Use the product name `AI Delivery Workbench` and the subtitle “A governed, human-in-the-loop control plane for AI-assisted software delivery.” Organize public claims into exactly three categories:

1. functional behavior that can be run in this repository;
2. deterministic synthetic demo fixtures;
3. the single approved professional-context statement, visually and semantically separated from prototype evidence.

Keep a concise persistent prototype badge, one detailed About/clean-room explanation, and repository-level provenance documentation. Label personas and production-shaped records at the persistent-shell or section level rather than repeating defensive prose on every component. Treat Jira, GitHub, Angular, .NET, and Oracle as one illustrative adapter set behind vendor-neutral boundaries.

### Consequences

- The homepage can sell the authorization, context, approval, and evidence thesis before explaining limitations.
- Metrics cannot move between categories: synthetic test counts are not repository measurements, and professional outcomes are not prototype outcomes.
- New fixtures require synthetic context; new functional claims require runnable evidence; new professional claims are prohibited unless the operating rules change explicitly.
- The public copy remains concise while the detailed development boundary stays auditable in `docs/clean-room-and-provenance.md` and `docs/semantic-distance-review.md`.

## ADR-006 — Generate public metadata and source evidence at build time

- Status: Accepted
- Date: 2026-07-16

### Context

The public case study needs configuration-driven outbound links, canonical-aware discovery files, social and structured metadata, and implementation excerpts that cannot silently drift from the real TypeScript source. Adding a client-rendered site shell or a full static-site framework would weaken the accepted no-JavaScript content boundary and add complexity disproportionate to three static public entries.

### Decision

Keep the case study, technical article, and 404 content as authored semantic HTML. Use a small local Vite build plugin to inject only build-time concerns: optional public links from `src/site/config.ts`, page metadata, JSON-LD, synchronized marker-bounded source excerpts, `robots.txt`, and `sitemap.xml`. Keep React and the full demo bundle isolated to `/demo/`.

Null public configuration values are omission instructions. The build does not render dead contact, résumé, author, or canonical values, and it does not invent a deployment URL. The known repository remote may drive source links. A canonical public URL must be supplied only after the deployment target is known; until then the sitemap remains a valid empty URL set and canonical-dependent tags are omitted.

### Consequences

- Searchable case-study and article content remains available without a client JavaScript bundle.
- The build fails if a documented implementation excerpt loses its source marker.
- Social image and sitemap URLs become absolute automatically once a canonical URL is configured.
- Public identity and contact details have one typed configuration boundary rather than component-level literals.
- The custom generator is intentionally small; a larger content surface would justify revisiting an established static-site generator.

## ADR-007 — Prefer native interaction semantics and a deliberate narrow-screen demo boundary

- Status: Accepted
- Date: 2026-07-16

### Context

The migrated workbench retained several prototype interaction patterns: clickable containers and rows, custom switches and checks, incomplete tabs, and overlays without focus containment. Its desktop shell also depended on a wide viewport. These patterns obscured keyboard affordances, produced inconsistent accessible names and states, and allowed content loss at narrow widths and high zoom.

### Decision

Use native buttons, links, checkboxes, switches, labels, table controls, and disclosure buttons wherever HTML already provides the required behavior. Reserve ARIA composite patterns for true tabs and modal/drawer dialogs. Dialog surfaces move focus inside, contain keyboard focus, close on Escape, make the application shell inert, and restore focus to their trigger. Status toasts use a non-blocking polite live region.

Keep the full workbench as a desktop-optimized application at 901 CSS pixels and wider. Below that boundary, replace the dense application shell with a semantic, keyboard-usable overview that explains the constraint and links back to the responsive case study; do not render an unusable horizontally scrolling facsimile. Public case-study routes remain fully responsive.

Use opaque semantic color tokens, explicit focus rings, and reduced-motion overrides across both themes. Treat Chromium Playwright tests with axe as a committed quality gate covering representative public and demo routes, keyboard paths, overlays, exact target widths, and a 200%-zoom-equivalent viewport.

### Consequences

- Interactive state and accessible names are exposed through platform semantics with less custom event code.
- Queue rows keep visual hover affordance while a predictable issue action in the first cell becomes the only navigation control.
- The demo remains coherent on phones and at high zoom without pretending the dense workbench is a mobile product.
- Automated Chromium and axe coverage is reproducible but does not replace release-phase testing with screen readers, multiple browser engines, or operating-system forced-color modes.

## ADR-008 — Keep functional demo state ephemeral and exports browser-local

- Status: Accepted
- Date: 2026-07-16

### Context

The public demo needs credible local interactions without a backend or credentials. Toast-only copy/download controls, non-shareable reducer routes, unversioned preferences, and ambiguous provider-shaped labels weaken that boundary. Persisting synthetic review or approval state could also mislead a returning visitor into reading browser history as durable enterprise evidence.

### Decision

Implement safe utilities with browser platform APIs: Clipboard for artifact text and Blob/Object URL downloads for artifacts, architecture summaries, and synthetic validation evidence. All exported documents carry an explicit synthetic/public classification and deterministic content; no export includes credentials, private data, or live provider results.

Encode only validated public fixture selections in URL parameters: major screen, known synthetic issue, known selected artifact, Settings subview, and named scenario seed. Scenario loading and confirmed reset always rebuild from the same typed baseline and cancel pending simulated transitions. Keep workflow, review, validation, scenario, note, and approval state in memory only. Persist only a versioned light/dark theme preference, with reset support.

Use a persistent `Demo mode · Synthetic data · No external writes` indicator. External-system actions remain deterministic simulations and say so at the action or immediate context; browser-local decisions use `demo`, `synthetic`, or `locally` where a production-shaped verb might otherwise be ambiguous. ADR-010 supersedes the approval-specific part of this decision by introducing a separate, explicitly disclosed versioned approval store while ordinary workflow state stays ephemeral.

### Consequences

- Reloading a deep link restores navigation context but intentionally does not restore prior mutable demo decisions.
- Clipboard access can be rejected by browser policy; the UI reports that failure instead of claiming success.
- Downloads work entirely in the visitor's browser and require no backend, temporary server storage, or analytics call.
- URLs remain safe to share because only allow-listed route and synthetic fixture identifiers are serialized.
- A future durable approval journal must introduce its own clearly labeled storage and identity model; it cannot silently reuse this ephemeral demo state.

## ADR-009 — Generate versioned capability cards and keep MCP authorization in the local host

- Status: Accepted
- Date: 2026-07-16
- Detailed record: [`docs/adr/capability-card-schema-and-lifecycle.md`](adr/capability-card-schema-and-lifecycle.md)

### Context

The stage-bound control plane needs executable, inspectable definitions rather than UI-only agent cards. The project also needs one real MCP slice without exposing a browser endpoint, widening the static-host boundary, or implying that external enterprise MCP integrations are functional.

### Decision

Independently define strict TypeScript and JSON Schema contracts for stage AgentCards, tools, model policies, and memory policies. Generate schema-valid public capability cards with canonical SHA-256 content hashes. Resolve new stage manifests only from exact schema-valid, hash-valid `APPROVED` versions; revisions return to `DRAFT`, and `DEPRECATED` resources remain historical only.

Pin the recommended stable official TypeScript MCP SDK v1.29.0 and use stdio for one repository-owned server against a disposable synthetic toy repository. Tool schemas are discovered through MCP. The trusted local client matches discovery to the approved registry/stage manifest, validates inputs and paths, and requires the declared approval policy before invocation. The public browser reads sanitized static evidence only and never starts or connects to the process.

### Consequences

- Exact versions, content hashes, policy references, schemas, boundaries, and budgets are inspectable for every executable stage.
- Discovery cannot grant authority; an unapproved discovered tool is refused locally.
- Public files are called capability cards and make no A2A compatibility claim.
- The local slice demonstrates bounded protocol mechanics, not remote identity, multi-user durability, hosted sandboxing, or production MCP-platform readiness.

## ADR-010 — Share one scoped policy and hash-bound approval protocol across browser and CLI

- Status: Accepted
- Date: 2026-07-17
- Detailed records: [`docs/authorization-and-separation-of-duties.md`](authorization-and-separation-of-duties.md), [`docs/human-approval-protocol.md`](human-approval-protocol.md)

### Context

Registry gating proves which agent/tool version is eligible, but a risky call could still be authorized by presentation state or a remembered policy ID. The browser needs an inspectable approval inbox, and the real local MCP slice needs a durable pause/resume path without introducing a backend or claiming production identity.

### Decision

Use a pure TypeScript policy evaluator in both browser and CLI. Model five synthetic personas with a closed scope vocabulary and delegated identity envelope. Effective authority is the intersection of persona, delegation, stage, approved agent, approved tool, and resource boundary. Deny takes precedence; absent policy fails closed.

Version and hash approval policies. Bind approval requests to canonical argument, agent, tool, change-target, and context-pack hashes. Keep an append-only hash-chained event log plus materialized state. Persist the browser approval journal in a versioned, clearly labeled local store and CLI runs in gitignored `.workbench/runs/`. Revalidate the complete binding in the CLI and again in the MCP host before invocation.

### Consequences

- Button visibility and workflow completion are no longer authorization controls.
- Persona switching is functional policy exploration but remains synthetic identity.
- Browser/CLI durability is local and inspectable, not authenticated, shared, or tamper-resistant.
- A production adapter must replace the envelope/store with OIDC/OAuth2 on-behalf-of credentials, server-side authorization, transactional single-use decisions, and immutable audit retention.

## ADR-011 — Replace opaque agent memory with deterministic governed context packs

- Status: Accepted
- Date: 2026-07-17
- Detailed records: [`docs/context-pack-and-memory-governance.md`](context-pack-and-memory-governance.md), [`docs/adr/deterministic-context-retrieval.md`](adr/deterministic-context-retrieval.md)

### Context

The registry declared a memory policy and the approval protocol accepted a context digest, but neither proved which records were selected or why. The earlier placeholder types and ad hoc hashes could not support TTL, revocation, authorization, replay, or artifact provenance. A semantic retrieval claim would also be unsupported because the public repository has no embedding model or vector index.

### Decision

Define versioned `ContextRecord` and `ContextPack` TypeScript/JSON Schema contracts. Use one hash-valid approved context policy per agent. Select checked-in public/synthetic candidates with stable tag, stage, sensitivity, persona, agent, scope, freshness, source/type, priority, recency, episodic-permission, and budget rules. Record all inclusion/exclusion reasons, honest character/byte/token estimates, truncation, exact agent/policy references, and a canonical SHA-256 digest.

Bind artifacts, approvals, local MCP stage manifests, and sandbox evidence to the digest. Persist the full pack in a local run and reject resume if schema, digest, current selection, policy/record hashes, or freshness differs. Keep semantic retrieval as an unimplemented optional adapter governed by the same final policy filter.

### Consequences

- Every stage exposes an inspectable Context Manifest in the primary workflow and guided tour.
- Selected-record or policy changes produce a new digest and stale the affected stage chain.
- Prior failures/fixes are available only under the Implementation Agent's explicit episodic policy.
- Estimates are not presented as measured provider token usage.
- The repository proves deterministic context governance, not semantic search, autonomous learning, external memory ingestion, or production data isolation.

## ADR-012 — Keep real validation local, fixture-only, and recorded

- Status: Accepted
- Date: 2026-07-17
- Detailed records: [`docs/sandbox-security-model.md`](sandbox-security-model.md), [`docs/vertical-slice-walkthrough.md`](vertical-slice-walkthrough.md)

### Context

The browser demo models test and provider activity but cannot safely prove actual file modification or isolated validation. Exposing anonymous execution would require an authenticated, abuse-resistant worker platform and would violate the static public boundary. The existing local MCP slice proves protocol and authorization mechanics but runs its fixed validation directly on the host.

### Decision

Add one separate, explicitly invoked local Docker vertical slice operating only on `examples/toy-repo`. The CLI accepts no repository, patch, or command input. A trusted controller copies the fixture, loads its synthetic issue and approved exact change target, materializes deterministic artifacts/context, requires a failing pre-patch test, applies one exact allow-listed host-side replacement, verifies the final Git/file boundary, and runs fixed build/tests in ephemeral network-disabled containers.

Use a typed `SandboxProvider` with the local Docker implementation as the default. Containers run non-root with read-only filesystems/mounts, dropped capabilities, no-new-privileges, and CPU/memory/PID/time/output limits. Cleanup always runs in `finally`. Emit versioned, canonical-hash-bound JSON plus Markdown evidence; failed validation exits non-zero and cannot become the public `latest` pointer.

The static site validates the checked-in successful pack at build time and renders a recorded summary plus read-only evidence assets. It has no execution path. Record both source commit and working-tree state/tree digest because an evidence file cannot contain the hash of the commit that contains itself.

### Consequences

- Reviewers can reproduce and verify one real failing-before/passing-after path independently of model quality.
- The patch, commands, repository, issue, and targets remain owned, deterministic, synthetic, and narrow.
- Docker is an optional local dependency for generating a real pack; schema/hash validation and unit tests do not require Docker.
- The slice does not prove safe multi-tenant untrusted-code execution, hosted sandbox reliability, container image trust, or production identity/secrets/operations.

## ADR-013 — Add E2B as an explicit optional sandbox adapter

- Status: Accepted with live-validation blocker
- Date: 2026-07-17
- Detailed record: [`docs/sandbox-security-model.md`](sandbox-security-model.md)

### Context

The local Docker slice proves the controller, allow-list, deterministic patch, validation, and evidence path, but it does not demonstrate provider portability. A cloud adapter is useful only if it preserves the static website boundary, accepts no visitor-controlled repository or command, uploads no private material, reports provider-specific controls honestly, and cannot silently accumulate cost after interruption.

### Decision

Keep `LocalDockerSandboxProvider` as the default and add `E2BSandboxProvider` behind the same typed contract. Select E2B only with `--provider e2b`, use the pinned official `e2b` 2.34.0 SDK, and let the SDK read `E2B_API_KEY` from the process environment. Pass an explicit manifest containing only the synthetic toy-repository snapshot and approved generated artifacts.

Request `allowInternetAccess: false`, deny-all outbound rules, no public traffic, secure control traffic, and a two-minute `onTimeout: kill` lifecycle. Refuse to label an execution network-restricted unless E2B reports internet disabled and a fixed outbound probe is blocked. Normalize both providers into evidence schema v2 while retaining discriminated provider metadata. For E2B, report provider-observed CPU/memory and explicitly leave process, tmpfs, root-filesystem, non-root, and Linux-capability controls unclaimed.

Kill each sandbox in `finally`, verify inactivity, use a static kill fallback, and discover tagged running/paused orphans during final cleanup. Keep a credential-gated live integration test separate from fake contract tests.

### Consequences

- Docker usage and the public static site require no E2B account.
- No key was available in this revision; E2B is **implemented but not live-validated**, and no E2B evidence is checked in.
- A future successful live run may add provider evidence only after network denial, bounded uploads, remote-tree equality, command results, and cleanup all verify.
- E2B service, account, SDK, template, billing, and isolation remain external trust dependencies; this adapter is not a production-readiness claim.

## ADR-014 — Bind local execution evidence to OpenTelemetry-compatible traces and explicit budgets

- Status: Accepted
- Date: 2026-07-17
- Detailed records: [`docs/observability-and-budgeting.md`](observability-and-budgeting.md), [`docs/trace-data-handling.md`](trace-data-handling.md), [`docs/adr/open-telemetry-trace-contract.md`](adr/open-telemetry-trace-contract.md)

### Context

Command receipts proved individual checks but did not provide causal span hierarchy, approval wait, repair/tool counts, explicit threshold behavior, or one trace-to-evidence integrity binding. A hosted collector would add credentials, network calls, and operations beyond the static public project's needs.

### Decision

Instrument the real local controller with pinned official OpenTelemetry JavaScript packages and manual safe spans. Use a local in-memory exporter followed by versioned normalized JSON; do not configure a hosted backend or claim OTLP-wire compatibility. Evidence schema v3 binds the trace file hash and ID to source, tested tree, context pack, approved agent, approval policy, execution budget, and evidence digest.

Add content-hashed `ExecutionBudget` v1 enforcement for run/stage duration, tool calls, repair attempts, and optional token/cost limits. Check exact counts before the next operation and measured time around operations. Warnings continue with events; stop actions emit failure evidence, clean up, and exit non-zero. Keep provider-returned usage and estimates distinct, and record exact zero for deterministic no-model runs.

### Consequences

- `/demo/?screen=trace` renders an accessible waterfall and table from checked-in validated evidence only.
- Trace attributes exclude prompt/source/output/argument bodies, credentials, secrets, personal data, and raw exception details.
- The trace cannot contain the final evidence digest without a circular hash; the evidence manifest is the authoritative trace-to-evidence binding.
- This release proves local trace/evidence mechanics and budget enforcement, not hosted telemetry reliability, distributed budget settlement, or model-provider accounting.

## ADR-015 — Keep provider routing behind an explicit scoped local gateway

- Status: Accepted
- Date: 2026-07-17
- Detailed record: [`docs/adr/local-model-gateway.md`](adr/local-model-gateway.md)

### Context

The registry can declare model/runtime policy and the local runtime can enforce budgets and emit traces, but direct provider SDK use would distribute reusable credentials and bypass a single routing/accounting boundary. The public site must remain static and the normal developer path must remain offline and deterministic.

### Decision

Add an original provider-neutral `ModelGateway` contract with a deterministic offline adapter and an explicit loopback LiteLLM adapter. The initial runtime used `1.92.0`; ADR-025 supersedes that image pin without changing this gateway boundary. Keep preferred/allowed models, fallback order, stage/task scope, token/cost/latency ceilings, and independent-review requirements in the versioned workbench registry. Use LiteLLM virtual keys only as local enforcement credentials: reconcile a deterministic per-agent/per-run alias, restrict models and spend, retain the raw key only in gitignored local recovery state, block it in `finally`, and provide an interrupted-run cleanup command.

The browser imports sanitized generated status only. A live catalog and validated claim may be published only from a schema/hash-validated local evidence pack whose credential was revoked. No successful live credential/run was available for this decision, so the public label remains `gateway implemented; live provider path not validated`.

### Consequences

- The deterministic sandbox and public demo gain no model dependency and make no gateway request.
- The optional local profile requires Docker, PostgreSQL, a master key, and an upstream provider credential.
- Provider egress and provider retention terms remain residual risks and are not described as network-isolated execution.
- Model calls, fallback, usage, cost basis, budget outcomes, and safe credential alias metadata become traceable without prompt/response/key capture.
- A configured second model is not called consensus or review evidence unless a distinct invocation appears in the trace.

## ADR-016 — Gate releases on claim-oriented tests and measured static output

- Status: Accepted
- Date: 2026-07-17
- Detailed records: [`docs/quality-system.md`](quality-system.md), [`docs/performance-and-static-hosting.md`](performance-and-static-hosting.md)

### Context

The repository had useful Chromium and axe coverage, but key readiness decisions remained inline in screens, browser coverage was single-engine, build size was unmeasured, and no pull-request quality workflow enforced evidence, dependency, link, CSP, or performance integrity.

### Decision

Move Verify, review, validation, and release-readiness decisions into pure typed guards used by both screens and tests. Enforce domain coverage plus stricter guard coverage. Run the production preview across Chromium, Firefox, and WebKit; keep axe as a blocking principal-screen check; and capture controlled, non-pixel-gated visual evidence for review.

Use one `check:all` release command and SHA-pinned GitHub Actions on pull requests and `main`. Measure Vite assets against recorded gzip budgets and run local-only desktop/mobile Lighthouse assertions. Emit a static-host header manifest and serve the same CSP in preview. Keep analytics disabled with no provider implementation.

### Consequences

- The screens cannot silently diverge from the guard logic their tests exercise.
- CI is slower because cross-browser and Lighthouse checks are intentional release gates.
- Visual captures require human comparison; they avoid platform-font pixel brittleness.
- A static host must honor the emitted headers or reproduce them at its edge before publication.

## ADR-017 — Generate proportionate supply-chain evidence from one fail-closed gate

- Status: Accepted
- Date: 2026-07-17
- Detailed records: [`docs/release-evidence.md`](release-evidence.md), [`SECURITY.md`](../SECURITY.md), and [`THREAT_MODEL.md`](../THREAT_MODEL.md)

### Context

The repository already enforced source quality, credential-pattern checks, npm advisories, and pull-request dependency review, but it did not bind secret-history scanning, SARIF, SBOMs, image findings, licenses, scanner versions, and exceptions into one reproducible release record. The general-purpose Node sandbox image also retained unused npm packages with high-severity advisories.

### Decision

Add a typed, fail-closed supply-chain orchestrator using immutable Gitleaks and Trivy images, the locked CycloneDX npm generator, ESLint, npm audit, and repository-specific container/language policy. Build a minimal sandbox runtime from a digest-pinned Node base, remove npm because fixed checks invoke Node directly, scan the exact built image ID, and generate CycloneDX records for production npm dependencies, the complete npm graph, and the image. Keep detailed reports gitignored/CI-retained and publish only a sanitized source-tree/result digest summary.

Pin GitHub dependency review and CodeQL actions by commit SHA. Treat CodeQL as configured but unvalidated until hosted evidence exists. Centralize suppressions with exact scanner/rule/path matching, reviewer, review date, and expiry; missing tools, databases, history, Docker, or scan output fail rather than becoming a pass.

### Consequences

- Local and CI validation require Docker, full reachable Git history, scanner-image downloads, and current advisory databases.
- All current high/critical thresholds apply to the complete inspected target, not only newly added findings.
- Report hashes and source-tree digest provide integrity evidence but are not signed attestations or a SLSA claim.
- Vendor signatures are verified where a key is published; locally derived images and long-term immutable evidence retention remain release risks.

## ADR-018 — Make the public clean-room boundary a contribution rule

- Status: Accepted
- Date: 2026-07-17
- Detailed record: [`docs/adr/public-clean-room-scope.md`](adr/public-clean-room-scope.md)

### Decision

Require independent first-party source, schemas, fixtures, UI, copy, tests, and diagrams; record only public high-level influences; classify every claim; review generated output; keep private publication materials ignored; and use `original-prototype-v0.9.0` rather than active-branch backup exports for preservation.

## ADR-019 — Use four logical planes with hash-bound handoffs

- Status: Accepted
- Date: 2026-07-17
- Detailed record: [`docs/adr/four-plane-architecture.md`](adr/four-plane-architecture.md)

### Decision

Separate control, context, execution, and validation responsibilities through typed, versioned, hash-bound records. Keep them as logical module/contract boundaries in this repository rather than claiming separately deployed services.

## ADR-020 — Bind and independently authorize risky human decisions

- Status: Accepted
- Date: 2026-07-17
- Detailed record: [`docs/adr/human-approval-boundaries.md`](adr/human-approval-boundaries.md)

### Decision

Bind approval requests to canonical action, capability, policy, context, target, requester, expiry, and separation-of-duties requirements; fail closed and revalidate on resume. Keep browser/CLI journals explicitly local and non-production.

## ADR-021 — Keep public delivery static and real execution local

- Status: Accepted
- Date: 2026-07-17
- Detailed record: [`docs/adr/static-public-site-and-local-execution.md`](adr/static-public-site-and-local-execution.md)

### Decision

Expose no public runner. Permit the site to render only checked-in validated evidence, while an explicit fixture-only developer CLI performs the bounded real modification and validation path.

## ADR-022 — Target a static Git-backed host with verified edge policy

- Status: Accepted; provider selection deferred
- Date: 2026-07-17
- Detailed record: [`docs/adr/static-hosting-and-security-headers.md`](adr/static-hosting-and-security-headers.md)

### Decision

Retain the Vite multi-page static artifact, local-only assets, configuration-driven canonical links, default-off analytics, and restrictive generated headers. Do not claim deployment or edge enforcement until the final host is selected and observed.

## ADR-023 — Grant no first-party reuse license without owner intent

- Status: Accepted for this revision
- Date: 2026-07-17
- Detailed record: [`docs/adr/source-license-decision.md`](adr/source-license-decision.md)

### Decision

Do not silently select a permissive license. State that no reuse license has been granted, retain third-party upstream terms, and require an explicit owner decision plus documentation/security updates before changing the boundary.

## ADR-024 — Make public evidence boundaries and review assets deterministic

- Status: Accepted
- Date: 2026-07-17

### Decision

State the functional-versus-simulated boundary in the case-study hero, preserve the guided-tour step in validated URL state so an interrupted walkthrough can resume, and generate every public screenshot plus the social card from repository-owned production HTML, SVG, CSS, and fixtures. Decode and compare image pixels in the release gate, allowing at most 32 one-value channel differences for browser antialias noise while rejecting larger visual drift.

### Consequences

- The first viewport answers what is functional and what is simulated without relying on a visitor opening the demo.
- Walkthrough progress is shareable but contains only a bounded step number; closing the guide removes its URL state and no workflow approval is persisted.
- Public visual evidence can be reproduced from the built application and fails validation when checked-in assets materially drift without turning browser antialias noise into a false release failure.

## ADR-025 — Gate every runtime image and patch LiteLLM from a verified upstream

- Status: Accepted
- Date: 2026-07-17
- Detailed records: [`docs/release-evidence.md`](release-evidence.md), [`docs/postgres-gosu-reachability.md`](postgres-gosu-reachability.md), and [`docs/adr/local-model-gateway.md`](adr/local-model-gateway.md)

### Context

The original supply-chain gate scanned only the locally built sandbox. The optional Compose stack also executes LiteLLM and PostgreSQL, and their old pins contained fixed HIGH/CRITICAL advisories. LiteLLM signs its images and publishes separate database and non-root variants, but the generic non-root variant does not reliably support the Prisma-backed virtual-key database and no current stable image met every required package floor.

### Decision

Treat the sandbox, LiteLLM, and PostgreSQL as the exact runtime-image inventory. Build or pull each target, resolve and publish its scanned content ID, run Trivy with zero unsuppressed HIGH/CRITICAL findings, and generate a CycloneDX SBOM for each. Verify LiteLLM's signed database upstream digest with Cosign and the public key pinned to immutable upstream commit `0112e53046018d726492c814b3644b7d376029d0`.

Derive the local LiteLLM runtime from signed database image `v1.94.0-dev.3`, which supplies Python `3.13.14` and `ddtrace 4.11.0`, and install only `mcp 1.28.1` from its SHA-256-locked wheel without dependency re-resolution. Relocate the pinned Prisma cache, generate its client during the build, remove the temporary installer, and set numeric user/group `65534:65534`. Use PostgreSQL `17.10-alpine3.24`; permit only its exact-digest `/usr/local/bin/gosu` findings under individual, expiring, reachability-documented exceptions.

### Consequences

- The complete release gate now requires container registries, PyPI for one hash-locked wheel, Sigstore verification, current Trivy databases, and more CI time.
- Container scanners never leave root-owned reports: Gitleaks uses the host UID/GID on Linux, while Trivy returns SARIF and CycloneDX through stdout for the non-root release process to write, sanitize, and validate.
- The LiteLLM runtime is a local derivative, so the vendor signature applies to its exact upstream base, not to the derived content ID. The Dockerfile, wheel hash, package floors, non-root user, scan, and SBOM bind the derivative.
- A pre-release LiteLLM base is a temporary compatibility risk. Replace it with the next signed stable database-compatible digest that meets every package floor and can be made non-root without runtime mutation.
- PostgreSQL exceptions fail if the digest/path/CVE stops matching and expire on 2026-08-15; a maintained rebuild is required if the official image is not fixed and reachability can no longer justify the exception.

## ADR-026 — Use Linux as the canonical public-screenshot pixel platform

- Status: Accepted
- Date: 2026-07-18

### Context

The public site intentionally uses operating-system UI fonts. Chromium therefore rasterizes text differently on Windows and Linux even when the DOM, CSS, browser version, viewport, and content are identical. Comparing Windows-generated public screenshots against an Ubuntu release runner produced hundreds of thousands of false pixel differences.

### Decision

Generate and enforce exact public-screenshot pixels on Linux, the hosted release-gate platform. On other operating systems, continue to build the production site, visit every capture route, wait for its expected heading and fonts, produce each screenshot, and require its dimensions to match the checked-in asset. Keep cross-browser behavioral, accessibility, responsive, and controlled visual-artifact tests platform-independent.

### Consequences

- Hosted Quality rejects stale public screenshots with the existing strict pixel thresholds.
- A strict hosted mismatch retains only the generated PNG in the restricted, short-lived security artifact so the canonical asset can be reviewed and refreshed without disabling the gate.
- Windows development detects broken routes, missing headings, capture failures, and dimension changes without misclassifying operating-system font rasterization as application drift.
- Public screenshot regeneration for a release must run on Linux before the audited commit is accepted.

## ADR-027 — Serialize hosted browser release tests after container scans

- Status: Accepted
- Date: 2026-07-18

### Context

The complete hosted release gate runs cold container builds, vulnerability scans, SBOM generation, three browser engines, and Lighthouse. Running all of those controls on one bounded runner left Firefox's Playwright transport CPU-starved after the container workload, producing navigation and connection timeouts that did not reproduce locally. A fresh hosted runner removed that resource coupling but exposed a second Firefox transport defect in Playwright 1.61.1: completed reload responses intermittently failed to surface a navigation commit or restored application state on GitHub's native Linux runner. Retained network evidence showed the document and assets completing in milliseconds, and disabling Firefox tracing alone did not correct the native-runner fault. Moving the combined browser process into the official Playwright container left the same four Firefox reload cases stalled after Chromium had already completed. Isolating Firefox into its own Linux container improved the result but did not make it reliable: three exact-SHA runs respectively stalled on approval reload, passed, and stalled on a responsive-page evaluation even though the retained DOM snapshot and screenshot showed the correct completed UI. The same audited SHA passed all 47 Firefox cases in local isolated container processes with both Node 22.18.0 and Node 24, five consecutive local reload stress repetitions, and the complete local Windows release gate. The dark-theme accessibility check could also sample foreground transitions before they reached their final contrast-safe tokens. GitHub runner AppArmor does not permit the downloaded Playwright Chromium to start its user-namespace sandbox when Lighthouse launches it directly.

### Decision

Keep `npm run check:all` as the complete local aggregate, but split the hosted Quality workflow into isolated jobs on separate fresh runners. The first job runs deterministic, repository-security, screenshot, supply-chain, signature, SBOM, and vulnerability gates. Only after it succeeds do Chromium and WebKit matrix jobs check out the same immutable workflow SHA and run exactly one Playwright project each in the official Playwright 1.61.1 Noble container pinned to digest `sha256:5b8f294aff9041b7191c34a4bab3ac270157a28774d4b0660e9743297b697e48`. Run that container as its unprivileged UID with an init process and host IPC, following the vendor's CI and Chromium-memory guidance. Run Firefox as a separate first-attempt job on the maintained `windows-2025` GitHub image, install the exact Playwright Firefox revision from the lockfile, and retain the same reports and failure artifacts. This changes the hosted operating system, not the browser engine or test surface, and avoids the demonstrated Linux-only Firefox transport defect. A separate Linux-container performance job checks out and builds that SHA, then runs Lighthouse only after every browser job succeeds. Continue to select Node 22.18.0 from `.nvmrc` in every job and verify the bundled Linux browser inventory before testing. Run Playwright with one worker and a 90-second per-test timeout in CI while retaining two workers and the 30-second timeout locally. Disable CI retries so a first-attempt failure cannot be hidden inside a green release gate. Disable Playwright tracing only for Firefox until its transport can reliably record this suite; retain the GitHub/HTML reports, failure screenshots, error context, and full Chromium/WebKit traces. For persistence assertions, save the exact current URL, leave the origin for a blank document, and reopen that URL in the same context. This creates a fresh application document and proves browser-local plus URL state restoration without depending on Playwright's intermittently stalled Firefox `reload` transport; local Firefox stress coverage still exercises native reload. Perform one-time authorization cleanup after a commit-only setup navigation rather than waiting for a redundant page load. Apply a theme-token change atomically in a layout effect: mark the document as switching, disable transitions for that frame, update the theme, and remove the marker on the next animation frame. Before auditing dark-theme contrast, require the target theme and the removal of that marker. Continue to launch Lighthouse's pinned Chromium with `--no-sandbox --disable-setuid-sandbox` because the GitHub host's AppArmor policy blocks its user-namespace sandbox; the container runs only the repository's trusted local static build. Do not suppress Axe rules or browser failures.

### Consequences

- Hosted browser coverage starts only after core controls pass, and each engine executes in a fresh runner process without Docker/Trivy or another browser project's resource residue; every job remains bound to the same workflow SHA.
- Chromium and WebKit use the digest-pinned Linux container; Firefox uses a pinned Playwright browser revision on Windows until the hosted Linux transport is reliable.
- Lighthouse starts only after all three browser jobs succeed, so performance evidence cannot conceal or bypass a failed engine.
- Persistence checks create a new document at the same exact route, a stronger state-restoration boundary than reusing the current document and one that does not depend on lifecycle events, fonts, images, or another nonessential resource completing before application assertions begin.
- A hosted browser gate either passes on its first attempt or fails the release; there is no successful-but-flaky state.
- Firefox failures retain screenshots, error context, and structured report evidence but not a Playwright trace; Chromium and WebKit retain traces normally. Re-enable Firefox tracing after a pinned Playwright upgrade passes the Linux reload, Axe, and full-suite stress checks.
- Visitors never see the intermediate low-contrast foreground/background combinations that a gradual custom-property transition can produce.
- The contrast assertion evaluates the stable UI state and still fails if the final token is below the required ratio.
- Lighthouse's Chromium process remains unsandboxed, but the browser job gains a version- and digest-pinned userspace plus unprivileged container boundary; the surrounding ephemeral runner remains the outer isolation boundary and the audited origin is local and repository-controlled.
- Local parallelism remains fast, and all three maintained browser engines continue to run in both environments.

## ADR-028 — Harden credential-bearing containers and use file-backed secrets

- Status: Accepted
- Date: 2026-07-18
- Detailed record: [`docs/adr/local-model-gateway.md`](adr/local-model-gateway.md)

### Context

The database-backed gateway previously relied on a generic non-root image that could not reliably complete Prisma initialization. Compose also injected administrator, provider, salt, and database credentials as plaintext environment values and did not fail closed if a credential-bearing service lost runtime hardening or gained a writable path.

### Decision

Build the gateway from LiteLLM's signed database digest, make the derivative explicitly non-root at `65534:65534`, and generate Prisma assets at build time from a relocated offline cache. Run PostgreSQL directly as `70:70`. For both credential-bearing services, drop all capabilities, enable `no-new-privileges`, make the root filesystem read-only, and allow only reviewed tmpfs paths plus PostgreSQL's data volume.

Mount credentials as Compose secret files sourced from an OS-protected, gitignored location. Permit the Node client to read the same master-key file or a single-process OS-secret-manager injection, but reject ambiguous dual input. Store spend metadata without prompt/response content, delete records older than seven days, and run cleanup daily. Disable the Admin UI. Extend the container policy to discover credential-bearing services and fail on missing reviewed identities, secret mounts, controls, or exact writable-path allowlists.

### Consequences

- The upstream Cosign signature covers the exact database base; the local derivative remains bound by its Dockerfile, package hash, exact content ID, SBOM, and vulnerability scan rather than a vendor signature claim.
- Local Compose secret source files are not an encrypted Docker store. They must be materialized from an OS secret manager with owner-only access and deleted after the stack and virtual-key cleanup finish.
- PostgreSQL's reported `gosu` binary is dormant because the service starts directly as `70:70`; changing that startup identity invalidates the reachability exception and fails policy.
- Provider egress and provider-side retention remain residual risks even though gateway spend logs exclude prompt content and expire metadata.

## ADR-029 — Bind lint and worktree security scans to the Git index

- Status: Accepted
- Date: 2026-07-18
- Detailed records: [`docs/quality-system.md`](quality-system.md) and [`docs/release-evidence.md`](release-evidence.md)

### Context

ESLint and several security checks traversed the working directory or included every nonignored untracked file. Browser, coverage, Lighthouse, and scanner runs therefore could change later scan inputs even though those generated artifacts were not source. A release gate must produce the same security decision in a clean checkout and a reused workspace.

### Decision

Use one shared, sorted `git ls-files --cached` regular-file inventory for lint, repository credential checks, reachable-provenance inspection, worktree Gitleaks input, language coverage, and source-tree hashing. Record the exact paths, count, exclusions, and digest in restricted supply-chain evidence. Require new source to enter the Git index before it can pass release checks.

Add a reused-workspace regression to `check:all`: preserve the supply-chain result from `check`, run the full browser and Lighthouse stages, run a focused Playwright security project, rerun `security:supply-chain`, and require the stable source, controls, artifact inventory, suppressions, and runtime-image result to be identical.

### Consequences

- Ignored and untracked generated artifacts cannot create lint findings, leak into worktree secret reports, alter the source digest, or trigger unsupported-language policy.
- An untracked source file is intentionally outside release scope until it is staged; contributors must add intended files before the final gates.
- Git-history scanning remains independent and still covers every reachable ref.
- `check:all` performs one additional focused Chromium run and supply-chain pass, increasing local release time in exchange for regression evidence from a contaminated workspace.

## ADR-030 — Require canonical targets before bounded-write policy matching

- Status: Accepted
- Date: 2026-07-18
- Detailed record: [`docs/authorization-and-separation-of-duties.md`](authorization-and-separation-of-duties.md)

### Context

The authorization engine treated an empty target list as satisfying every path allow-list, and a policy matcher with `pathPatterns` skipped its path check when no target was supplied. A `BOUNDED_WRITE` action could therefore advance to approval without naming the resource that the approval was meant to bind.

### Decision

Require every bounded write to contain at least one canonical target before evaluating approval policies. Reject malformed, absolute, encoded, or traversing targets with `RESOURCE_BOUNDARY_DENY`, and reject an absent list with `MISSING_TARGET_PATHS`. Require `pathPatterns` matchers to receive a nonempty list whose every member is canonical and matches an allowed pattern. Apply the same canonical check in the trusted MCP client before invocation.

### Consequences

- An approval request can never be created for a bounded write that omits its resource binding.
- One invalid member denies the entire target list; valid entries cannot mask an outside or malformed path.
- The MCP server remains a second real-path and symlink boundary, but invalid requests are stopped before approval or protocol execution.
- URI targets remain supported only in canonical `scheme://authority/path` form.
