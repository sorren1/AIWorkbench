# Decision log

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

Use a persistent `Demo mode · Synthetic data · No external writes` indicator. External-system actions remain deterministic simulations and say so at the action or immediate context; browser-local decisions use `demo`, `synthetic`, or `locally` where a production-shaped verb might otherwise be ambiguous.

### Consequences

- Reloading a deep link restores navigation context but intentionally does not restore prior mutable demo decisions.
- Clipboard access can be rejected by browser policy; the UI reports that failure instead of claiming success.
- Downloads work entirely in the visitor's browser and require no backend, temporary server storage, or analytics call.
- URLs remain safe to share because only allow-listed route and synthetic fixture identifiers are serialized.
- A future durable approval journal must introduce its own clearly labeled storage and identity model; it cannot silently reuse this ephemeral demo state.
