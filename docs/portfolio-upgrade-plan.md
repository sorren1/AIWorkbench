# Portfolio upgrade plan

Status: approved implementation plan
Baseline: commit `13d01bb` (`Initial commit`)
Prepared: 2026-07-16
Expanded: 2026-07-16 to include the focused agent control plane

## Outcome

The finished repository will be a static-host-compatible public project with two deliberate product surfaces plus supporting static routes:

1. `/` — a semantic, statically rendered case study that explains the problem, boundaries, architecture, decisions, controls, and lessons without requiring JavaScript.
2. `/demo/` — the existing AI Delivery Workbench, migrated to strict TypeScript and conventional React modules, with deterministic local interactions and explicit simulated/functional labeling.

The supporting routes are a substantive technical article at `/writing/governing-ai-assisted-delivery/` and a custom static-host-compatible `404.html`. They share the case-study presentation without loading React.

The workbench will include a focused, vendor-neutral agent control plane for its existing coding-delivery stages. Its thesis is narrow: generation alone is not sufficient evidence. The demo should make authorization decisions, selected context, tool boundaries, human approvals, model/runtime policy, budgets, traces, and supply-chain evidence inspectable for a governed coding-agent run.

This is not a generic agent-management product. The control-plane features stay attached to the workbench's stage workflow, issue runs, artifacts, and evidence. The public release remains a static application with no required backend and no anonymous model or tool endpoint.

Vite will build all four HTML entries and fingerprint their local assets. The case study, article, and 404 page use plain semantic HTML and CSS; React loads only on the demo route. No backend is part of the initial public release.

## Architecture target

```text
index.html                         static public case study source
404.html                           static not-found entry
demo/index.html                    demo entry document
writing/governing-ai-assisted-delivery/index.html
                                   static technical article
src/
  case-study/
    site.css                       case-study/article layout and responsive rules
  site/
    config.ts                      typed optional public identity, links, canonical, analytics opt-in
    metadata.ts                    pure metadata, structured-data, robots, sitemap generators
    vitePlugin.ts                  build-time links and synchronized source excerpts
  demo/
    main.tsx                       React mount
    App.tsx                        workbench shell
    components/                    semantic reusable controls and overlays
    screens/                       workflow screens plus focused control-plane views
    state/                         typed reducer, actions, selectors
    data/                          typed synthetic fixtures and artifact generators
    control-plane/
      registry/                    versioned stage-agent and tool manifests
      policy/                      persona, authorization, model, and budget evaluation
      approvals/                   browser-local approval journal and state machine
      context/                     context-pack assembly, provenance, and digesting
      telemetry/                   trace model, OTLP export adapter, and waterfall data
      gateway/                     provider-neutral policy contract; no public endpoint
      evidence/                    normalized run and supply-chain evidence records
    demo.css                       workbench component/layout rules
  shared/
    Icon.tsx                       shared SVG icon component
    disclosure.ts                  canonical prototype boundaries and approved context text
  styles/
    tokens/                        color, semantic, type, spacing, radius, motion
    global.css                     reset, base elements, shared utilities
public/
  assets/                          static logo/social/favicon assets
tests/
  unit/                            reducer, policy, registry, budget, digest, generators
  accessibility/                   component/page axe coverage
  e2e/                             critical keyboard and governed-demo flows
  fixtures/                        deterministic trace/evidence compatibility samples
.github/workflows/ci.yml           reproducible pull-request and supply-chain checks
```

Build properties:

- Vite multi-page application with case-study, article, demo, and 404 inputs.
- Relative or repository-subpath-safe asset URLs so the output works on a Git-backed static host.
- Strict TypeScript with `noEmit`, React JSX compilation, and no ambient `window` application globals.
- React production bundle only on `/demo/`; the root case study remains useful with scripts blocked.
- Build-time configuration omits unset public links and canonical-dependent tags; no dead placeholder or invented deployment URL is rendered.
- Marker-bounded source excerpts are read from the active TypeScript implementation during the build so drift fails loudly.
- Local assets only at runtime. Font files may be self-hosted only after their license and attribution are recorded; otherwise use the existing system fallbacks.
- No client router dependency is required. Demo screen state can remain reducer-driven because `/demo/` is the public route boundary.
- No server is required for the public demo. Browser persistence is limited to disclosed local preferences and the local approval journal.

