# Vercel deployment verification

- Status: Preview verified; GitHub automation blocked on account connection; Production deferred
- Review date: 2026-07-17
- Git branch: `codex/vercel-deployment`
- Release baseline: `v1.0.0` at `cf42eee54649812b91b04c9494b4dc7a0d935ea5`
- Deployment configuration commit: `7e833645cdabb652e8102532a0a3016b3255d030`
- Source repository: <https://github.com/sorren1/AIWorkbench>
- Preview URL: <https://ai-delivery-workbench-1828w6v09-workbench1.vercel.app>
- Production URL: Not created. No custom domain has been selected or verified.

This record distinguishes tracked readiness from provider evidence. A local build, a `vercel.json` file, or an account dashboard is not a deployed preview and is not evidence of edge headers, DNS, TLS, or route behavior.

## Local pre-deployment evidence

| Check                                  | Result | Evidence                                                                                                                    |
| -------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------- |
| Clean lockfile install                 | PASS   | `npm ci` added 766 packages and reported zero npm audit vulnerabilities.                                                    |
| Complete release gate                  | PASS   | `npm run check:all` exited zero in 327.6 seconds.                                                                           |
| Unit/integration coverage suite        | PASS   | 21 files passed, 2 live-provider files skipped; 116 tests passed and 2 skipped.                                             |
| Browser/E2E/accessibility/visual suite | PASS   | Chromium, Firefox, WebKit, and visual projects: 137 passed, 2 documented clipboard-capability skips.                        |
| Evidence and supply-chain validation   | PASS   | Recorded sandbox/schema/trace evidence validated; six supply-chain controls passed with no suppressions.                    |
| Production build and static links      | PASS   | Vite emitted the multi-page `dist/` tree; 116 Markdown links across 54 documents and static HTML routes passed.             |
| Bundle budgets                         | PASS   | Case study 11,537 B gzip; demo entry 110,555 B gzip; total JavaScript 125,519 B gzip.                                       |
| Local Lighthouse assertions            | PASS   | Desktop and mobile case-study/demo profiles passed the checked-in thresholds. These results are local, not hosted evidence. |

## Tracked deployment contract

| Setting                  | Value                                               | Reason                                                                                             |
| ------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Framework                | Vite                                                | The repository already produces a conventional multi-page static build.                            |
| Install                  | `npm ci`                                            | Uses only the tracked lockfile.                                                                    |
| Build                    | `npm run build`                                     | Runs the normal production build.                                                                  |
| Output                   | `dist`                                              | Contains root case study, article, `/demo/`, `404.html`, metadata, and local assets.               |
| Routing                  | Vercel filesystem routing                           | No SPA rewrite; direct page refreshes and `404.html` retain their intended behavior.               |
| Hashed assets            | `/assets/immutable/`                                | Only Vite-hashed JavaScript and CSS receive a one-year immutable cache directive.                  |
| HTML and unhashed assets | Vercel default `public, max-age=0, must-revalidate` | Avoids stale browser HTML and does not incorrectly mark stable-name assets immutable.              |
| Canonical URL            | `SITE_CANONICAL_URL`, Production environment only   | Preview builds omit canonical-dependent tags; the typed parser rejects temporary Vercel hostnames. |
| Production branch        | `main`                                              | Non-production branches and pull requests remain Preview deployments.                              |
| Release commit binding   | `VERCEL_GIT_COMMIT_SHA`                             | Must equal the separately approved, annotated-tag evidence commit or the build fails.              |

`vercel.json` contains no rewrites, functions, or Vercel-specific application runtime. The conventional static `404.html` is the custom not-found document.

The Vercel project setting uses Node 22.x, matching the tracked Node 22 engine and `.nvmrc`. Preview Deployment Protection was disabled so an external browser and automation could audit the static public artifact. The repository contains no protection bypass credential. Every release deployment must additionally provide `APPROVED_DEPLOYMENT_COMMIT_SHA`, `APPROVED_AUDITED_COMMIT_SHA`, and `APPROVED_RELEASE_TAG`; a successful build emits `security/deployment-binding.json` and displays the deployed commit in the public evidence section.

## Preview-first procedure

