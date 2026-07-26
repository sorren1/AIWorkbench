# Definition of Done

CaseFlow is complete only when every mandatory item below is demonstrated with reproducible evidence.

## Product behavior

- [ ] Canonical case produces a complete evidence packet and the correct $1,240 proposal.
- [ ] Deterministic policy identifies the >24-hour carrier-caused delay and the >$1,000 approval threshold.
- [ ] A write without approval is blocked.
- [ ] A repeated approved execution does not create a duplicate credit.
- [ ] A partial write produces `RECONCILIATION_REQUIRED`, preserves receipts, and supplies a runbook path.
- [ ] Missing or conflicting evidence produces escalation rather than invented certainty.

## CData integration

- [ ] Current Developer Edition capabilities are recorded from the actual account.
- [ ] Query MCP discovery/query behavior is demonstrated or a limitation is documented.
- [ ] Management MCP connection-management behavior is demonstrated or a limitation is documented.
- [ ] The official Python SDK completes a mock integration test and at least one sanitized live read when practical.
- [ ] The official agent scaffold is generated and analyzed; a runnable result or explicit provider/account limitation is recorded.
- [ ] CData CLI is either demonstrated as an optional schema-development path or marked `COMPLETE_WITH_LIMITATION` with a reason.
- [ ] Monthly tool-call use is recorded and remains within the project budget.

## Public application

- [ ] `/caseflow/strategy`, `/technical`, `/operations`, and `/product` load directly after deployment.
- [ ] Public mode works without any network request beyond same-origin static assets.
- [ ] No existing homepage or Workbench page links to CaseFlow.
- [ ] CaseFlow is excluded from sitemap and marked noindex/noarchive.
- [ ] Each page carries independent-project and synthetic-data disclosure.
- [ ] No CData logo, copied trade dress, or affiliation implication appears.
- [ ] Every claim is classified by evidence state.

## Interview readiness

- [ ] Stage 2 tour completes in 3 minutes.
- [ ] Stage 3 tour completes in 7 minutes and supports interruption/resume.
- [ ] Stage 4 tour completes in 3–5 minutes.
- [ ] Stage 5 tour completes in 90 seconds–3 minutes.
- [ ] Each tour is understandable from a direct deep link.
- [ ] Each tour bridges the synthetic artifact to a truthful professional example.

## Quality and assurance

- [ ] Type checking, lint, formatting, unit, coverage, build, browser, accessibility, visual, link, performance, secret, and supply-chain gates pass.
- [ ] Required domain guards meet the heightened coverage thresholds defined in the test strategy.
- [ ] A clean clone can reproduce the public build and replay evidence.
- [ ] Hosted release summary and deployment binding identify the audited source and deployed commit.
- [ ] Rollback is tested and documented.
- [ ] T29 finds no unresolved critical or high issue.
