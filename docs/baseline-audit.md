# Baseline audit

Audit date: 2026-07-16
Repository root: `D:\workbench`
Baseline commit: `13d01bb` (`Initial commit`)
Worktree at audit start: clean on `main`

## Executive findings

The prototype has a distinctive, coherent visual system and a broad deterministic demo flow, but it is not yet a maintainable public project. It is a source-ordered browser app with no package manifest, lockfile, compiler, production bundle, tests, or CI. React development builds and Babel execute from CDNs in the browser. The only entry point is a nested, space-containing submission-specific HTML file.

The highest-risk public-project gaps are:

1. The expected preservation tag `original-prototype-v0.9.0` does not exist. `git show-ref --tags` returned no tags. The original commit remains in Git history, but the named safety reference must be created at `13d01bb` before legacy deletion.
2. `workbench/README.md:28` contains an audience-specific organization reference. Submission- and role-specific wording appears throughout the repository.
3. Most custom navigation and selection controls are mouse-only `div`/`tr` elements. Modal and drawer overlays have no dialog or focus behavior.
4. There are no responsive rules. At a 390 px browser viewport the fixed sidebar consumes 248 px, the main region begins at x=248, the header is only 142 px wide, and the document becomes 741 px wide.
5. Many simulated states are presented with production-like facts (“tests passed,” “authenticated,” “immutable,” PR opened, environment ready) whose local-only nature is not always adjacent to the claim.
6. The repository tracks a 211,787-byte generated bundle and a 24,004-byte one-line manifest that duplicate source rather than providing a production build.

## Repository inventory

### Public/source material

| Area               | Files                                                                                                    | Finding                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Root documentation | `readme.md`, `SKILL.md`, `workbench/README.md`                                                           | Design-system/submission framing rather than a public case study. `readme.md` uses nonstandard casing.                  |
| Entry point        | `workbench/AI Delivery Workbench.html`                                                                   | Loads CSS, fixture scripts, 12 JSX scripts in order, and an inline Babel script.                                        |
| Workbench source   | `workbench/app.jsx`, `store.jsx`, `shell.jsx`, `primitives.jsx`, seven `screen-*.jsx` files, `icons.jsx` | Component-structured React, but no imports/exports; every module relies on ambient globals and script order.            |
| Fixtures/content   | `workbench/data.js`, `workbench/content.js`                                                              | Ten synthetic issues, eight workflow stages, settings/MCP/architecture fixtures, artifact/PR/validation/log generators. |
| Styling            | `workbench/workbench.css`, `styles.css`, `tokens/*.css`                                                  | Coherent Cleanroom system; desktop-only application layout and extensive inline screen grids.                           |
| Assets             | `assets/logo-mark.svg`, `assets/logo-mark-mono.svg`                                                      | Small original local SVG marks.                                                                                         |
| Design cards       | `guidelines/*.card.html`                                                                                 | Four token specimen cards for colors, type, radius/elevation. Not linked from the runtime.                              |

### Generated/tool-owned material

| File                       |          Size | Finding                                                                                                                                     |
| -------------------------- | ------------: | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `_ds_bundle.js`            | 211,787 bytes | Header identifies `@ds-bundle` format 3 and source hashes. It transpiles and duplicates all workbench sources but is not loaded by the app. |
| `_ds_manifest.json`        |  24,004 bytes | One-line generated design-system manifest with cards, token metadata, theme, and font records.                                              |
| `_adherence.oxlintrc.json` |  10,219 bytes | Generated lint/adherence configuration, but there is no installed runner or command.                                                        |

### Missing project infrastructure

No `package.json`, lockfile, `tsconfig`, bundler configuration, test directory, coverage configuration, `.github/` workflows, license, security policy, contributing guide, code of conduct, changelog, or release configuration exists. There is no root public `index.html`.

## Runtime and dependency audit

### Current boot path

`workbench/AI Delivery Workbench.html:23-50`:

1. Downloads `react@18.3.1` development UMD from unpkg.
2. Downloads `react-dom@18.3.1` development UMD from unpkg.
3. Downloads `@babel/standalone@7.29.0` from unpkg.
4. Loads local `data.js` and `content.js` into `window.WBData`.
5. Loads each `.jsx` file as `type="text/babel"` in a required order.
6. Polls the DOM every 60 ms until `.wb-app` exists, then removes the boot splash.

The CDN scripts use pinned versions and SRI, which is better than unpinned remote code, but the runtime is still a development toolchain in the browser. The browser emitted Babel’s production warning during the audit.

### Network requests

Static inspection found no `fetch`, `XMLHttpRequest`, WebSocket, beacon, form action, or external write path in application source. Application state changes are local reducer operations and timers (`workbench/store.jsx:37-83`, `93-138`).