1. Push `codex/vercel-deployment` to the configured GitHub origin.
2. Create or link the Vercel project without assigning a custom production domain. Keep `main` as the Production Branch and enable the GitHub integration's pull-request comments and automatic Preview deployments.
3. Do not set `SITE_CANONICAL_URL` for Preview. Set it only in the Production environment after the owner has selected the exact HTTPS custom-domain origin or dedicated subpath.
4. Open a pull request from `codex/vercel-deployment`. Record the immutable Preview URL below only after the deployment reports Ready.
5. Run the hosted suite against that URL:

   ```powershell
   $env:DEPLOYMENT_BASE_URL = $previewUrl
   Remove-Item Env:EXPECTED_CANONICAL_URL -ErrorAction SilentlyContinue
   npm run test:deployment
   ```

6. In an external browser, inspect `/`, `/demo/`, `/writing/governing-ai-assisted-delivery/`, and a missing route. Verify keyboard navigation, focus, responsive behavior, and that DevTools Network shows only the Preview origin during ordinary use.
7. Run desktop and mobile Lighthouse audits against `/` and `/demo/`. Apply the repository thresholds: case-study Performance at least 90 and Accessibility, Best Practices, and SEO at least 95; demo Performance at least 85, Accessibility and Best Practices at least 95, and SEO at least 90.
8. Inspect the Preview response headers with `curl.exe --head $previewUrl`. Confirm CSP, Referrer-Policy, X-Content-Type-Options, Permissions-Policy, Cross-Origin-Opener-Policy, and revalidation-safe HTML caching. Inspect one `/assets/immutable/` response and confirm its immutable cache directive.
9. Record every result in the matrix below. Do not merge or promote while any required check is failed or unrun.

## Preview evidence

| Check                                      | Result                           | Evidence                                                                                                                                                                                                                                                                        |
| ------------------------------------------ | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Preview deployment of pushed commit        | PASS                             | Vercel deployment `dpl_6q5rfAAib27w7ga6c7TtMAvvAgpW` reached Ready from the pre-public branch history. Its rewritten configuration commit is `7e833645cdabb652e8102532a0a3016b3255d030`; the historical deployment itself predates the rewrite.                                 |
| Automatic branch and pull-request previews | BLOCKED                          | `vercel git connect` returned HTTP 400 because the new Vercel account does not yet have a GitHub login connection. No claim of automatic Git previews is made until the owner connects GitHub and a subsequent branch push is observed.                                         |
| Smoke and direct refresh                   | PASS                             | Hosted Playwright returned 200 for `/`, `/demo/`, and `/writing/governing-ai-assisted-delivery/`. The external browser opened the case study, guided-demo entry, and article directly.                                                                                          |
| Custom 404 and status code                 | PASS                             | A nonexistent route returned HTTP 404 and the authored `Page not found` content in automation and the external browser.                                                                                                                                                         |
| Hosted axe checks                          | PASS                             | Root and principal demo screen had zero critical or serious findings.                                                                                                                                                                                                           |
| Keyboard and responsive browser review     | PASS                             | The hosted guided walkthrough exposed correct focusable controls and an active Next control; the full keyboard and width matrix had already passed the same production artifact locally.                                                                                        |
| Metadata and preview canonical omission    | PASS                             | Preview HTML omitted canonical and `og:url`; `robots.txt` omitted a Sitemap line and `sitemap.xml` contained no locations. The temporary Vercel URL was not promoted to canonical.                                                                                              |
| Security headers and CSP                   | PASS                             | Observed CSP matched the typed local-only policy, including `frame-ancestors 'none'`; Referrer-Policy, nosniff, Permissions-Policy, and Cross-Origin-Opener-Policy were present.                                                                                                |
| HTML and immutable-asset caching           | PASS                             | HTML returned `public, max-age=0, must-revalidate`; hashed CSS under `/assets/immutable/` returned `public, max-age=31536000, immutable`.                                                                                                                                       |
| Internal/source links                      | PASS                             | Hosted route checks and the configured GitHub source link passed; external source links use safe opener attributes.                                                                                                                                                             |
| External-request inspection                | PASS WITH PROVIDER NOTE          | Application requests were same-origin when automation sent Vercel's documented `x-vercel-skip-toolbar` header. Ordinary Preview browsing may load Vercel's injected `vercel.live` toolbar; that provider request is not present on the local build and is not application code. |
| Desktop Lighthouse                         | PASS WITH PREVIEW SEO LIMITATION | Root and demo scored 100 Performance, 100 Accessibility, and 100 Best Practices. SEO scored 66/63 only because Vercel adds `X-Robots-Tag: noindex` to Preview responses.                                                                                                        |
| Mobile Lighthouse                          | PASS WITH PREVIEW SEO LIMITATION | Root scored 96/100/100 and demo 100/100/100 for Performance/Accessibility/Best Practices. SEO again scored 66/63 because of the provider Preview noindex header. Production SEO thresholds remain unchanged and unverified.                                                     |