The rationale and rejected alternatives are recorded in `docs/decision-log.md` and `docs/adr/`.

## Focused agent control-plane scope

### Product boundary

The control plane governs only the workbench's coding-delivery stages and the tools those stages may request. It is presented through one compact Control Plane area and through contextual run details, not as a separate catalog or operations suite.

The primary path remains:

```text
synthetic issue
  -> approved stage-agent version
  -> authorized context pack
  -> model/runtime policy decision
  -> budget preflight
  -> simulated model step
  -> authorized or approval-gated tool request
  -> simulated external result or functional local result
  -> trace + evidence
```

The local policy evaluator, manifest hashing, budget counters, trace construction, filtering, export, and browser-local approval journal will be functional. Personas, external identity, model calls, remote tools, provider credentials, repositories, CI services, and deployment systems will be deterministic simulations and labeled as such at the point of use.

### 1. Versioned stage-agent and tool registry

- Store checked-in, typed manifests for the eight delivery stages and the bounded tools they may request.
- Give every registry item a stable identifier, immutable semantic version, lifecycle state, content digest, source revision, and supersession link where applicable.
- Resolve a run to exact agent, prompt, tool, context-policy, model-policy, and budget-policy versions before execution; retain those references in its evidence.
- Keep registry history in Git and deterministic fixture data. The public UI does not allow arbitrary agent or tool upload.
- Only approved, non-deprecated versions are selectable for a new demo run. Historical runs remain viewable against retired versions.

### 2. Capability cards

Each stage-agent version will have an original, repository-owned capability card that declares:

- purpose and owning delivery stage;
- accepted inputs and emitted outputs, with local schema references;
- allowed, denied, and approval-gated tools;
- memory scope and context-selection policy;
- provider-neutral model alias, permitted runtime class, fallback rule, and credential-reference scope;
- token, estimated-cost, iteration, tool-call, and elapsed-time budgets;
- lifecycle, approver requirements, source revision, prompt/config digests, and evidence provenance.

Cards are concise control contracts, not marketing profiles. Tool metadata from an external server is treated as untrusted until it matches an approved local registry entry.

### 3. Registry lifecycle and approval gating

- Use `draft -> in_review -> approved -> deprecated` as the publish path, with `rejected` and `disabled` terminal/exception states.
- Require a review record before an agent or tool version becomes eligible for a run.
- Require a security reviewer for new external-write/privileged tool capabilities, broader context access, or credential-scope expansion.
- Prevent self-approval and preserve an append-only decision history in the deterministic domain model.
- Treat disabling as an emergency policy action that blocks new runs without rewriting historical evidence.

### 4. Persona-scoped authorization and separation of duties

Use fictional, explicitly simulated personas to exercise a functional local authorization engine:

| Persona           | May do                                                           | May not do                                         |
| ----------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| Builder           | Draft agent/tool versions and request runs                       | Approve own registry version or risky tool request |
| Operator          | Start an approved workflow and request a bounded tool action     | Change policy or approve own request               |
| Control reviewer  | Review agent versions, ordinary tool scopes, and runtime policy  | Approve a version they authored                    |
| Security reviewer | Approve privileged/external-write scopes and security exceptions | Edit the evidence for a decided request            |
| Auditor           | Read registry history, approvals, traces, and evidence           | Mutate control-plane state                         |

Every policy result records actor, persona, resource, action, decision, reason code, applicable policy version, and time source. This demonstrates authorization logic; it is not real authentication or enterprise identity integration.

### 5. Durable human approval for risky tool calls

- Classify tools as `read_only`, `workspace_write`, `external_write`, or `privileged`.
- Convert a gated tool request into an approval envelope containing the exact agent version, tool version, redacted normalized arguments, context digest, policy decision, risk reason, requester, required approver persona, expiration, and trace linkage.
- Model `pending`, `approved`, `rejected`, `expired`, `cancelled`, `executed`, and `failed` states as append-only events. A decision never overwrites the request.
- Persist the bounded journal in a versioned local-storage record so it survives reload in the same browser profile; reset is functional and deterministic. Defer export/import until a later evidence-portability phase because it is not needed for the approval enforcement path.
- Enforce request/approver separation and time-bounded approval before browser resume; enforce single-use execution for the write-capable local CLI run.
- Label this precisely as a browser-local durable demo record, not shared, tamper-resistant, authenticated, or production storage. A transactional server-side event store is a production adapter, not part of the static release.