The page is not offline:

- React, ReactDOM, and Babel are fetched from `unpkg.com` (`workbench/AI Delivery Workbench.html:24-26`).
- Hanken Grotesk and JetBrains Mono CSS/font files are fetched from Google Fonts (`tokens/fonts.css:3-8`).
- `readme.md:69-70` describes the icon set as offline/zero-network, which is true only of icons and can be misread as applying to the whole prototype.
- `workbench/README.md:52-55` says “no external calls,” then says React and Babel load from a CDN. This needs a runtime-vs-integration distinction.

### Current run instructions

`workbench/README.md:50-63` says to open the HTML file directly or run `npx serve .`. The latter is not backed by a package manifest or pinned dependency and may download a package. There is no production build command.

## Design-system inventory

The visual identity is worth preserving:

- Base color ramps: cool slate neutrals, azure accent, safe green, warning amber, danger red, secure violet (`tokens/colors.css:6-61`).
- Semantic light/dark aliases for surfaces, borders, text, accent, status, overlay, and focus (`tokens/semantic.css:7-128`).
- Typography: Hanken Grotesk and JetBrains Mono roles, weights 400-700, 11-76 px scale, line-height and tracking roles (`tokens/typography.css:7-52`).
- Spacing: 4 px-based scale plus 1240 px container, 720 px prose, 248 px sidebar, 56 px topbar (`tokens/spacing.css:5-32`).
- Radius/elevation: 3-20 px technical radii, pill radius, five shadow levels, 3 px focus ring (`tokens/radius.css:6-41`).
- Motion: 80-480 ms durations and controlled easing (`tokens/motion.css:6-25`).
- Base layer: reset, type defaults, global focus outline, and thin scrollbars (`tokens/base.css:6-73`).
- Runtime styles: cards, badges, tables, filters, timeline, overlays, toasts, code/artifact views, and utility classes (`workbench/workbench.css`).

Issues to address without replacing the identity:

- `tokens/motion.css:4` says reduced motion is handled at component level, but no `prefers-reduced-motion` rule exists.
- Many screens hard-code layout, spacing, and color in JSX, bypassing the token intent.
- Token contrast has not yet been measured across all light/dark combinations; no compliance claim is warranted at baseline.

## State transitions and interactive controls

### State model

The reducer stores route, selected issue, cloned issues, toasts, drawer/modal state, selected artifacts, PR overrides, validation overrides, settings, busy flags, and filters (`workbench/store.jsx:20-33`). Actions support:

- Route/issue selection (`store.jsx:39-42`, `101-102`).
- Stage status changes and downstream invalidation (`store.jsx:43-56`, `111-134`).
- Toast timing, drawer/modal opening, and artifact selection (`store.jsx:57-68`, `93-109`).
- PR, validation, filter, and governance overrides (`store.jsx:69-80`, `135-138`).

Stage execution is a 1.3-second local timer by default: status becomes `run`, then `done` or `fail`; optional lifecycle and next-stage callbacks fire (`store.jsx:111-130`). The eight stage/status vocabulary and ten synthetic issue starting states are in `workbench/data.js:18-161`.

### Functional local behaviors

These actions genuinely work in the browser, but only in memory unless noted:

- Screen navigation and issue selection.
- Search, lifecycle/surface, and chip filters.
- Light/dark preference persisted in `localStorage` (`workbench/shell.jsx:82-88`).
- Timed stage execution, retry, redo, and stale cascades.
- Artifact selection and in-memory review status.
- In-memory PR review/checklist decisions and validation scenario/note decisions.
- Governance toggles except locked controls.
- Toast, drawer, and modal presentation.

### Simulated or dead external actions

- Jira sync (`screen-workqueue.jsx:68`) only shows a toast.
- Jira/GitHub connection, sync, refresh, and branch validation (`screen-settings.jsx:59-60`, `89-91`) return canned toasts, including a fabricated 142 ms response.
- AI, Oracle, MCP, repository, branch, test, QA environment, review, merge, and deployment concepts are fixture-only.
- Mock PR creation/refresh/reviewer decisions (`screen-github.jsx:19-31`) change local state and show canned provider language.
- Verify results and logs are generated strings, not executed tests (`content.js:460-488`).
- Artifact Copy and Download (`screen-artifacts.jsx:72-73`) do not use the clipboard or create a download; they only toast.
- “Immutable” evidence is mutable/in-memory and lost on reload (`screen-validation.jsx:42`, `186`; `content.js:487`; `data.js:261`).

