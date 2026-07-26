# 23 — Security, Clean-Room, and Claim-Boundary Audit

**Executor:** Codex 5.6 sol extra-high
**Task ID:** `T23`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T22 COMPLETE.

## Read first
- `caseflow-build-kit/docs/03-security/THREAT_MODEL.md`
- `caseflow-build-kit/docs/03-security/SECRET_HANDLING.md`
- `caseflow-build-kit/docs/03-security/PRIVACY_AND_PII.md`
- `caseflow-build-kit/docs/03-security/CLEAN_ROOM.md`
- `caseflow-build-kit/reference/CLAIM_BOUNDARIES.md`
- `caseflow-build-kit/reference/COPYRIGHT_AND_TRADEMARKS.md`
- `caseflow-build-kit/docs/08-testing/SECURITY_TESTS.md`

## Objective
Conduct an adversarial audit of source, history, generated output, evidence, UI claims, and route boundaries before live capture or deployment.

## Instructions
1. Run existing repository secret/history/supply-chain scans and add CaseFlow-specific secret/PII/synthetic-data scans.
2. Inspect every generated public evidence field, completion report, screenshot, source map, and error fixture for account or local-environment leakage.
3. Verify arbitrary SQL, arbitrary procedure, unsafe mode, self approval, stale approval, wrong target, and idempotency-conflict paths are blocked.
4. Verify public replay makes no external request and the CSP need not be broadened.
5. Audit every public statement against the claim taxonomy and evidence references.
6. Audit trademark/affiliation copy and visual design for CData imitation.
7. Produce a severity-ranked audit report and fix all critical/high findings before completion.

## Non-negotiable constraints
- Follow `caseflow-build-kit/AGENTS.md` and preserve existing AIWorkbench behavior.
- Do not invent CData features, tool names, source schemas, measured outcomes, or live-validation claims.
- Use only synthetic data and never expose credentials or raw live responses.
- Do not add a link to CaseFlow from the existing homepage, Workbench, article, demo, or sitemap.
- Do not begin a later numbered task in the same session.
- Do not suppress a finding merely to pass a gate.
- Document accepted residual risks with owner and rationale.

## Required outputs
- `caseflow-build-kit/deliverables/security-audit.md`
- New/updated security tests and scanners
- Resolved critical/high findings
- Updated threat/risk/claim records

## Acceptance gate
- [ ] Zero unresolved critical/high finding.
- [ ] No secret/real data in tracked or generated public files.
- [ ] Public replay has no external network dependency.
- [ ] All claims have valid evidence classification.
- [ ] No affiliation/trademark issue remains.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T23.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
