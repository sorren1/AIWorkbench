# Release audit checklist

Complete this checklist against the candidate commit before publication or tagging.

## Source and build

- [ ] `git status --short` is clean and the candidate commit is recorded.
- [ ] `npm ci` used the committed lockfile and supported Node version.
- [ ] `npm run check:all` completed with exit code zero.
- [ ] Production build contains no unplanned external request, credential, or CSP violation.

## Supply chain

- [ ] `.github/workflows/quality.yml`, dependency review, and CodeQL completed successfully for the candidate commit.
- [ ] `.security-reports/security-summary.md` identifies the candidate source state and expected scanner versions.
- [ ] Gitleaks scanned both tracked files and complete fetched Git history with zero unsuppressed findings.
- [ ] ESLint, CodeQL, Compose/Dockerfile policy, and language-coverage status are reviewed.
- [ ] npm and sandbox-image high/critical counts are zero after documented suppressions.
- [ ] Production npm, complete npm, and sandbox-image CycloneDX SBOMs exist and their hashes match `release-summary.json`.
- [ ] License inventory matches `security/license-policy.json` and `THIRD_PARTY_NOTICES.md`.
- [ ] Every suppression has rule, path, reason, reviewer, review date, expiry, and explicit owner acceptance.
- [ ] Scanner reports were retained as restricted CI artifacts and were not committed to the repository.

## Claims and publication

- [ ] The case study shows only controls whose recorded status is `PASSED`; pending/blocked controls are visibly distinct.
- [ ] The source base commit/tree digest wording does not imply a signed attestation.
- [ ] Simulated external integrations and the static/no-live-execution boundary remain explicit.
- [ ] The private publication review checklist has been completed separately and remains untracked.