The global header disclosure (`data.js:11-13`, `shell.jsx:109-112`) and Settings banner (`screen-settings.jsx:38-42`) are good foundations. They are not enough for every action: terms such as “authenticated,” “opened,” “author notified,” “tests passed,” “environment readiness Ready,” “recorded immutably,” and “merge-eligible” appear near local simulations without consistent adjacent labels (`screen-settings.jsx:89`; `screen-github.jsx:21,25`; `screen-issue.jsx:17`; `screen-validation.jsx:37,181,186`).

## Branding, privacy, and disclosure text

### Organization-specific identifier

- `workbench/README.md:28`: an explicit audience-specific organization sentence. It must be removed without reproducing the identifier elsewhere.

No other organization- or opportunity-specific name was found by the case-insensitive repository scan. Synthetic product/provider names (Jira, GitHub, Angular, .NET, Oracle, Claude, Codex, MCP) describe mocked technical context and must remain explicitly simulated where appropriate.

### Submission- and role-specific language

- `readme.md:3-9`: calls the project a one-off submission prototype and explains the brief.
- `workbench/README.md:3-7`, `13-14`, `50-71`, `75-91`: repeated submission, role-specific, presentation-oriented, and demo-script framing.
- `workbench/AI Delivery Workbench.html:6`: submission-specific page title.
- `workbench/data.js:3-5`, `11-15`: submission disclosure and synthetic persona/role.
- `workbench/content.js:156`: one-off demonstration wording.
- `workbench/shell.jsx:122`, `177`: organization-assurance and submission wording.
- `workbench/screen-architecture.jsx:45`, `78`, `91`: first-person productionization, role-level discussion, and organization-assurance wording.

The clean-room assurances should be rewritten as neutral public-project provenance. The author-like synthetic persona and all abbreviated team members must be clearly presented as fictional fixtures, not users or colleagues (`data.js:15`, `60-161`; `content.js:327-435`).

### Professional claims

No approved professional outcome claim exists in the baseline. No adoption, revenue, award, or real-user claim was found. The public rewrite must not infer any. If the approved claim is added, it must be verbatim and visually separated from prototype capabilities.

## Accessibility audit

### Critical keyboard/semantic defects

- Sidebar navigation items are clickable `div`s, not links/buttons, and have no keyboard support or current-page semantics (`workbench/shell.jsx:53-65`).
- Queue filter chips and Clear are clickable `div`s with no role, focus, or key behavior (`screen-workqueue.jsx:19-22`, `97-105`).
- Every work-queue row is a clickable `tr` with no focus or key behavior (`screen-workqueue.jsx:123-144`). The nested Next Action button also creates competing row/button interaction semantics.
- Timeline expanders are clickable `div`s without buttons, `aria-expanded`, or controls relationships (`screen-issue.jsx:78-112`).
- Latest-artifact rows and artifact-list items are clickable `div`s without keyboard semantics (`screen-issue.jsx:254-261`; `screen-artifacts.jsx:43-59`).
- `Toggle` uses `role="switch"` but is an unfocusable `div` with click-only behavior (`primitives.jsx:107-113`).
- `Check` is an unlabeled semantic `div`, not a checkbox, and exposes neither checked nor disabled state (`primitives.jsx:115-121`).
- Tabs are clickable `div`s with no tablist/tab/tabpanel roles, selected state, focus management, or arrow keys (`primitives.jsx:124-136`).

### Overlay and announcement defects

- Drawer and modal are generic `div`s without `role="dialog"`, accessible labels, `aria-modal`, initial focus, focus trap, background inertness, Escape close, or trigger focus return (`shell.jsx:158-217`).
- Scrims are click-only dismissal elements (`shell.jsx:168`, `201`).
- Toast container/items have no status/alert role or live region, and the toast close button has no accessible name (`shell.jsx:136-155`).
- Browser verification showed modal focus remained on “About this prototype” behind the overlay and drawer focus remained on “View logs.” Escape left both overlays open.

### Structure, labels, and status

- `App` has no `<main>` landmark or skip link (`app.jsx:31-46`).
- Page titles and most section/card titles are `div`s rather than a structured heading hierarchy (for example `screen-workqueue.jsx:61-65`, `primitives.jsx:65-75`).
- Search, queue selects, issue selects, and tester-note input rely on placeholder/nearby text rather than programmatic labels (`screen-workqueue.jsx:78-94`; `screen-artifacts.jsx:123-130`; `screen-github.jsx:217-224`; `screen-validation.jsx:54-61`, `156-159`).
- The work queue has no caption or explicit navigation instructions for assistive technology (`screen-workqueue.jsx:111-149`).
- `Progress` is a visual `div` only, with no progressbar semantics or value text (`primitives.jsx:161-163`).
- Toast and running-stage updates are not announced.
- Focus styling exists globally and on native controls (`tokens/base.css:50-53`; `workbench/workbench.css:118`, `249`, `259`), but it cannot help controls that are not focusable.
- Icons are correctly hidden from assistive technology when decorative (`icons.jsx:90-99`); status badges generally include text, so they do not rely on color alone.

