# Vercel deployment verification

- Status: GitHub automation connected and verified; exact tagged Preview pending; Production blocked on an owner-selected custom domain
- Review date: 2026-07-18
- Source repository: <https://github.com/sorren1/AIWorkbench>
- Vercel project: `workbench1/ai-delivery-workbench`
- Release baseline: `v1.0.2` at `7b2ec2ae8c215751b60a9505a05d0b5799061145`
- Current source review: <https://github.com/sorren1/AIWorkbench/pull/9>
- Intended evidence release: `v1.0.4` (`v1.0.3` was abandoned before tagging after the exact-main audit exposed a transitional contrast failure)
- Production URL: Not created. The account has no owner-selected custom domain.

This record distinguishes tracked readiness, GitHub evidence, and provider evidence. A local build, a `vercel.json` file, an account dashboard, or a failed deployment is not evidence of a Ready hosted artifact. Historical failures are retained as provider audit history and are not represented as successful deployment evidence.

## Re-audit disposition

| Area                                          | Result                      | Finding and disposition                                                                                                                                                                                                                                                                    |
| --------------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GitHub account authentication                 | RESOLVED                    | The Vercel account accepts the GitHub login connection for the approved GitHub identity. Authentication alone did not install the repository integration.                                                                                                                                  |
| Vercel GitHub App                             | RESOLVED                    | The official Vercel GitHub App was installed for the personal `sorren1` account with repository access limited to `sorren1/AIWorkbench`, then the Vercel project was connected to that repository.                                                                                         |
| Automatic branch and pull-request deployments | VERIFIED                    | Pushing pull request 9 caused Vercel to clone the exact branch commit and report a Vercel status on GitHub. The source-only branch failed at the checked-in release-evidence gate, which is the required fail-closed behavior rather than an integration failure.                          |
| Email deployment failures                     | EXPLAINED                   | The notifications were caused by the missing Vercel repository integration/team authorization path. They did not invalidate local tests or GitHub Actions, but they did mean that automatic Vercel Preview verification had not occurred. The integration gap is now resolved.             |
| Production branch tracking                    | CONTAINED                   | Production tracking is set to the dedicated `production-hold` branch, not `main`. The branch points to reviewed evidence and is not used for ongoing development, preventing source and evidence commits on `main` from being treated as Production before a canonical domain exists.      |
| Transitional modal contrast                   | FIXED AND REGRESSION-TESTED | The exact-main Firefox audit for the abandoned v1.0.3 evidence commit sampled a primary button during modal fade-in at 4.43:1. Dialog content now remains fully opaque while position animates; the maintained accessibility test pauses the animation at its midpoint and runs Axe there. |
| v1.0.3 evidence                               | ABANDONED                   | No `v1.0.3` tag was created. The failed exact-main audit prevented release, as designed. Replacement evidence will use `v1.0.4` so the abandoned evidence identity is not reused.                                                                                                          |
| Exact tagged Preview                          | PENDING                     | Preview-scoped release bindings must be updated to the final `v1.0.4` tag, audited source commit, and evidence commit. A new Git branch at the exact tagged evidence commit will then trigger and prove an automatic Ready Preview.                                                        |
| Production                                    | BLOCKED                     | There is no owner-selected custom domain or `SITE_CANONICAL_URL`. The build deliberately rejects temporary `*.vercel.app` values as canonical production origins. Production deployment and production SEO/DNS/TLS verification therefore remain unrun.                                    |
| Live E2B provider validation                  | BLOCKED EXTERNALLY          | `E2B_API_KEY` is unavailable. The deterministic local adapter is tested; no live-provider success is claimed.                                                                                                                                                                              |
| Live model-gateway validation                 | BLOCKED EXTERNALLY          | A live LiteLLM master key/provider endpoint is unavailable. The deterministic gateway contract is tested; no live-provider success is claimed.                                                                                                                                             |

## Current local and GitHub evidence

