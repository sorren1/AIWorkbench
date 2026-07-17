# Portfolio upgrade plan

Status: approved implementation plan
Baseline: commit `13d01bb` (`Initial commit`)
Prepared: 2026-07-16

## Outcome

The finished repository will be a static-host-compatible public project with two deliberate surfaces:

1. `/` — a semantic, statically rendered case study that explains the problem, boundaries, architecture, decisions, controls, and lessons without requiring JavaScript.
2. `/demo/` — the existing AI Delivery Workbench, migrated to strict TypeScript and conventional React modules, with deterministic local interactions and explicit simulated/functional labeling.

There will be no backend. Vite will build both HTML entries and fingerprint their local assets. The case study will use plain HTML and CSS with optional progressive enhancement; React will load only on the demo route.

## Architecture target

```text
index.html                         static public case study source
demo/index.html                    demo entry document
src/
  case-study/
    case-study.css                 case-study-only layout and responsive rules
    enhance.ts                     optional theme/navigation enhancement
  demo/
    main.tsx                       React mount
    App.tsx                        workbench shell
    components/                    semantic reusable controls and overlays
    screens/                       queue, issue, artifacts, PR, validation, architecture, settings
    state/                         typed reducer, actions, selectors
    data/                          typed synthetic fixtures and artifact generators
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
  unit/                            reducer, selectors, deterministic generators
  accessibility/                   component/page axe coverage
  e2e/                             critical keyboard and demo flows
.github/workflows/ci.yml           reproducible pull-request checks
```

Build properties:

- Vite multi-page application with `index.html` and `demo/index.html` inputs.
- Relative or repository-subpath-safe asset URLs so the output works on a Git-backed static host.
- Strict TypeScript with `noEmit`, React JSX compilation, and no ambient `window` application globals.
- React production bundle only on `/demo/`; the root case study remains useful with scripts blocked.
- Local assets only at runtime. Font files may be self-hosted only after their license and attribution are recorded; otherwise use the existing system fallbacks.
- No client router dependency is required. Demo screen state can remain reducer-driven because `/demo/` is the public route boundary.

The rationale and rejected alternatives are recorded in `docs/decision-log.md`.

## Delivery phases

### Phase 0 — Baseline and transformation plan

Scope: this documentation-only phase.

Acceptance criteria:

- Repository, runtime, network, content, state, control, accessibility, responsiveness, and hygiene findings are recorded with file references.
- The target architecture and migration map are explicit.
- Repository operating rules and current/target commands are in `AGENTS.md`.
- `private/` contents are ignored while `private/README.md` remains tracked.
- Product behavior and visual styles are unchanged.
- `git diff --check` passes and the browser baseline is recorded.

Commit: `docs: establish portfolio transformation plan`

### Phase 1 — Preservation, reproducible toolchain, and typed migration

Scope: establish the build and migrate the existing prototype without intentional feature or visual redesign.

Acceptance criteria:

- Verify `original-prototype-v0.9.0` points to the original implementation. Because the tag is absent at baseline, create it at `13d01bb` before deleting legacy files and document that correction.
- Add `package.json`, a committed lockfile, strict TypeScript configurations, Vite MPA configuration, and reproducible scripts.
- Create static root `index.html` and separate `demo/index.html` entries.
- Migrate React, state, fixtures, and screens to `.ts`/`.tsx` modules with typed public boundaries.
- Remove browser Babel, UMD React development builds, script-order coupling, and `window.*` exports.
- Preserve the current desktop visual identity and demo state behavior closely enough for side-by-side review.
- Remove superseded generated bundle/manifest artifacts only after the preservation tag is verified.
- `npm ci`, lint, typecheck, unit smoke tests, and production build pass.
- Built output serves successfully at `/` and `/demo/` with no browser console errors.

Suggested commit: `build: establish typed static application shell`

### Phase 2 — Public narrative, disclosures, and repository identity

Scope: turn the root surface and repository documentation into a credible public case study.