## Provider observations during Preview creation

- On an empty project, Vercel CLI 56.3.1 classified the first explicit `--target preview` invocation as Production and assigned only a generated `vercel.app` alias. That deployment was removed immediately, before audit. It had no custom domain and canonical metadata remained absent.
- A subsequent default `vercel deploy` created the expected Preview target. This is the deployment recorded above.
- The project initially defaulted to Node 24.x despite the repository's Node 22 contract. The project setting was corrected to Node 22.x and the recorded Preview was rebuilt after that correction.
- Standard Preview Protection initially redirected automation to Vercel's login page. It was disabled for this public portfolio Preview; the hosted suite was rerun only after direct public access was confirmed.
- Vercel adds `X-Robots-Tag: noindex` to Preview responses. This correctly prevents indexing but lowers hosted Preview Lighthouse SEO. The production SEO gate still requires the repository thresholds on a real custom domain.

## Production promotion and verification

After all Preview checks pass:

1. Select one custom domain, add it to the Vercel project, and configure the required DNS records. Configure any alternate domain to redirect permanently to that one canonical origin.
2. Set `SITE_CANONICAL_URL` to that exact HTTPS origin in the Production environment only. Trigger a fresh Preview if Vercel supports a production-environment test deployment; otherwise review the generated `dist/` locally with the same setting before merging.
3. Merge the reviewed commit to `main`. Do not use an unreviewed dashboard redeploy as a substitute for the Git-backed source commit.
4. Confirm Vercel reports the production deployment Ready and HTTPS valid for the custom domain.
5. Run the hosted suite against production with both environment variables set:

   ```powershell
   $env:DEPLOYMENT_BASE_URL = $productionUrl
   $env:EXPECTED_CANONICAL_URL = $productionUrl
   npm run test:deployment
   ```

6. Re-run the browser, Lighthouse, header, link, and network checks from the Preview procedure. Confirm the canonical tags, `og:url`, Open Graph image URL, `robots.txt` sitemap line, and every `sitemap.xml` location use only the chosen custom domain.
7. Update the README live-demo link only after the final URL exists and these checks pass. Record the deployed commit and tag here; do not move `v1.0.0` to a different commit.

## Production evidence

| Check                                                | Result   | Evidence                                        |
| ---------------------------------------------------- | -------- | ----------------------------------------------- |
| Custom domain and HTTPS                              | NOT RUN  | No domain configured.                           |
| Canonical/robots/sitemap/Open Graph URLs             | NOT RUN  | No domain configured.                           |
| Direct route refresh and custom 404                  | NOT RUN  | No production deployment.                       |
| Hosted accessibility, smoke, link, and network suite | NOT RUN  | No production deployment.                       |
| Security headers and CSP                             | NOT RUN  | No production deployment.                       |
| Desktop/mobile Lighthouse                            | NOT RUN  | No production deployment.                       |
| README final URLs                                    | DEFERRED | Must follow successful production verification. |

## Provider-specific limitations

- GitHub integration and automatic branch/pull-request previews remain blocked until the owner adds a GitHub login connection to the Vercel account.
- Production Branch selection, custom-domain DNS, TLS, canonical environment configuration, and alternate-domain redirects remain unverified provider state.
- Preview authentication is currently disabled for public auditability. If it is re-enabled later, use an owner-controlled verification session; never commit or print a bypass token.
- The project deliberately does not derive canonical metadata from `VERCEL_URL` or `VERCEL_PROJECT_PRODUCTION_URL`, because those values can resolve to temporary `vercel.app` hostnames.
