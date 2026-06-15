# AI Delivery Workbench

**A clean-room interview prototype** for a governed, AI-assisted software delivery platform.

> **Clean-Room Interview Prototype — Synthetic Data Only.**
> This prototype performs **no real Jira, GitHub, AI, Oracle, or MCP operations.** All data and
> actions are simulated locally for interview demonstration purposes.

---

## What this is

The AI Delivery Workbench demonstrates how a Principal Software Engineer — AI would design a
**governed AI-assisted SDLC** for enterprise software teams. It shows the full workflow:

> Jira issue → AI intake / spec / plan artifacts → implementation plan → GitHub PR readiness →
> QA / validation evidence → governed human review

The primary message: **AI can accelerate software delivery, but only if the workflow preserves
deterministic artifacts, human review, traceability, PR-based control, QA evidence, and a clear
separation between suggestion, implementation, review, and release.**

## Clean-room statement

- Uses **fully synthetic data only.**
- Uses **no previous-employer code, data, user stories, prompts, screenshots, schemas, repository
  names, or customer names.**
- Uses **no previous-employer internal information.**
- Synthetic data is inspired only by **public-domain enterprise finance-software themes** (ERP
  reporting, FP&A, close/consolidation, data connectivity, audit trails, role-based access, etc.).
- No synthetic issue, roadmap item, schema, repository, or artifact represents any actual company's
  internal work.
- Copies no real company branding, logos, screenshots, or website layouts.

## Target environment reflected (synthetic)

| Concern | Target |
|---|---|
| Issue system | Jira |
| Source control / PR | GitHub |
| Frontend | Angular / TypeScript |
| Backend | C# / .NET |
| Database | Oracle |
| AI workflow | Claude / Codex-capable agent execution |
| Context | MCP-style context servers |
| Governance | Human approval gates, deterministic artifacts, PR traceability, audit evidence |

---

## Running it locally

This deliverable is a **front-end-only** prototype with **no backend and no external calls.**

**Open directly (simplest):** open `AI Delivery Workbench.html` in a modern browser. It loads
React + Babel from a CDN and the local fixture data — nothing else.

**Or serve it** (recommended so relative assets resolve cleanly):

```bash
# from the project root
npx serve .
# then open the printed URL and navigate to /workbench/AI%20Delivery%20Workbench.html
```

> **Note on the stack.** The target environment it *reflects* is Angular / .NET / Oracle. The
> prototype **itself** is implemented as a self-contained, component-structured single-page app
> (React + TypeScript-style components, reusable cards / tables / badges / timelines / drawers /
> modals / artifact viewers) so it can be screen-shared in an interview with zero setup. The
> component breakdown mirrors how the equivalent Angular feature modules would be organized
> (`store`, `primitives`, one module per screen). If an `npm install && npm start` Angular shell is
> required, these screens and fixtures port directly into Angular components and services.

---

## Recommended 5–8 minute demo walkthrough

1. **Work Queue** — "This is the cockpit." Scan what needs attention, filter by *Needs review* /
   *Failed verification* / *Stale downstream*.
2. **Open FIN-1150 — AI Variance Commentary Draft** — "This is the governed AI implementation
   workflow." Walk the AI stage timeline (Seed → Intake → Spec → Plan → Change Targets → Implement →
   Verify → PR Review). Click **Run Verify** to watch a stage execute and emit evidence.
3. **Artifacts** — "This is how we make AI output reviewable." Open `change-targets.json` and the
   spec / plan artifacts in the split-pane viewer; approve or request changes.
4. **GitHub / PR** — "This is how we preserve normal engineering controls." Review the diff, see
   expected vs unexpected file changes and required checks, **Mark diff reviewed**, then
   **Approve for validation**.
5. **Validation Evidence** — "This is how QA and auditability stay attached." Mark scenarios passed,
   add a tester note, mark evidence complete.
6. **Architecture** — "This is how I'd productionize it." Talk through the control / execution /
   context (MCP) / validation planes and production hardening.
7. **Settings** — "This is how it adapts to Jira, GitHub, Angular, .NET, Oracle, and MCP context."

## What production would require

The Architecture screen states it directly: in production each plane would require **identity,
authorization, secrets management, audit persistence, execution isolation, integration-specific
error handling, and clear rollback / retry behavior** — plus durable provenance and immutable
evidence storage.

---

## Structure

```
workbench/
  AI Delivery Workbench.html   # entry point
  workbench.css                # component + layout styling (built on ../styles.css tokens)
  data.js                      # synthetic core fixtures (issues, stages, settings, MCP, architecture)
  content.js                   # artifact bodies, PR, validation, logs, generators
  icons.jsx                    # in-house stroke icon set
  primitives.jsx               # Button, Badge, Card, Field, artifact renderers, …
  store.jsx                    # local state store (simulated services)
  shell.jsx                    # sidebar, header, toast/drawer/modal hosts
  screen-*.jsx                 # one module per screen
  app.jsx                      # root + router
```

Visual foundations (color, type, spacing, radii, motion) come from the project-level Cleanroom
design system in `../styles.css`.
