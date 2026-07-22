# Implementation prompt: add interruption-safe sandbox and gateway cleanup

Work in the AI Delivery Workbench repository and complete this as one focused developer-tooling phase. Read `AGENTS.md` completely before taking any action and follow it. Inspect before editing, preserve unrelated user changes, and do not deploy, publish, generate replacement release evidence, or use real provider credentials unless they are explicitly supplied for a separately authorized live-validation step.

## Objective

Make cleanup for developer-run sandbox and model-gateway commands idempotent and signal-aware so normal errors, timeouts, SIGINT, and SIGTERM do not leave repo-owned temporary workspaces, containers, sandbox handles, or credential leases behind.

The current runners retry cleanup in `finally`, and the model gateway provides an explicit interrupted-run cleanup command. The CLI entrypoints do not currently install SIGINT/SIGTERM handlers. Because process termination can prevent JavaScript `finally` from completing, interruption cleanup is presently recoverable but not guaranteed.

## Required investigation

1. Record the initial worktree, branch, HEAD, environment, Docker availability, and whether live adapter credentials are absent or available.
2. Inspect at minimum:
   - `tools/local-sandbox/cli.ts`;
   - `tools/local-sandbox/runner.ts`;
   - local Docker and E2B provider implementations;
   - temporary-workspace creation and containment logic;
   - `tools/model-gateway/cli.ts`;
   - `tools/model-gateway/runner.ts`;
   - credential lease storage, revocation, and cleanup logic;
   - sandbox/model-gateway tests and operational documentation.
3. Map every resource-acquisition point to its normal, failure, timeout, and interruption cleanup path.
4. Establish which cleanup operations are already idempotent and which need explicit guards.
5. Reproduce interruption with fake/local providers first. Do not rely on a real E2B or upstream-model account to test lifecycle behavior.

## Implementation requirements

- Use a centralized, idempotent lifecycle/cleanup path rather than duplicating resource-specific signal logic.
- Handle SIGINT and SIGTERM at CLI boundaries and propagate cancellation through an `AbortSignal` or equivalent explicit contract.
- Stop accepting new work once shutdown starts.
- Bound cleanup time and preserve an actionable non-zero/signal-appropriate exit status.
- Ensure repeated signals or repeated cleanup calls cannot double-revoke, delete outside the repo-owned area, or hang indefinitely.
- Keep path containment and exact resource ownership checks before removing or cleaning anything.
- Add a safe sandbox recovery command if an interrupted run can leave recoverable repo-owned state. It must never scan or delete broad directories, arbitrary containers, or resources not created by this project.
- Preserve Docker `--rm`, E2B TTL, lease expiry, and existing `finally` cleanup as defense in depth.
- Do not log provider keys, prompts, responses, environment secrets, or sensitive cleanup payloads.
- Update the relevant runbooks and `docs/decision-log.md` with lifecycle and recovery behavior.

## Tests and verification

Add deterministic child-process integration tests that interrupt commands during at least:

- resource setup;
- active command/model execution;
- evidence finalization;
- cleanup itself.

Test both SIGINT and SIGTERM where the operating system supports them. Always exercise fake providers; exercise local Docker when available. Assert that:

- cleanup is attempted exactly as intended;
- no repo-owned temporary workspace remains;
- no test container remains;
- no scoped credential lease remains active;
- a cleanup failure is reported and produces a non-zero exit;
- the recovery command is path-contained and idempotent.

Run at minimum:

```powershell
npm ci
npm run lint
npm run typecheck
npm run test
npm run sandbox:evidence:validate
npm run model-gateway:check
npm run model-gateway:evidence:validate
npm run check
```

Run the applicable local Docker sandbox checks when Docker is available. Treat missing Docker or live credentials as explicit blockers for those specific validations, never as passes.

## Acceptance and completion

Acceptance requires deterministic signal tests, idempotent cleanup, contained recovery, existing evidence validation remaining green, and accurate runbooks. End with one focused Git commit and report files changed, lifecycle behavior, exact commands/exit codes, interruption cases observed, commit hash/message, and all unavailable-provider blockers.