### 6. Context-pack manifests

- Assemble a deterministic manifest before each stage from approved synthetic resources only.
- Record source identifier, resource type, content revision/digest, origin/provenance, retrieval time, source modification time when known, maximum age, freshness status, trust classification, inclusion reason, and applied redactions.
- Record explicit exclusions with stable reason codes, including denied source, stale source, out-of-scope path, sensitive material, and duplicate content.
- Canonicalize the manifest and calculate a SHA-256 digest in the browser. Link the digest to the run, approval request, trace, and generated evidence.
- Capture metadata and digests by default, not prompt or resource bodies. The demo contains synthetic data only and never imports non-public organization material.

### 7. OpenTelemetry-compatible traces and local waterfall

- Represent workflow, agent invocation, context retrieval, model inference, policy evaluation, approval wait, tool execution, and evidence generation as parent/child spans.
- Export a pinned OTLP/HTTP JSON-compatible trace document and use applicable OpenTelemetry GenAI semantic conventions for agent, inference, retrieval, usage, and tool spans.
- Keep project-specific governance fields in a documented namespace and record the semantic-convention version used. Compatibility tests validate deterministic export fixtures.
- Do not capture prompts, tool arguments, results, or context bodies by default; these may contain sensitive information. Store digests, sizes, classifications, and redacted summaries instead.
- Render the same trace data as an accessible local waterfall with stage/tool/approval groupings, duration scale, status, measured/estimated badges, keyboard navigation, and a tabular alternative.
- Label historical trace fixtures as simulated. Only time measured during an active local demo interaction is labeled measured.

### 8. Budgets and honest measurement labels

- Evaluate per-stage and per-run limits for input tokens, output tokens, estimated cost, model iterations, tool calls, retry count, and elapsed time.
- Perform a preflight check and re-evaluate after every model/tool iteration. A denied or exhausted budget produces an explicit stopped state and trace/evidence reason; it is not silently expanded.
- Attach a `measured`, `provider_reported`, `calculated`, `estimated`, `simulated_fixture`, or `not_available` basis to every value.
- Local elapsed time, iterations, retries, and tool calls can be measured by the running demo. Provider token usage is provider-reported only when a future non-public adapter supplies it; otherwise token counts are estimated with the named algorithm or marked unavailable.
- Cost is calculated from a versioned pricing fixture and labeled estimated. The demo never calls it billed, actual, or saved cost.
- Display pricing timestamp/currency and preserve the calculation inputs so a reviewer can reproduce the estimate.

### 9. Optional provider-neutral model gateway contract

- Define a small gateway interface around provider-neutral model aliases, allowed runtime classes, request limits, fallback restrictions, and usage receipts.
- Bind each approved agent version to a credential-reference identifier scoped to that agent and capability. No credential value enters the browser bundle, fixtures, local storage, logs, or repository.
- Make local routing/policy evaluation functional and the model response deterministic. Label the displayed gateway exchange and credential binding as simulated architecture.
- Keep real provider adapters opt-in and out of the public static build. Any future gateway must run behind authenticated infrastructure, use server-side secret storage, and issue short-lived/scoped credentials.
- Do not expose a live anonymous model or agent endpoint.

### 10. Supply-chain evidence

- Run secret scanning, SAST, dependency review/scanning, and a CycloneDX JSON SBOM generation step in CI with pinned tool versions or actions.
- Normalize each result into an evidence envelope containing check type, tool/version, source revision, start/end time, status, findings summary, artifact digest, and link to the retained raw artifact when available.
- Gate release on configured severity thresholds and document exception ownership/expiry. Never translate a failed, skipped, or unavailable scanner into a pass.
- Run container scanning whenever the repository produces a container image. The initial static release intentionally has no container; its evidence must say `not_applicable: no container artifact produced`, not show a green container scan.
- Present supply-chain evidence within the coding workflow's run/release evidence view, not as decorative administrative analytics.

## Explicit initial-release exclusions

The initial public release will not include:

- a full AWS account deployment;
- Cognito, ECS, RDS, VPC, or PrivateLink infrastructure;
- a live anonymous agent endpoint;
- a full A2A network of independently deployed services;
- a general-purpose multi-tenant agent marketplace; or
- decorative admin analytics unrelated to the coding-agent workflow.

It also will not claim real enterprise authentication, remote credential issuance, tamper-proof audit storage, live model usage, production costs, or external tool execution. Those require deployment-specific infrastructure and security review.

## Delivery phases

### Phase 0 — Baseline and transformation plan

Scope: the original documentation-only baseline phase plus this documentation-only control-plane planning amendment.

Acceptance criteria:

- Repository, runtime, network, content, state, control, accessibility, responsiveness, and hygiene findings are recorded with file references.
- The target architecture, focused control-plane boundary, standards boundary, and migration map are explicit.
- Repository operating rules and current/target commands are in `AGENTS.md`.
- `private/` contents are ignored while `private/README.md` remains tracked.
- Public design influences and independent-implementation rules are recorded.
- Product behavior and visual styles are unchanged.
- `git diff --check` passes and the browser baseline remains the applicable behavioral record.

Commits:

- `docs: establish portfolio transformation plan`
- `docs: plan agent control-plane expansion`

### Phase 1 — Preservation, reproducible toolchain, and typed migration

Scope: establish the build and migrate the existing prototype without intentional feature or visual redesign.

Acceptance criteria:

- Verify `original-prototype-v0.9.0` points to the original implementation. Because the tag is absent at baseline, create it at `13d01bb` before deleting legacy files and document that correction.
- Add `package.json`, a committed lockfile, strict TypeScript configurations, Vite MPA configuration, and reproducible scripts.
- Create static root `index.html` and separate `demo/index.html` entries.
- Migrate React, state, fixtures, and screens to `.ts`/`.tsx` modules with typed public boundaries.
- Remove browser Babel, UMD React development builds, script-order coupling, and `window.*` exports.
- Establish typed control-plane domain seams without exposing unfinished UI or changing behavior.
- Preserve the current desktop visual identity and demo state behavior closely enough for side-by-side review.
- Remove superseded generated bundle/manifest artifacts only after the preservation tag is verified.
- `npm ci`, lint, typecheck, unit smoke tests, and production build pass.
- Built output serves successfully at `/` and `/demo/` with no browser console errors.

Commit: `refactor: migrate workbench to React and strict TypeScript`

### Phase 2 — Public narrative, disclosures, and repository identity

Scope: turn the root surface and repository documentation into a credible public case study.

Acceptance criteria:

