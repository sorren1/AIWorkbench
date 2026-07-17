# Vercel deployment verification

- Status: Configuration ready; hosted Preview deployment pending
- Review date: 2026-07-17
- Git branch: `codex/vercel-deployment`
- Release baseline: `v1.0.0` at `bd4c8613bf0f1accce8a4ae5c703b5f659852b30`
- Source repository: <https://github.com/sorren1/AIWorkbench>
- Preview URL: Not created yet. Authenticated Vercel CLI access is available; the configuration must be committed before it is deployed.
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

`vercel.json` contains no rewrites, functions, or Vercel-specific application runtime. The conventional static `404.html` is the custom not-found document.

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

| Check                                   | Result  | Evidence                                                        |
| --------------------------------------- | ------- | --------------------------------------------------------------- |
| Git-backed Preview deployment           | NOT RUN | Requires the committed configuration to be pushed and deployed. |
| Smoke and direct refresh                | NOT RUN | Requires a real Preview URL.                                    |
| Custom 404 and status code              | NOT RUN | Requires a real Preview URL.                                    |
| Hosted axe checks                       | NOT RUN | Requires a real Preview URL.                                    |
| Keyboard and responsive browser review  | NOT RUN | Requires a real Preview URL.                                    |
| Metadata and preview canonical omission | NOT RUN | Requires a real Preview URL.                                    |
| Security headers and CSP                | NOT RUN | Requires a real Preview URL.                                    |
| HTML and immutable-asset caching        | NOT RUN | Requires a real Preview URL.                                    |
| Internal/source links                   | NOT RUN | Requires a real Preview URL.                                    |
| External-request inspection             | NOT RUN | Requires a real Preview URL.                                    |
| Desktop/mobile Lighthouse               | NOT RUN | Requires a real Preview URL.                                    |

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

- Vercel project creation, GitHub integration, Preview creation, Production Branch selection, custom-domain DNS, TLS, and redirects are provider state and cannot be proven from tracked files.
- Vercel's Preview authentication setting can block public automated checks. If enabled, use an owner-controlled verification session; never commit or print a bypass token.
- The project deliberately does not derive canonical metadata from `VERCEL_URL` or `VERCEL_PROJECT_PRODUCTION_URL`, because those values can resolve to temporary `vercel.app` hostnames.
