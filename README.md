# AI Delivery Workbench

AI Delivery Workbench is a clean-room, front-end-only case study for a governed AI-assisted software delivery workflow. The repository contains a statically renderable case-study page and a separate React workbench demo.

The demo uses synthetic fixtures. Jira, GitHub, AI, Oracle, MCP, deployment, test execution, and provider operations are simulated; no real external system is contacted. Navigation, filters, theme selection, stage transitions, review decisions, and evidence state are functional locally in the browser.

## Run locally

Use Node.js 22 LTS; the exact supported version is recorded in `.nvmrc`.

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. The case study is at `/` and the interactive demo is at `/demo/`.

Create and inspect a production build with:

```bash
npm run build
npm run preview
```

Run the current local CI-equivalent checks with:

```bash
npm run check
```

The E2E and dedicated accessibility commands currently report that their harnesses are intentionally deferred; they are not included in `npm run check` until those harnesses exist. See [docs/contributor-commands.md](docs/contributor-commands.md) for the complete command reference.

## Project structure

```text
index.html                         static case-study entry
demo/index.html                    interactive React demo entry
src/case-study/                    case-study-only styles
src/demo/components/               workbench shell and UI primitives
src/demo/screens/                  primary workflow screens
src/demo/state/                    typed reducer and local actions
src/demo/data/                     synthetic fixtures and content generators
src/demo/control-plane/            typed seams for the planned focused control plane
src/shared/                        local, typed SVG icon system
src/styles/tokens/                 shared semantic design tokens
public/assets/                     local logo assets
tests/                             unit and application smoke tests
docs/                              audit, architecture decisions, and upgrade plan
```

The build uses React 18, strict TypeScript, and Vite. It has no browser-side Babel, development CDN, runtime font request, backend, analytics, or credential input. The design system uses operating-system UI and monospace font stacks, so no font binaries or separate font licenses are distributed.

## Clean-room and disclosure boundary

- All issues, people, repositories, artifacts, approvals, checks, and validation evidence are fictional demo data.
- The repository contains no employer/client code, prompts, schemas, screenshots, repository names, customer names, credentials, or private employment material.
- The public prototype does not claim real identity, durable shared audit storage, live integrations, production execution, or production reliability.
- The original prototype remains available through the Git tag `original-prototype-v0.9.0`; superseded generated exports are not kept in the active source tree.

The transformation plan and current scope are documented in [docs/portfolio-upgrade-plan.md](docs/portfolio-upgrade-plan.md).
