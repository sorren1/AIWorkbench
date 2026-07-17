# AI Delivery Workbench

> A governed, human-in-the-loop control plane for AI-assisted software delivery.

AI Delivery Workbench is an independent engineering portfolio project about the controls around coding agents: authorization, context selection, tool boundaries, human approval, workflow state, budgets, traceability, and evidence. The repository pairs a statically rendered case study with a separate interactive React demo.

[Open the case study](./index.html) · [Read the technical article](writing/governing-ai-assisted-delivery/index.html) · [Read the interactive demo guide](docs/demo-guide.md) · [Review the architecture decisions](docs/decision-log.md)

## What this project demonstrates

The workbench models an eight-stage delivery chain:

`Seed → Intake → Spec → Plan → Change Targets → Implement → Verify → PR Review`

Each stage produces or consumes explicit artifacts. Downstream state becomes stale when an upstream stage changes. Risky transitions remain gated by a human decision, and validation evidence stays associated with the selected issue and pull-request fixture.

The focused control-plane direction extends that workflow with typed domain seams for versioned stage agents and tools, capability cards, lifecycle approval, persona-scoped policy, context-pack provenance, runtime and budget policy, trace spans, approval events, and evidence envelopes. It deliberately remains a coding-agent delivery case study rather than a general agent marketplace.

## Evidence and claim categories

Every visible value belongs to one category:

- **Functional in this repository:** navigation and shareable deep links, filters, versioned theme preference, deterministic scenario loading and reset, the guided tour, reducer-backed workflow transitions, stale-state propagation, local review decisions, artifact copy/download, architecture and validation-evidence exports, deterministic artifact rendering, and the static production build.
- **Synthetic demo fixture:** every persona, issue, repository, branch, pull request, check, log, duration, test result, metric, external integration result, and provider response shown in the workbench.
- **Professional context:** the single statement in the separate section below. It is not evidence about the public prototype.

External Jira, GitHub, AI/model, database, MCP-style, deployment, test-execution, and review operations are simulated. No demo interaction contacts those systems.

## Architecture

The design separates four responsibilities:

1. **Control plane** — workflow state, authorization policy, registry lifecycle, approvals, budgets, and audit references.
2. **Execution plane** — isolated workspaces, stage runtimes, model adapters, and bounded tool calls.
3. **Context plane** — issue, repository, documentation, schema, and prior-decision context packs with provenance.
4. **Validation plane** — acceptance coverage, review decisions, evidence, and release gates.

Jira, GitHub, Angular, .NET, and Oracle form one illustrative adapter set behind vendor-neutral issue, repository, UI, service, and database boundaries. They preserve technical specificity without representing a required or organization-specific environment.

## Run locally

Use Node.js 22 LTS; `.nvmrc` records the verified version.

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. The static case study is at `/`; the interactive portfolio prototype is at `/demo/`.
Append `?walkthrough=1` to `/demo/` to open the accessible 5–8 minute guided walkthrough.

Create and inspect the production build with:

```bash
npm run build
npm run preview
```

Run the current local CI-equivalent checks with:

```bash
npx playwright install chromium
npm run check
```

`npm run check` includes strict type checking, linting, formatting, unit tests, the production build, and Playwright browser tests. Run `npm run test:a11y` for the focused axe suite or `npm run test:e2e` for all keyboard, overlay, accessibility, and responsive browser checks. See [docs/contributor-commands.md](docs/contributor-commands.md) for the complete command reference.

## Project structure

```text
index.html                         statically rendered public case study
404.html                           static-host-compatible not-found page
demo/index.html                    interactive React demo entry
writing/                           statically rendered technical article
src/case-study/                    case-study presentation
src/site/config.ts                 typed public identity, link, canonical, and analytics configuration
src/site/metadata.ts               metadata, structured-data, robots, and sitemap generation
src/site/vitePlugin.ts             build-time link and synchronized-excerpt generation
src/demo/components/               workbench shell and UI primitives
src/demo/screens/                  delivery workflow screens
src/demo/state/                    typed reducer and local actions
src/demo/data/                     deterministic synthetic fixtures and content
src/demo/control-plane/            typed control-plane domain seams
src/shared/                        local SVG icon system
src/styles/tokens/                 shared semantic design tokens
public/assets/                     local logo assets
tests/                             unit, axe, keyboard, and responsive browser tests
docs/                              audits, provenance, decisions, and upgrade plan
```

The project uses React 18, strict TypeScript, and a static Vite multi-page build. The case study, article, and 404 page contain their substantive content without a client JavaScript bundle; React loads only on `/demo/`. Build-time generation injects configuration-driven public links, metadata, structured data, synchronized source excerpts, `robots.txt`, and `sitemap.xml`. A canonical URL, author, résumé, and contact link are intentionally omitted until public values are set in `src/site/config.ts`. The project has no browser-side Babel, development CDN, runtime font request, backend, analytics, or credential input.

## Clean-room disclosure

Independent portfolio prototype. All code, copy, fixtures, workflows, and visuals in this project were created from scratch using synthetic data. No employer or client code, prompts, schemas, screenshots, repositories, internal documentation, or confidential information were used. External Jira, GitHub, AI, database, and MCP-style operations are simulated; the interactive UI and local workflow state machine are functional.

The detailed boundary and independent-development principles are documented in [docs/clean-room-and-provenance.md](docs/clean-room-and-provenance.md). Public references are recorded separately in [docs/design-influences.md](docs/design-influences.md).

## Professional context

In professional work, I built a related governed AI-assisted delivery platform that supported approximately 50 production stories through human-reviewed pull requests. This public prototype is a separate implementation and contains none of that system’s code or data.

The professional statement above is intentionally separate from the prototype’s functional and synthetic evidence. It is the only professional outcome claim made by this project.
