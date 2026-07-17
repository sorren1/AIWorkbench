# Interactive demo guide

The AI Delivery Workbench demonstrates a governed, AI-assisted delivery flow using fictional local data. It is a clean-room public prototype, not a connection to a real delivery platform.

## What is functional

- local navigation across the seven primary screens;
- work-queue search and filters;
- light and dark themes;
- reducer-backed stage transitions, stale cascades, review state, and validation state;
- local artifact selection, simulated review decisions, drawers, modals, and toasts.

## What is simulated

Jira sync, GitHub and pull-request operations, AI generation, Oracle access, MCP tools, test execution, deployment, external review, credential handling, and provider calls are deterministic fixtures. Buttons that represent those operations change local demo state only.

## Run

From the repository root:

```bash
npm ci
npm run dev
```

Open `/demo/` on the local Vite URL. For the production build:

```bash
npm run build
npm run preview
```

## Suggested walkthrough

1. **Work Queue** — inspect active items and filter for review, verification failure, or stale downstream work.
2. **Issue Detail** — follow the ordered Seed → Intake → Spec → Plan → Change Targets → Implement → Verify → PR Review stages. Running a stage is a local simulation.
3. **Artifacts** — inspect the deterministic synthetic outputs and record a local review decision.
4. **GitHub / PR** — inspect expected and unexpected files, required checks, and the human-review gate. No real pull request is read or written.
5. **Validation Evidence** — update fictional scenarios and tester notes, then inspect the local decision state.
6. **Architecture** — review the control, execution, context, and validation plane boundaries.
7. **Settings** — inspect the explicitly simulated Jira, GitHub, AI, MCP, stack, and governance configuration.

All people, repositories, issue records, artifacts, checks, and evidence shown in the demo are synthetic.
