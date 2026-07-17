# Interactive portfolio prototype guide

AI Delivery Workbench is a governed, human-in-the-loop control plane for AI-assisted software delivery. The interactive route demonstrates its workflow and evidence model through deterministic synthetic fixtures.

## Evidence boundary

Functional locally:

- navigation across the eight primary screens;
- work-queue search and filters;
- light and dark themes;
- reducer-backed stage transitions, stale cascades, review state, and validation state;
- local artifact selection, review decisions, drawers, modals, and toasts;
- clipboard copy and issue-scoped artifact downloads;
- architecture Markdown/JSON and validation-evidence Markdown/JSON exports;
- validated deep links for screen, synthetic issue, artifact, and Settings subview;
- five named deterministic synthetic scenario seeds and an explicitly confirmed reset;
- generated, schema-validated agent/tool/model/memory/approval-policy registry inspection and JSON export;
- synthetic persona switching, pure local scope enforcement, and a versioned browser-local approval inbox;
- explicit approval pause/decision/resume bound to arguments, versions, change targets, and context;
- optional local MCP discovery and bounded toy-repository invocation through repository commands.

Synthetic fixtures:

- every persona, issue, repository, branch, pull request, check, log, duration, test result, and metric;
- Jira sync, GitHub and pull-request operations, AI generation, database access, external enterprise MCP integrations, hosted test execution, deployment, external review, credentials, and provider calls;
- all apparent connection, authentication, notification, persistence, and environment-readiness results.

External-system controls change browser-local demo state only. They do not contact a provider or perform a network write. The repository-owned MCP fixture is a separate functional local command-line slice against a disposable synthetic toy repository; the public browser never connects to it.

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

Open `/demo/?walkthrough=1` to start the in-app 5–8 minute walkthrough. The same guide is available from the `Guided tour` button in the global demo controls. It uses semantic buttons, announces progress, moves between the existing reducer-backed screens, closes with Escape, and can be restarted without reloading.

Deep links use validated public fixture identifiers. For example:

```text
/demo/?screen=artifacts&issue=FIN-1150&artifact=spec.md
/demo/?screen=settings&view=gov
/demo/?screen=control-plane
/demo/?scenario=failed-verification
```

Unknown issue, artifact, scenario, and subview values are ignored. URLs never contain prompt bodies, artifact contents, notes, credentials, or private data.

Validation exports deliberately exclude freeform browser-local tester-note text and report only the number excluded. This keeps downloadable evidence limited to authored synthetic fixtures even if a visitor types private text into the local note field.

## Deterministic scenario seeds

- **Baseline delivery queue** — the ten-issue starting state.
- **Ready for human review** — FIN-1077 at the synthetic PR review gate.
- **Failed verification** — FIN-1301 with failed synthetic validation evidence.
- **Stale after upstream redo** — FIN-1198 with invalidated downstream stages.
- **Clean end-to-end walkthrough** — FIN-1150 with a complete synthetic chain.

Changing the scenario starts again from the same deterministic workflow baseline. `Reset demo` requires confirmation, clears workflow and approval changes, restores preferences/persona to defaults, cancels pending simulated transitions, and returns to the baseline queue. Theme plus the explicitly disclosed versioned authorization/approval store persist locally; ordinary workflow, PR, validation, and note state remains ephemeral.

## Suggested walkthrough

1. **Work Queue** — inspect synthetic queue counts and filter for review, verification failure, or stale downstream work.
2. **Issue Detail** — follow the ordered Seed → Intake → Spec → Plan → Change Targets → Implement → Verify → PR Review stages. Stage actions update the functional local state machine with synthetic results.
3. **Artifacts** — inspect deterministic synthetic outputs and record a local review decision.
4. **GitHub / PR** — inspect synthetic files, checks, and reviewer state around the human-review gate.
5. **Validation Evidence** — update synthetic scenarios and tester notes, then inspect the browser-local decision state.
6. **Architecture** — review the control, execution, context, and validation responsibility boundaries.
   Use the persistent prototype badge for the concise boundary and the About panel for full provenance and the separately labeled professional context.

The separate **Control Plane** destination provides a focused registry inspection path when time permits. It shows exact versions, lifecycle, content hashes, capabilities, schemas, tool/write boundaries, model/memory policies, and estimated budgets without expanding the guided workflow into a generic admin tour. **Approval Inbox** demonstrates persona scope reasons, durable local decisions, separation of duties, and exact hash-bound resume.