| Check                                         | Result | Evidence                                                                                                                                                                                                                                   |
| --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Clean install and dependency audit            | PASS   | The current `npm ci` path uses the committed lockfile and reports zero npm audit vulnerabilities.                                                                                                                                          |
| Complete local release gate                   | PASS   | `npm run check:all` exited zero in 529.1 seconds after the modal-transition fix.                                                                                                                                                           |
| Unit/integration suite                        | PASS   | 24 files passed, 2 live-provider files were skipped; 134 tests passed and 2 skipped.                                                                                                                                                       |
| Browser, accessibility, E2E, and visual suite | PASS   | 140 maintained-browser tests passed across Chromium, Firefox, and WebKit; 2 clipboard-capability tests were skipped as documented.                                                                                                         |
| Transitional accessibility regression         | PASS   | The About dialog is paused at the midpoint of its entrance animation, computed opacity is required to equal `1`, and Axe is run against that exact state in every maintained browser.                                                      |
| Pull-request quality gates                    | PASS   | Pull request 9 passed Core release controls, Chromium, Firefox, WebKit, Performance, Dependency Review, CodeQL analysis, and the CodeQL status check. The Vercel status is intentionally failing until checked-in release evidence exists. |
| Supply-chain controls                         | PASS   | Seven controls passed using pinned scanner images; 15 reviewed suppressions were reported. Detailed scanner output remains in ignored or restricted evidence storage.                                                                      |
| Bundle budgets                                | PASS   | Measured demo entry JavaScript is 113,308 B gzip, total JavaScript is 130,869 B gzip, and total CSS is 17,151 B gzip, within tracked budgets.                                                                                              |
| Lighthouse                                    | PASS   | The checked-in desktop and mobile profiles passed their route-specific performance, accessibility, best-practices, and SEO thresholds locally. Hosted Preview SEO is evaluated separately because Vercel adds Preview noindex behavior.    |

## Tracked deployment contract

| Setting                   | Value                                                                                   | Reason                                                                                                       |
| ------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Framework                 | Vite                                                                                    | The repository produces a conventional multi-page static build.                                              |
| Runtime                   | Node 22.x                                                                               | Matches `package.json`, `.nvmrc`, CI, and the Vercel project setting.                                        |
| Install                   | `npm ci`                                                                                | Uses only the committed lockfile.                                                                            |
| Build                     | `npm run build`                                                                         | Runs the normal production build and release-binding checks.                                                 |
| Output                    | `dist`                                                                                  | Contains the root case study, article, `/demo/`, authored `404.html`, metadata, and local assets.            |
| Routing                   | Vercel filesystem routing                                                               | No SPA rewrite; direct page refreshes and the custom 404 retain their intended behavior.                     |
| Hashed assets             | `/assets/immutable/`                                                                    | Only Vite-hashed JavaScript and CSS receive one-year immutable caching.                                      |
| HTML and unhashed assets  | `public, max-age=0, must-revalidate`                                                    | Prevents stale browser HTML and avoids marking stable-name assets immutable.                                 |
| Canonical URL             | `SITE_CANONICAL_URL`, Production only                                                   | Preview omits canonical-dependent tags; the typed parser rejects temporary Vercel hostnames.                 |
| Production branch         | `production-hold`                                                                       | Prevents ordinary `main` pushes from becoming Production until the domain and production bindings are ready. |
| Release commit binding    | `VERCEL_GIT_COMMIT_SHA`                                                                 | Must equal the separately approved, annotated-tag evidence commit or the build fails.                        |
| Explicit release bindings | `APPROVED_RELEASE_TAG`, `APPROVED_AUDITED_COMMIT_SHA`, `APPROVED_DEPLOYMENT_COMMIT_SHA` | Prevents a deployment from silently substituting an unreviewed source, evidence commit, or tag.              |

`vercel.json` contains no rewrites, functions, or Vercel-specific application runtime. Preview Deployment Protection is disabled for public artifact auditability, and the Vercel Toolbar is disabled for pre-production and production. The repository contains no bypass credential.

## Git integration evidence

The Vercel authentication page accepting GitHub was necessary but insufficient. Vercel project Git settings still required the official GitHub App. The app was installed for exactly this repository, and project Git settings now show one connected source: `sorren1/AIWorkbench`. The CLI confirms that the repository is already connected.

The first post-connection pull-request push created an automatic Vercel Preview attempt at:

- <https://ai-delivery-workbench-17fos00et-workbench1.vercel.app>

Its build cloned the reviewed source commit, ran `npm ci`, reported zero vulnerabilities, and then stopped with `Vercel release build requires checked-in audited release evidence.` That failure proves both the automatic Git trigger and the release guard. It is not a deployable artifact and must not be used as Preview evidence.

Connecting Git also triggered two short-lived Production attempts while branch tracking still named `main`. Both stopped at the stale release-binding guard and never became Ready. No custom domain was assigned and no Production artifact was accepted. Production tracking was then moved to `production-hold` and verified after reload.

## Exact tagged Preview procedure

1. Merge the reviewed source commit only after every required pull-request check passes.
2. Require fresh Quality and CodeQL success on that exact `main` commit.
3. Generate one summary-only evidence child bound to the source commit and the exact successful CodeQL run; review it through a pull request and require fresh checks again.
4. Create and push annotated tag `v1.0.4` on the exact evidence child. Run `npm run security:release-evidence:require` against the tag.
5. Update only the Preview scope of the three explicit release-binding variables. Do not change Production bindings and do not set `SITE_CANONICAL_URL` for Preview.
6. Push a new non-production branch whose ref points exactly to the tagged evidence commit. Require the automatic Vercel deployment to reach Ready.
7. Set `DEPLOYMENT_BASE_URL` to the immutable Preview URL, leave `EXPECTED_CANONICAL_URL` unset, and run `npm run test:deployment`.
8. Inspect `/security/deployment-binding.json` and require exact tag, audited source commit, evidence commit, and CodeQL URL/count bindings.
9. In an external browser, inspect `/`, `/demo/`, `/writing/governing-ai-assisted-delivery/`, and a missing route. Verify direct refresh, the authored 404 status/content, keyboard navigation, focus handling, responsive layouts, and no unexpected external requests or toolbar injection.
10. Inspect HTML and hashed-asset headers. Require CSP without `unsafe-inline`, Referrer-Policy, nosniff, Permissions-Policy, Cross-Origin-Opener-Policy, revalidation-safe HTML caching, and immutable caching only for hashed assets.
11. Run hosted desktop and mobile Lighthouse audits for `/` and `/demo/`. Record Preview noindex effects separately from code-controlled SEO.

## Production gate

Production remains intentionally unrun until the owner supplies one exact custom HTTPS domain. The Vercel project currently lists only provider-assigned `vercel.app` domains, which are not accepted as this case study's production canonical identity.

After a domain is selected:

1. Add it to the project, configure and verify DNS/TLS, and choose one canonical origin. Redirect any alternate domain permanently to that origin.
2. Set `SITE_CANONICAL_URL` to the exact HTTPS canonical origin in Production only.
3. Refresh the Production-scoped release bindings to the approved tag/source/evidence tuple.
4. Move Production branch tracking from `production-hold` to the approved release branch only when ready to deploy.
5. Require Ready status, then run `npm run test:deployment` with both `DEPLOYMENT_BASE_URL` and matching `EXPECTED_CANONICAL_URL`.
6. Repeat route, browser, accessibility, header, network, cache, link, and desktop/mobile Lighthouse checks. Require canonical tags, `og:url`, Open Graph image URL, `robots.txt`, and every sitemap location to use only the selected domain.
7. Update public live-demo links only after all Production checks pass.

## Items that do not require corrective action

- Historical failed Vercel deployment records should remain as provider audit history. They contain no Ready artifact and deleting them would not improve the current source or integration.
- The failed Vercel status on a source-only pull request is expected. Source commits deliberately omit release evidence; only the reviewed evidence child may produce a release deployment.
- The two skipped live-provider test files are not silent product failures. They are explicit credential-dependent validations, remain blocked, and are never counted as successful live evidence.
- Preview `X-Robots-Tag: noindex` behavior is provider-controlled and appropriate for a non-production artifact. Production SEO thresholds still apply on the eventual custom domain.
- No Vercel Pro upgrade or additional team collaborator is required for the approved single-owner flow now that the authenticated GitHub identity and repository-scoped Vercel App installation are connected.
