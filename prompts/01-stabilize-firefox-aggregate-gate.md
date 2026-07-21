# Implementation prompt: stabilize the Firefox aggregate release gate

Work in the AI Delivery Workbench repository and complete this as one focused implementation phase. Read `AGENTS.md` completely before taking any action and follow it. Inspect before editing, preserve unrelated user changes, and do not deploy, publish, retag, regenerate release evidence, or weaken a gate merely to obtain a pass.

## Objective

Make the complete supported-Windows `npm run check:all` release gate deterministic without reducing responsive coverage or hiding first-attempt failures.

During the 2026-07-21 production-readiness audit, `npm run check:all` reached the Playwright suite and reported 145 passed, 2 skipped, and 1 failed test. Firefox timed out in `tests/e2e/responsive.spec.ts` at `public pages have no horizontal overflow at 1024px`. The exact focused command below then passed immediately:

```powershell
npx playwright test tests/e2e/responsive.spec.ts --project=firefox --grep "public pages have no horizontal overflow at 1024px"
```

The exact audited source and tagged evidence child also passed their hosted Firefox jobs. Treat this as an aggregate-load reliability problem until evidence establishes a different cause.

## Required investigation

1. Record the initial worktree, branch, HEAD, Node version, npm version, and relevant Playwright/browser versions.
2. Inspect:
   - `tests/e2e/responsive.spec.ts`;
   - `playwright.config.ts`;
   - `package.json` and the `check:all` command graph;
   - `.github/workflows/quality.yml` and any browser-job helpers;
   - the Firefox-flakiness decision in `docs/decision-log.md`;
   - any shared server, fixture, worker, timeout, or navigation configuration used by the E2E suite.
3. Reproduce the full-suite failure before editing if the environment permits. Retain actionable diagnostics such as the failing URL, elapsed navigation/assertion times, console errors, and trace metadata. Do not add sensitive output to Git.
4. Determine whether the cause is test granularity, shared preview-server contention, worker pressure, navigation readiness, Firefox transport behavior, or an actual responsive defect.

## Implementation requirements

- Preserve all six public viewport widths and every principal public route currently covered.
- Prefer small, diagnosable tests—for example, route/viewport cases that fail independently—or targeted Firefox serialization when supported by evidence.
- Keep the complete release gate first-attempt and fail-closed.
- Do not solve the problem solely by increasing a global timeout, adding broad retries, skipping Firefox, reducing routes/viewports, or removing assertions.
- Do not create a browser-specific application behavior unless an actual product defect requires it.
- Keep `npm run check:all` as the complete local CI-equivalent aggregate.
- Record any material test-architecture decision in `docs/decision-log.md`.

## Verification and acceptance

Run at minimum:

```powershell
npm ci
npx playwright test tests/e2e/responsive.spec.ts --project=firefox
npm run test:e2e
npm run check:all
```

Acceptance requires:

- the focused Firefox responsive suite passes;
- the full Playwright suite passes without new skips or retries masking a failure;
- `npm run check:all` passes three consecutive times on the supported Windows environment;
- Chromium, Firefox, WebKit, accessibility, visual, Lighthouse, and workspace-reuse coverage remain present in the aggregate;
- the corresponding hosted Quality workflow passes on the implementation commit before release sign-off.

If hosted CI cannot be observed, complete all local work and report the exact hosted-evidence blocker rather than claiming acceptance.

## Completion requirements

End with one focused Git commit. Report the root cause, implementation, files changed, exact commands and exit codes, browser behavior verified, commit hash/message, and any remaining risk or blocker.