Acceptance criteria:

- Root case study explains the problem, design principles, architecture, workflow, functional demo boundary, tradeoffs, and future production requirements.
- The approved professional-context claim appears at most where useful, verbatim, in a clearly separated “Professional context” section; no other experience or outcome claims are introduced.
- The named-company sentence at baseline `workbench/README.md:28` and all interview/target-company language are removed.
- Synthetic people and fixtures are explicitly identified as fictional demo data; no text implies real users or customers.
- Functional local behavior and simulated external operations are explained in both README and UI copy.
- Standard public files exist as appropriate: `README.md`, `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, and attribution notices.
- Add useful metadata: descriptive title, meta description, canonical strategy, favicon, Open Graph/Twitter cards, and static-host-safe `robots.txt`/sitemap if a canonical public URL is known. Do not invent a URL.
- Content/privacy scans and production build pass.

Suggested commit: `docs: publish the public case study narrative`

### Phase 3 — Semantic interaction and accessibility

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

Suggested commit: `fix: make the workbench keyboard and screen-reader accessible`

### Phase 4 — Responsive and resilient layout

Scope: preserve the visual identity while supporting narrow, zoomed, and touch layouts.

Acceptance criteria:

- Shell, navigation, headers, disclosure, filters, stat tiles, detail rails, artifact viewer, architecture flow, settings, drawers, and tables adapt at documented breakpoints.
- At 320, 390, 768, 1024, and 1440 CSS pixels, content is readable and primary actions remain available.
- No page-level horizontal overflow at 320/390 px; intentional data-table/code overflow remains scoped and labeled.
- 200% zoom at a 1280 px viewport does not hide content or require two-dimensional page scrolling.
- Touch targets meet the chosen WCAG target-size standard or have documented spacing exceptions.
- Light and dark modes retain readable contrast; measured exceptions are fixed or documented.
- Visual regression snapshots cover representative desktop and mobile states.

Suggested commit: `fix: make the case study and demo responsive`

### Phase 5 — Honest functional demo boundary and deterministic behavior

Scope: make working local interactions genuinely functional and simulated operations unmistakable.

Acceptance criteria:

- A persistent demo disclosure distinguishes “Functional locally” from “Simulated external system.”
- Local copy uses the Clipboard API with a fallback/error state; local artifact download creates a real client-side file. These are labeled functional.
- Jira sync, connection tests, AI generation, repository/PR operations, Oracle/MCP access, test runs, review, merge, and deployment remain deterministic simulations and are labeled at the action/result level.
- Canned durations, test counts, “immutable,” “authenticated,” “opened,” “notified,” “environment ready,” and similar messages cannot be mistaken for observed external facts.
- Demo reset is available and deterministic. No interaction sends a network write.
- Reducer invariants cover stage order, stale cascades, review gates, and validation completion.
- Unit and end-to-end tests cover happy paths, blocked paths, reset, clipboard/download, and disclosure visibility.

Suggested commit: `feat: clarify and strengthen the local demo behavior`

### Phase 6 — Quality gates, CI, security, and maintainability

Scope: make the repository safe and predictable for contributors.

Acceptance criteria:

- CI runs install, format/lint, typecheck, unit, accessibility, end-to-end smoke, build, and dependency/security checks using the lockfile.
- `npm run check` reproduces the required local checks.
- Tests cover data generators, reducer transitions, routing, filters, overlays, and the critical governed workflow.
- No runtime third-party origins are required; production CSP can use a restrictive static policy.
- Dependency update policy and supported Node version are documented.
- Generated output and caches are ignored; source and public assets are intentional.
- README commands are verified from a clean checkout-equivalent install.

Suggested commit: `ci: enforce project quality gates`

### Phase 7 — Portfolio polish and final release

Scope: final content/design QA followed by the only authorized publication step.

Acceptance criteria:

- Copy, screenshots, diagrams, metadata, attributions, and repository navigation are coherent and free of employer/target-company identifiers.
- Case-study proof points describe design and implementation evidence, not invented adoption or business outcomes.
- Production build, full check suite, link check, performance/accessibility audit, and cross-browser smoke checks pass.
- Browser QA covers all public routes, themes, breakpoints, keyboard paths, reloads, and static-host deep links.
- Release notes document known limitations and explicitly list every simulated integration.
- Only after all checks pass: publish to the selected static Git-backed host, verify the public URL, and tag the release.

Suggested commit: `release: publish portfolio case study`

## File migration map

| Current path | Target path | Action and reason |
|---|---|---|
| `readme.md` | `README.md` | Rewrite as the public repository entry point; use conventional casing. |
| `workbench/README.md` | `docs/demo-guide.md` plus `README.md` | Preserve useful walkthrough/limitations, remove interview and named-company language. |
| `workbench/AI Delivery Workbench.html` | `demo/index.html` | Replace CDN/Babel script chain with a normal build entry. |
| `workbench/app.jsx` | `src/demo/App.tsx`, `src/demo/main.tsx` | Split mount from typed app composition. |
| `workbench/store.jsx` | `src/demo/state/` | Separate typed state, reducer, actions, and selectors; add transition tests. |
| `workbench/data.js` | `src/demo/data/fixtures.ts` | Type and sanitize synthetic fixtures; eliminate `window.WBData`. |
| `workbench/content.js` | `src/demo/data/artifacts.ts`, `pr.ts`, `validation.ts`, `logs.ts` | Split deterministic generators by concern and test them. |
| `workbench/primitives.jsx` | `src/demo/components/` | Replace custom clickable elements with semantic, accessible components. |
| `workbench/icons.jsx` | `src/shared/Icon.tsx` | Keep the existing local SVG identity with typed icon names. |
| `workbench/shell.jsx` | `src/demo/components/AppShell.tsx`, `Dialog.tsx`, `Drawer.tsx`, `ToastRegion.tsx` | Isolate landmarks and accessible overlays. |
| `workbench/screen-*.jsx` | `src/demo/screens/*.tsx` | One typed module per existing screen. |
| `workbench/workbench.css` | `src/demo/demo.css` plus component styles as needed | Preserve identity, remove brittle inline layout rules, add responsive states. |
| `tokens/*.css` | `src/styles/tokens/*.css` | Retain the Cleanroom token system; audit unused and inaccessible values. |
| `tokens/fonts.css` | `src/styles/tokens/fonts.css` or removal | Eliminate runtime Google Fonts; self-host only with documented license or use fallbacks. |
| `styles.css` | `src/styles/global.css` | Keep reset/shared utilities as a normal build import. |
| `assets/logo-mark*.svg` | `public/assets/` or `src/assets/` | Reuse the original mark; choose public vs imported based on usage. |
| `guidelines/*.card.html` | `docs/design-system/` or delete | Retain only if converted into useful public documentation; otherwise rely on the original tag. |
| `SKILL.md` | Delete or rewrite only if a maintained skill remains in scope | Current skill packaging is unrelated to the public runtime and overstates production use. |
| `_ds_bundle.js` | Delete after tag verification | Generated 211,787-byte duplicate bundle; not a source backup. |
| `_ds_manifest.json` | Delete after tag verification | Generated one-line design-system manifest; replace with maintainable docs if needed. |
| `_adherence.oxlintrc.json` | Delete or replace with real lint config | Generated configuration has no installed runner or documented command. |
| `.gitignore` | `.gitignore` | Keep; add Node/build/test artifacts and private-note rules as tooling lands. |
| `private/README.md` | `private/README.md` | Keep tracked as the notice; ignore every other private note. |

## Cross-phase verification policy

Each phase must end with one focused commit and a report using the template in `AGENTS.md`. At minimum, run every check that exists at that point plus `git diff --check`. Browser claims require a manual observation. If a check cannot run, report the exact missing command, dependency, credential, or environment condition; do not substitute a claim.
