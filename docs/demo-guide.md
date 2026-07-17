# Interactive portfolio prototype guide

AI Delivery Workbench is a governed, human-in-the-loop control plane for AI-assisted software delivery. The interactive route demonstrates its workflow and evidence model through deterministic synthetic fixtures.

## Evidence boundary

Functional locally:

- navigation across the seven primary screens;
- work-queue search and filters;
- light and dark themes;
- reducer-backed stage transitions, stale cascades, review state, and validation state;
- local artifact selection, review decisions, drawers, modals, and toasts.

Synthetic fixtures:

- every persona, issue, repository, branch, pull request, check, log, duration, test result, and metric;
- Jira sync, GitHub and pull-request operations, AI generation, database access, MCP-style tools, test execution, deployment, external review, credentials, and provider calls;
- all apparent connection, authentication, notification, persistence, and environment-readiness results.

External-system controls change browser-local demo state only. They do not contact a provider or perform a network write.

## Illustrative reference stack

Jira, GitHub, Angular, .NET, and Oracle are one technically specific adapter set behind vendor-neutral issue, repository, UI, service, and database boundaries. The configuration is synthetic and does not describe a prescribed or organization-specific environment.

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

1. **Work Queue** — inspect synthetic queue counts and filter for review, verification failure, or stale downstream work.
2. **Issue Detail** — follow the ordered Seed → Intake → Spec → Plan → Change Targets → Implement → Verify → PR Review stages. Stage actions update the functional local state machine with synthetic results.
3. **Artifacts** — inspect deterministic synthetic outputs and record a local review decision.
4. **GitHub / PR** — inspect synthetic files, checks, and reviewer state around the human-review gate.
5. **Validation Evidence** — update synthetic scenarios and tester notes, then inspect the browser-local decision state.
6. **Architecture** — review the control, execution, context, and validation responsibility boundaries.
7. **Settings** — inspect the simulated adapters, illustrative reference stack, and governance configuration.

Use the persistent prototype badge for the concise boundary and the About panel for full provenance and the separately labeled professional context.
