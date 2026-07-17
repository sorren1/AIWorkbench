# Release audit checklist

Complete this checklist against the candidate commit before publication or tagging.

## Source and build

- [ ] `git status --short` is clean and the candidate commit is recorded.
- [ ] `npm ci` used the committed lockfile and supported Node version.
- [ ] `npm run check:all` completed with exit code zero.
- [ ] `npm run screenshots:generate` reproduced all seven public captures and the social image from the production preview.
- [ ] `npm run screenshots:check` verified decoded image pixels within the documented antialias tolerance.
- [ ] Static and tracked-document links/fragments passed `npm run links:check`.
- [ ] Production build contains no unplanned external request, credential, or CSP violation.

## Supply chain

- [ ] `.github/workflows/quality.yml`, dependency review, and CodeQL completed successfully for the candidate commit.
- [ ] `.security-reports/security-summary.md` identifies the candidate source state and expected scanner versions.
- [ ] Gitleaks scanned both tracked files and complete fetched Git history with zero unsuppressed findings.
- [ ] ESLint, CodeQL, Compose/Dockerfile policy, and language-coverage status are reviewed.
- [ ] npm and all three runtime-image unsuppressed HIGH/CRITICAL counts are zero.
- [ ] Production npm, complete npm, sandbox, LiteLLM, and PostgreSQL CycloneDX SBOMs exist and their hashes match `release-summary.json`.
- [ ] LiteLLM's upstream Cosign signature verifies with the commit-pinned public key, and the public summary lists all three scanned runtime digests.
- [ ] License inventory matches `security/license-policy.json` and `THIRD_PARTY_NOTICES.md`.
- [ ] Every suppression has rule, path, reason, reviewer, review date, expiry, and explicit owner acceptance.
- [ ] PostgreSQL `gosu` exceptions still match the documented reachability boundary and have not reached 2026-08-15.
- [ ] Scanner reports were retained as restricted CI artifacts and were not committed to the repository.

## Claims and publication

- [ ] The owner explicitly revisited `docs/adr/source-license-decision.md`; any license change includes exact text, contributor terms, notices, and changelog entry.
- [ ] The case study shows only controls whose recorded status is `PASSED`; pending/blocked controls are visibly distinct.
- [ ] The source base commit/tree digest wording does not imply a signed attestation.
- [ ] Simulated external integrations and the static/no-live-execution boundary remain explicit.
- [ ] Canonical/live/contact links contain real public values or remain omitted; no placeholder/dead links are rendered.
- [ ] Hosted CodeQL, dependency review, security headers, sitemap, canonical metadata, and all public routes were observed at the candidate URL.
- [ ] The private publication review checklist has been completed separately and remains untracked.
