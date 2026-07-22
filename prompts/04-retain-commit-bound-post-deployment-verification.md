# Implementation prompt: retain commit-bound post-deployment verification

Work in the AI Delivery Workbench repository and complete this as one focused release-evidence phase. Read `AGENTS.md` completely before taking any action and follow it. Inspect before editing, preserve unrelated user changes, and do not deploy, publish, retag, rewrite release evidence, or claim a hosted result that you did not directly observe.

## Objective

Implement a low-complexity, sanitized, durable post-deployment verification record that binds production behavior checks to the exact deployed commit and canonical origin.

The current generated deployment binding correctly proves release tag, audited source, evidence child, deployed commit, CodeQL source, and verified lineage. The Quality workflow retains build-time browser and Lighthouse results. Current production `test:deployment` and Lighthouse checks can be run successfully, but their outcomes are not durably identified by the deployment binding or another retained, commit-bound production-verification record.

## Required investigation

1. Record the initial worktree, branch, HEAD, tag, and current release/deployment lineage.
2. Inspect at minimum:
   - `.github/workflows/`;
   - `tests/e2e/deployment.spec.ts`;
   - `scripts/run-lighthouse.ts` and Lighthouse configuration;
   - deployment-binding generation and validation;
   - `docs/deployment-verification.md`;
   - `docs/release-evidence.md`;
   - security-report and artifact-retention rules in `AGENTS.md` and `SECURITY.md`.
3. Confirm which production checks require only a public canonical URL and which need provider credentials. Prefer a design that does not require deployment credentials after the site is live.
4. Confirm that production identity can be derived fail-closed from `/security/deployment-binding.json`, not from an operator-supplied label alone.

## Implementation requirements

Implement the smallest maintainable mechanism, normally a manually dispatchable or deployment-triggered verification workflow plus a sanitized retained artifact. It must:

- accept or resolve the canonical production origin;
- fetch and validate the deployment binding before running behavioral checks;
- require the binding's deployed commit, release tag, audited commit, and relation to match the requested candidate;
- run the existing production deployment suite against that exact origin;
- run desktop and mobile Lighthouse for `/`, `/workbench/`, and `/workbench/demo/`;
- retain enough browser/accessibility/network/header/cache evidence to identify the commands and outcomes without publishing raw sensitive reports;
- produce a small machine-readable summary containing a schema version, canonical origin, deployed SHA, release tag, audited SHA, workflow/run identity, timestamp, tool versions, route/profile results, and overall pass/fail state;
- fail closed on missing binding fields, commit mismatch, redirects to an unexpected origin, missing test output, or a failed assertion;
- retain detailed reports only as restricted CI artifacts or in gitignored `.security-reports/` when appropriate;
- never describe Preview results as Production;
- never modify the immutable v1.0.8 release summary or tag.

A GitHub job summary may link the sanitized artifact and live binding. Do not add a backend merely to store the result.

## Tests and verification

Add deterministic tests for summary-schema validation and fail-closed cases, including:

- deployed SHA mismatch;
- wrong canonical origin;
- missing or malformed binding;
- failed deployment test;
- incomplete Lighthouse route/profile set;
- attempted inclusion of disallowed sensitive fields.

Run at minimum:

```powershell
npm ci
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:deployment
npm run performance:audit
npm run links:check
npm run security:release-evidence:require
npm run check
```

Only count `test:deployment` as a hosted pass when `DEPLOYMENT_BASE_URL` and the expected canonical origin identify a verified deployment whose binding matches the candidate. Local preview Lighthouse remains useful implementation validation but cannot substitute for the hosted record.

## Acceptance and completion

Acceptance requires a retained sanitized record for one exact hosted deployment, validation of its commit/origin binding, all required route/profile results, and successful hosted workflow evidence. If deployment or GitHub authority is unavailable, implement and test the mechanism, report the exact external blocker, and do not fabricate the final hosted artifact.

End with one focused Git commit. Report architecture decisions, files changed, local and hosted commands with exit codes/run URLs, retained artifact identity, manual production observations, commit hash/message, and any provider or permission blocker.