No automated accessibility runner exists, and color contrast has not been measured. These remain test gaps rather than claimed failures/passes.

## Responsiveness audit

`workbench/workbench.css` contains no media or container queries. Key failures:

- The shell always uses a 248 px sidebar and `100vh` row (`workbench/workbench.css:11-15`; `tokens/spacing.css:27-32`).
- `body { overflow: hidden; }` makes the inner `.wb-content` scroller the only vertical path (`workbench/workbench.css:6-8`, `95`).
- The header disclosure is `white-space: nowrap` (`workbench/workbench.css:84-90`).
- The four-stat grid never collapses (`workbench/workbench.css:181-185`; `screen-workqueue.jsx:71-76`).
- Major screen layouts use non-responsive inline grids: issue detail (`screen-issue.jsx:183`), artifacts (`screen-artifacts.jsx:36`, `65`), PR (`screen-github.jsx:66`), validation (`screen-validation.jsx:84`), architecture (`screen-architecture.jsx:54`, `75`), and MCP settings (`screen-settings.jsx:142`).
- Issue selectors are fixed at 230 px (`screen-artifacts.jsx:125`; `screen-github.jsx:219`; `screen-validation.jsx:56`).
- Artifact preview uses sticky side columns and a viewport-derived max height (`screen-artifacts.jsx:38`, `75`, `83`).
- The queue table has scoped horizontal scrolling, which is appropriate for wide data, but at narrow widths its containing main column is itself crushed.

Manual 390×844 verification measured `innerWidth=390`, `documentElement.scrollWidth=741`, sidebar width 248, main left 248, header width 142, and a visible table wrapper width of only 78 px for 1,619 px of table content. The disclosure extended from x=284 to x=663.

## Tests, CI, security, SEO, and hygiene

### Tests and CI

- No unit, component, accessibility, integration, end-to-end, visual, or link tests.
- No typecheck, lint command, format command, build command, or clean install.
- No CI workflow or branch-quality evidence.
- The reducer and deterministic generators are testable seams but currently untested.

### Security and dependency hygiene

- No dependency manifest means no reproducible audit or update workflow.
- Runtime third-party code and fonts require external origins.
- No Content Security Policy or other deploy-time headers are documented.
- Browser-side Babel typically requires policies incompatible with a restrictive production posture.
- JSON highlighting uses `dangerouslySetInnerHTML`, but it first escapes `&`, `<`, and `>` before injecting controlled span markup (`primitives.jsx:175-190`); no fixture-to-HTML bypass was found in that path.
- A targeted source scan found no `.env` file or obvious credential/token/private-key literal. This is a limited static observation, not a formal secret scan.

### SEO and public presentation

- No root landing page.
- The only title uses submission-specific prototype framing (`workbench/AI Delivery Workbench.html:6`).
- No meta description, canonical, favicon, Open Graph, Twitter card, structured data, robots file, or sitemap.
- No static case-study prose is available at `/`; all workbench content depends on JavaScript and remote CDNs.
- No social preview asset or screenshot provenance/alt-text strategy.

### Repository hygiene

- Original prototype tag expected by the task is absent.
- One initial commit only; generated artifacts are tracked alongside source.
- `readme.md` casing is unconventional for Git hosts.
- `.gitignore` covers common OS/editor/dependency/build artifacts but did not initially cover private review notes.
- No public license or contribution/security guidance.

## Browser baseline verification

The baseline was served locally with Python and inspected in the in-app browser.

Verified successful behavior:

- Work Queue rendered at the local URL with ten synthetic issues and no application console error.
- Search for `FIN-1150` reduced the table from ten rows to one.
- Clicking the filtered row opened issue `FIN-1150`.
- Theme control changed the document theme to dark.
- “Run Verify” changed local state to Running, then Completed after the timer, emitted `evidence.md`, and enabled the next stage.
- Sync Jira produced the expected simulated toast.
- Modal and log drawer opened and closed through their visible buttons.

Verified defects:

- Browser logged Babel’s warning that in-browser transformation is not for production.
- Toast had no `role` or `aria-live` region.
- Modal/drawer lacked dialog semantics, did not move focus, and did not close on Escape.
- 390 px viewport produced severe fixed-sidebar clipping and page-level horizontal overflow as measured above.

## Recommended priority

Follow `docs/portfolio-upgrade-plan.md` in order. Do not attempt visual polish on the global-script runtime. First secure the original tag and migrate to the typed two-entry build; then sanitize narrative/disclosures; then fix semantics and responsiveness; only after those foundations should local functional enhancements, CI, and release polish land.
