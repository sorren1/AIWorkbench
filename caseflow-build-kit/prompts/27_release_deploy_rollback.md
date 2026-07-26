# 27 — Release Evidence, Deployment, and Rollback Proof

**Executor:** Human + Codex 5.6 sol extra-high
**Task ID:** `T27`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T26 COMPLETE.
- Working tree contains only intentional release changes.

## Read first
- `caseflow-build-kit/docs/09-deployment/RELEASE_PLAN.md`
- `caseflow-build-kit/docs/09-deployment/ROLLBACK.md`
- `caseflow-build-kit/project/VERSIONING.md`
- `caseflow-build-kit/docs/08-testing/RELEASE_GATES.md`
- `caseflow-build-kit/deliverables/security-audit.md`

## Objective
Create a reproducible interview-stable release, deploy it to the same Vercel site, verify all direct and existing routes, and prove rollback readiness.

## Instructions
1. Run the complete existing and CaseFlow release gate from a clean state.
2. Create the audited source commit and generate release evidence according to the host repository's established source/evidence/deployment model.
3. Generate or extend a release summary and deployment binding that identify CaseFlow route contract and evidence digests without weakening existing Workbench binding.
4. Human approves and triggers/deploys the exact intended commit to Vercel.
5. Run hosted verification for `/`, existing Workbench routes, all four CaseFlow routes, headers, assets, noindex, network behavior, and evidence hashes.
6. Record a rollback rehearsal or precise Vercel rollback procedure and verify the prior deployment remains identifiable.
7. Tag the stable release according to the decision made in T02/T27 and create release notes.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Do not deploy a dirty or unbound commit.
- Do not claim hosted success before post-deployment verification.
- Do not overwrite historical release evidence.

## Required outputs
- Stable release commit/tag
- Release summary and deployment binding
- Hosted verification evidence
- Rollback record
- Release notes

## Acceptance gate
- [ ] All source and hosted gates pass.
- [ ] Deployed commit matches binding.
- [ ] Four CaseFlow and all existing critical routes work.
- [ ] Evidence hashes match.
- [ ] Rollback path is verified.

## Human checkpoint
Human explicitly approves the Production deployment. Codex may prepare and verify but must not silently change production.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T27.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