- Root case study explains the problem, design principles, architecture, workflow, control-plane thesis, functional demo boundary, tradeoffs, and future production requirements.
- The approved professional-context claim appears at most where useful, verbatim, in a clearly separated “Professional context” section; no other experience or outcome claims are introduced.
- The audience-specific organization sentence at baseline `workbench/README.md:28` and all submission-specific language are removed.
- Synthetic people, personas, policies, approvals, traces, and fixtures are explicitly identified as fictional demo data; no text implies real users or customers.
- Functional local behavior and simulated external operations are explained in both README and UI copy.
- Standard public files exist as appropriate: `README.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, and attribution notices.
- `docs/design-influences.md` remains linked and current; no public reference is presented as an endorsement or implementation dependency.
- Add useful metadata: descriptive title, meta description, canonical strategy, favicon, Open Graph/Twitter cards, and static-host-safe `robots.txt`/sitemap if a canonical public URL is known. Do not invent a URL.
- Content/privacy scans and production build pass.

Commit: `docs: reposition workbench as an independent portfolio project`

### Phase 3 — Semantic interaction and accessibility

Status: Complete (2026-07-16). Delivered with Phase 4 in commit `fix: harden accessibility and responsive behavior`.

Scope: meet keyboard and assistive-technology expectations without changing the product concept.

Acceptance criteria:

- Landmarks, heading hierarchy, page titles, skip link, labels, descriptions, table captions, and live regions are semantic.
- Navigation and route controls are links or buttons with current-page state.
- Queue filters use native checkboxes/toggle buttons; artifact selectors and timeline expanders are keyboard operable.
- Tabs implement the WAI-ARIA tab pattern with arrow-key movement, selection, panels, and managed focus.
- Modal and drawer implement dialog semantics, initial focus, focus containment, Escape close, background inertness, and trigger focus return.
- Clickable table rows provide a real row link/action without invalid interactive nesting; keyboard users can reach the issue destination.
- Toasts announce appropriately and have named close buttons.
- Motion respects `prefers-reduced-motion`.
- Automated axe coverage reports no serious or critical violations on representative screens, and manual keyboard/screen-reader-oriented checks pass.

Delivered commit: `fix: harden accessibility and responsive behavior`

### Phase 4 — Responsive and resilient layout

Status: Complete (2026-07-16). The public pages are verified at 320, 375, 768, 1024, and 1440 CSS pixels; the demo presents an accessible desktop-optimization overview below 901 CSS pixels.

Scope: preserve the visual identity while supporting narrow, zoomed, and touch layouts.

Acceptance criteria:

- Shell, navigation, headers, disclosure, filters, stat tiles, detail rails, artifact viewer, architecture flow, settings, control-plane cards, approval details, trace waterfall, drawers, and tables adapt at documented breakpoints.
- At 320, 375, 768, 1024, and 1440 CSS pixels, content is readable and primary actions remain available.
- No page-level horizontal overflow at 320/375 px; intentional data-table/code/trace overflow remains scoped and labeled.
- 200% zoom at a 1280 px viewport does not hide content or require two-dimensional page scrolling.
- Touch targets meet the chosen WCAG target-size standard or have documented spacing exceptions.
- Light and dark modes retain readable contrast; measured exceptions are fixed or documented.
- Visual regression snapshots cover representative desktop and mobile states.

Delivered commit: `fix: harden accessibility and responsive behavior`

### Phase 5 — Honest demo behavior and control-plane registry

Status: Complete. Functional demo actions landed in `feat: add functional demo actions and guided walkthrough`; registry/MCP foundations in `feat: add versioned agent and tool registry`; scoped persona authorization and durable approval work in `feat: enforce scoped authorization and durable approvals`.

Scope: make the local/external boundary explicit and implement the narrow registry, capability cards, lifecycle, and persona policy model.

Acceptance criteria:

- A persistent demo disclosure distinguishes “Functional locally” from “Simulated external system.”
- Local copy uses the Clipboard API with explicit unavailable/error feedback; local artifact download creates a real client-side file. These are labeled functional.
- Jira sync, connection tests, AI generation, external repository/PR operations, Oracle access, enterprise MCP integrations, hosted test runs, review, merge, deployment, persona identity, and remote credentials remain deterministic simulations and are labeled at the action/result level. The repository-owned toy-repository MCP slice is the only functional local protocol exception and is never contacted by the browser.
- Canned durations, test counts, “immutable,” “authenticated,” “opened,” “notified,” “environment ready,” and similar messages cannot be mistaken for observed external facts.
- Versioned stage-agent/tool manifests, lifecycle state, immutable version selection, capability cards, and provenance digests are functional and covered by schema/type tests.
- The local authorization engine enforces persona scopes, deny-by-default tool policy, self-approval prevention, and approved-version gating with inspectable reason codes.
- Registry UI is stage-bound and contains no arbitrary marketplace/catalog creation path.
- Demo reset is available and deterministic. No interaction sends a network write.
- Reducer invariants cover stage order, stale cascades, review gates, validation completion, and registry-version resolution.
- Unit and end-to-end tests cover happy and blocked paths, reset, clipboard/download, disclosure visibility, persona denial, and approved-version gating.

Suggested commit: `feat: add the governed stage-agent registry`

### Phase 6 — Approval, context, runtime, budgets, and trace evidence

Status: Scoped authorization and durable approval protocol complete in `feat: enforce scoped authorization and durable approvals`. Deterministic governed context packs are complete in `feat: add governed context packs and memory policies`; runtime gateway, budgets, and traces remain.

Scope: make a governed run explainable end to end without introducing a live external integration.

Acceptance criteria:

- Risky tool requests create durable browser-local approval envelopes and append-only state transitions; reload, expiry, separation of duties, CLI single-use execution, and reset are tested. Browser approval export/import remains intentionally deferred.
- The approval UI says that storage and identity are local/simulated and does not imply tamper resistance or shared enterprise durability.
- Context-pack manifests record inclusions, exclusions, provenance, freshness, deterministic selection rules, measured-versus-estimated size labels, and a SHA-256 digest; browser and sandbox tampering/invalidation tests pass. Complete.
- The provider-neutral gateway contract enforces agent/model/runtime/credential-reference scope locally while all provider execution remains simulated and no secret-entry UI or live endpoint exists.
- Budget preflight and iteration enforcement cover tokens, estimated cost, iterations, tool calls, retries, and time; every displayed quantity carries its measurement basis.
- Traces link workflow, policy, context, model, approval, tool, and evidence spans; deterministic fixtures export as pinned OTLP/HTTP JSON-compatible documents.
- The accessible waterfall and tabular fallback expose trace hierarchy, duration, status, and evidence links without capturing sensitive content by default.
- Reducer/domain tests and end-to-end tests cover happy, denied, approval, expired, stale-context, exhausted-budget, reset, and evidence-export paths.

Suggested commit: `feat: add governed run evidence and traceability`

### Phase 7 — Quality gates, CI, security, and supply-chain evidence

Scope: make the repository safe, predictable, and evidentiary for contributors.

Acceptance criteria:

- CI runs install, format/lint, typecheck, unit, accessibility, end-to-end smoke, build, and dependency/security checks using the lockfile.
- `npm run check` reproduces the required local checks.
- Secret scanning, SAST, dependency scanning/review, and CycloneDX JSON SBOM generation produce retained, revision-linked evidence with pinned tool versions.
- Container scanning is conditional on a produced image; with no initial-release image, the evidence is explicitly not applicable rather than passed or skipped without explanation.
- Failure, threshold, exception, unavailable, and not-applicable states remain distinct in normalized evidence and in the UI.
- Tests cover data generators, reducer transitions, routing, filters, overlays, registry/policy rules, approval journal, context digests, budgets, trace export, and the critical governed workflow.
- No runtime third-party origins are required; production CSP can use a restrictive static policy.
- Dependency update policy, supported Node version, evidence retention, and scanner exception policy are documented.
- Generated output and caches are ignored; source and public assets are intentional.
- README commands are verified from a clean checkout-equivalent install.

Suggested commit: `ci: enforce quality and supply-chain evidence`

### Phase 8 — Portfolio polish and final release

Scope: final content/design QA followed by the only authorized publication step.

Acceptance criteria:

- Copy, screenshots, diagrams, metadata, attributions, and repository navigation are coherent and free of organization- or opportunity-specific identifiers.
- Case-study proof points describe design and implementation evidence, not invented adoption or business outcomes.
- Control-plane screens remain visibly connected to the coding-agent workflow and contain none of the explicit initial-release exclusions.
- Production build, full check suite, link check, performance/accessibility audit, content/privacy scan, and cross-browser smoke checks pass.
- Browser QA covers all public routes, themes, breakpoints, keyboard paths, reloads, local approval persistence/reset, exports, and static-host deep links.
- Release notes document known limitations and explicitly list every simulated integration and every measured/estimated evidence basis.
- Only after all checks pass: publish to the selected static Git-backed host, verify the public URL, and tag the release.

Suggested commit: `release: publish portfolio case study`

## File migration map

| Current path                           | Target path                                                                       | Action and reason                                                                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `readme.md`                            | `README.md`                                                                       | Rewrite as the public repository entry point; use conventional casing.                                                                    |
| `workbench/README.md`                  | `docs/demo-guide.md` plus `README.md`                                             | Preserve useful walkthrough/limitations; remove submission- and audience-specific language.                                               |
| `workbench/AI Delivery Workbench.html` | `demo/index.html`                                                                 | Replace CDN/Babel script chain with a normal build entry.                                                                                 |
| `workbench/app.jsx`                    | `src/demo/App.tsx`, `src/demo/main.tsx`                                           | Split mount from typed app composition.                                                                                                   |
| `workbench/store.jsx`                  | `src/demo/state/`                                                                 | Separate typed state, reducer, actions, and selectors; add transition tests.                                                              |
| `workbench/data.js`                    | `src/demo/data/fixtures.ts`, `src/demo/control-plane/registry/`                   | Type and sanitize synthetic fixtures; promote stage/tool policy into versioned local manifests; eliminate `window.WBData`.                |
| `workbench/content.js`                 | `src/demo/data/` and `src/demo/control-plane/evidence/`                           | Split deterministic generators by concern; keep simulated content separate from normalized evidence metadata.                             |
| New control-plane domain               | `src/demo/control-plane/`                                                         | Add original typed modules for registry, policy, approval journal, context manifests, budgets, gateway contract, telemetry, and evidence. |
| New control-plane UI                   | `src/demo/screens/ControlPlaneScreen.tsx`, contextual run components              | Keep registry/approval overview compact and attach context, budgets, traces, and evidence to the coding run.                              |
| New interoperability fixtures          | `tests/fixtures/telemetry/`, `tests/fixtures/evidence/`                           | Validate pinned OTLP export and normalized evidence without copying third-party schemas into product code.                                |
| `workbench/primitives.jsx`             | `src/demo/components/`                                                            | Replace custom clickable elements with semantic, accessible components.                                                                   |
| `workbench/icons.jsx`                  | `src/shared/Icon.tsx`                                                             | Keep the existing local SVG identity with typed icon names.                                                                               |
| `workbench/shell.jsx`                  | `src/demo/components/AppShell.tsx`, `Dialog.tsx`, `Drawer.tsx`, `ToastRegion.tsx` | Isolate landmarks and accessible overlays.                                                                                                |
| `workbench/screen-*.jsx`               | `src/demo/screens/*.tsx`                                                          | One typed module per existing screen.                                                                                                     |
| `workbench/workbench.css`              | `src/demo/demo.css` plus component styles as needed                               | Preserve identity, remove brittle inline layout rules, add responsive states.                                                             |
| `tokens/*.css`                         | `src/styles/tokens/*.css`                                                         | Retain the Cleanroom token system; audit unused and inaccessible values.                                                                  |
| `tokens/fonts.css`                     | `src/styles/tokens/fonts.css` or removal                                          | Eliminate runtime Google Fonts; self-host only with documented license or use fallbacks.                                                  |
| `styles.css`                           | `src/styles/global.css`                                                           | Keep reset/shared utilities as a normal build import.                                                                                     |
| `assets/logo-mark*.svg`                | `public/assets/` or `src/assets/`                                                 | Reuse the original mark; choose public vs imported based on usage.                                                                        |
| `guidelines/*.card.html`               | `docs/design-system/` or delete                                                   | Retain only if converted into useful public documentation; otherwise rely on the original tag.                                            |
| `SKILL.md`                             | Delete or rewrite only if a maintained skill remains in scope                     | Current skill packaging is unrelated to the public runtime and overstates production use.                                                 |
| `_ds_bundle.js`                        | Delete after tag verification                                                     | Generated 211,787-byte duplicate bundle; not a source backup.                                                                             |
| `_ds_manifest.json`                    | Delete after tag verification                                                     | Generated one-line design-system manifest; replace with maintainable docs if needed.                                                      |
| `_adherence.oxlintrc.json`             | Delete or replace with real lint config                                           | Generated configuration has no installed runner or documented command.                                                                    |
| `.gitignore`                           | `.gitignore`                                                                      | Keep; add Node/build/test artifacts and private-note rules as tooling lands.                                                              |
| `private/README.md`                    | `private/README.md`                                                               | Keep tracked as the notice; ignore every other private note.                                                                              |
| New public narrative routes            | `index.html`, `writing/governing-ai-assisted-delivery/index.html`, `404.html`     | Keep substantive content static and isolate the React bundle to `/demo/`.                                                                 |
| New public configuration and metadata  | `src/site/`                                                                       | Centralize optional public identity/links and generate canonical-aware metadata, discovery files, and synchronized source excerpts.       |

## Cross-phase verification policy

Each phase must end with one focused commit and a report using the template in `AGENTS.md`. At minimum, run every check that exists at that point plus `git diff --check`. Browser claims require a manual observation. If a check cannot run, report the exact missing command, dependency, credential, or environment condition; do not substitute a claim.

Control-plane evidence receives the same treatment: a value without a known basis is `not_available`; a simulated fixture is not measured; a skipped scanner is not passed; and browser-local persistence is not an authenticated enterprise audit record.
