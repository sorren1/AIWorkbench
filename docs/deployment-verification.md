# Vercel deployment verification

## Release boundary

- Evidence review date: 2026-07-20
- Source repository: <https://github.com/sorren1/AIWorkbench>
- Vercel project: `workbench1/ai-delivery-workbench`
- Intended stable Production origin: `https://tylerwilhite.dev`
- Intended stable Workbench URL: `https://tylerwilhite.dev/workbench/`
- Previous immutable release: `v1.0.7`
- v1.0.7 audited source: `7cb0e186c8d3225908fcfeed8df8c8e143ff0ed6`
- v1.0.7 evidence/deployed commit: `af3b0b3554d9a26d4d9538eb2fc5626e84342827`
- Current verified artifact: [exact v1.0.7 Preview](https://ai-delivery-workbench-e7sfli7i9-workbench1.vercel.app/)
- Intended next release: `v1.0.8`

The v1.0.7 artifact is a verified Preview, not Production. Version 1.0.8 is a separate source candidate and cannot inherit v1.0.7 hosted, CodeQL, deployment, or Production evidence. This document does not record future v1.0.8 CI, Preview, DNS, TLS, or Production work as successful.

### Domain configuration snapshot — 2026-07-20

- The Vercel account owns a domain record for `tylerwilhite.dev`, and the linked project has Production-only `SITE_CANONICAL_URL=https://tylerwilhite.dev` configured.
- Vercel refused to assign the domain to `workbench1/ai-delivery-workbench` because the project's latest Production deployment is an error. Its retained build log shows the intended fail-closed reason: the Production environment did not provide `APPROVED_DEPLOYMENT_COMMIT_SHA`. No older Preview was promoted and no approval binding was invented to bypass that release boundary.
- Authoritative DNS remains with Porkbun and does not point to the Vercel project. Vercel currently recommends apex record `A 76.76.21.21`; re-inspect the provider's live instructions at cutover rather than treating this snapshot as an evergreen DNS value.
- Do not change apex or `www` DNS until the exact v1.0.8 evidence artifact is Ready, the domain assignment succeeds, and the alternate-host redirect is configured. These provider settings do not establish deployment, DNS, TLS, or Production success.

## Durable evidence sources

Use generated, commit-bound records instead of copying provider run numbers into status prose:

- [v1.0.7 generated deployment binding](https://ai-delivery-workbench-e7sfli7i9-workbench1.vercel.app/security/deployment-binding.json) — exact release tag, audited source, evidence parent, evidence/deployed commit, CodeQL source/result, and verified relation;
- [v1.0.7 generated release summary](https://ai-delivery-workbench-e7sfli7i9-workbench1.vercel.app/security/release-summary.json) — sanitized local supply-chain controls, artifact hashes, source digest, runtime-image digests, suppressions, and hosted CodeQL binding;
- [`v1.0.7` annotated tag](https://github.com/sorren1/AIWorkbench/tree/v1.0.7) — immutable Git release boundary;
- [`v1.0.7` audited source](https://github.com/sorren1/AIWorkbench/commit/7cb0e186c8d3225908fcfeed8df8c8e143ff0ed6) and [evidence commit](https://github.com/sorren1/AIWorkbench/commit/af3b0b3554d9a26d4d9538eb2fc5626e84342827).

The v1.0.8 equivalents do not exist in this audited-source tree by design. The source commit must omit `public/security/release-summary.json`; the summary is generated only after fresh hosted CodeQL and all other gates succeed, and the deployment binding is generated only by a correctly bound deployment.

## v1.0.7 Preview disposition

The immutable v1.0.7 source and evidence commits each received successful hosted Quality, dependency-review, and CodeQL results. The tagged evidence commit reached a Ready Vercel Preview. Direct inspection on 2026-07-19 observed 200 responses for `/`, `/demo/`, `/writing/governing-ai-assisted-delivery/`, the generated release summary, the generated deployment binding, and `/.well-known/security.txt`; a nested unknown route returned the authored page with status 404.

The same inspection found two release defects, so the Preview was not promoted to Production:

1. `/.well-known/security.txt` declared a different temporary Preview hostname as `Canonical` instead of deriving identity from the stable site origin.
2. The nested 404 response used `./` asset and recovery-link URLs, which resolve under the missing route rather than at the site root.

Version 1.0.8 contains source and test fixes for both findings. Their local presence is not hosted verification; the v1.0.8 Preview procedure must observe them again on the exact tagged artifact.

Earlier release-iteration history remains immutable: v1.0.3 and v1.0.4 were untagged audit attempts, v1.0.5 was a tagged Preview rejected by its hosted accessibility result, and v1.0.6/v1.0.7 superseded those candidates. None is represented as Production.

## Tracked deployment contract

| Setting              | Value                                                                                   | Boundary                                                                      |
| -------------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Provider/framework   | Vercel / Vite                                                                           | Static multi-page output; no Vercel application runtime.                      |
| Runtime              | Node 22.x                                                                               | Matches `package.json`, `.nvmrc`, CI, and provider configuration.             |
| Install/build/output | `npm ci` / `npm run build` / `dist`                                                     | Reproducible lockfile build.                                                  |
| Routing              | Exact root/Workbench page-to-file rewrites plus legacy-page redirects                   | Portfolio index at `/`; Workbench at `/workbench/`; unknown paths remain 404. |
| Hashed assets        | `/assets/immutable/`                                                                    | Only Vite-hashed JS/CSS receives one-year immutable caching.                  |
| HTML/unhashed assets | `public, max-age=0, must-revalidate`                                                    | Prevents stable-name HTML/assets from becoming stale immutable content.       |
| Production origin    | `SITE_CANONICAL_URL=https://tylerwilhite.dev`                                           | Production only; Preview omits canonical-dependent output.                    |
| Release commit       | `VERCEL_GIT_COMMIT_SHA`                                                                 | Must equal the approved tagged evidence commit.                               |
| Explicit bindings    | `APPROVED_RELEASE_TAG`, `APPROVED_AUDITED_COMMIT_SHA`, `APPROVED_DEPLOYMENT_COMMIT_SHA` | Prevents source, evidence, tag, or deployment substitution.                   |
| Generated identity   | `/security/deployment-binding.json`                                                     | Emitted only when the tag/source/evidence/deployment relationship validates.  |

The typed Production-origin parser requires HTTPS and rejects credentials, a non-default port, query/fragment data, and temporary `vercel.app` hostnames. The same origin drives HTML canonical/Open Graph URLs, `robots.txt`, the sitemap, and `security.txt`. The Vercel Toolbar is disabled for Preview and Production; the CSP does not permit provider toolbar origins or inline/eval script/style exceptions.

## v1.0.8 exact Preview procedure

1. Audit a clean v1.0.8 source commit with no `public/security/release-summary.json` and require the complete local gate.
2. Require successful pull-request and exact-main Quality, dependency-review, and CodeQL results on that exact source commit.
3. Generate the sanitized summary with the exact source/tag/CodeQL inputs and create one direct evidence child whose only changed path is `public/security/release-summary.json`.
4. Require the evidence child checks, create the annotated `v1.0.8` tag on that child, and run `npm run security:release-evidence:require` against the tag.
5. Configure only Preview-scoped release bindings for the approved v1.0.8 tuple. Do not set `SITE_CANONICAL_URL` in Preview.
6. Deploy a non-Production ref pointing exactly to the tag and require Ready status.
7. Run `npm run test:deployment` with `DEPLOYMENT_BASE_URL` set to the immutable Preview URL and `EXPECTED_CANONICAL_URL` unset.
8. Inspect the generated release summary and deployment binding. Require exact tag/source/evidence/deployed/CodeQL values and verified relation.
9. Inspect `/`, `/workbench/`, `/workbench/demo/`, `/workbench/writing/governing-ai-assisted-delivery/`, `/404.html`, nested missing routes, legacy redirects, and `/.well-known/security.txt` in maintained browsers. Verify direct refresh, real 404 status, Workbench recovery actions, keyboard/focus/responsive behavior, and no unexpected external request or toolbar injection.
10. Require `security.txt` to omit `Canonical` on Preview. Verify CSP, Referrer-Policy, nosniff, Permissions-Policy, Cross-Origin-Opener-Policy, HTML revalidation, and immutable caching only for hashed assets.
11. Run hosted desktop/mobile Lighthouse checks for `/`, `/workbench/`, and `/workbench/demo/`, keeping provider-controlled Preview noindex behavior separate from Production SEO.

## v1.0.8 Production gate

Only the exact v1.0.8 tagged evidence artifact that passes the Preview procedure may be considered for Production at `https://tylerwilhite.dev`, with the Workbench rooted at `/workbench/`.

1. Configure the stable domain, DNS, TLS, and permanent redirects so `www.tylerwilhite.dev` resolves to `https://tylerwilhite.dev` and legacy Workbench page routes resolve beneath `/workbench/`.
2. Set Production-only `SITE_CANONICAL_URL` to exactly `https://tylerwilhite.dev` and set the three Production release bindings to the approved v1.0.8 tag/source/evidence tuple.
3. Change the provider's Production branch/ref only as required to deploy the exact tagged evidence commit; do not treat an ordinary development branch as the approval boundary.
4. Require Ready status, then run `npm run test:deployment` with `DEPLOYMENT_BASE_URL=https://tylerwilhite.dev` and `EXPECTED_CANONICAL_URL=https://tylerwilhite.dev`.
5. Require the generated deployment binding to identify v1.0.8 and the exact audited source/evidence/deployed relation.
6. Repeat route, nested-404, maintained-browser, axe, keyboard/focus, responsive, header, cache, network, and desktop/mobile Lighthouse verification.
7. Require the portfolio canonical to be `https://tylerwilhite.dev/`, Workbench canonical URLs to remain beneath `https://tylerwilhite.dev/workbench/`, and `robots.txt`, sitemap locations, Open Graph URLs, and the RFC 9116 `Canonical` field to use the same origin and intended paths.
8. Only after those observations may public live-demo links or a release report call v1.0.8 Production.

## Facts not established by this source candidate

- v1.0.8 hosted Quality, dependency-review, or CodeQL success;
- a generated v1.0.8 release summary, evidence commit, annotated tag, or retained hosted artifacts;
- a Ready v1.0.8 Preview or its generated deployment binding;
- hosted confirmation of the v1.0.8 nested 404 and origin-derived `security.txt` fixes;
- any deployment, DNS, TLS, redirect, canonical, security-header, cache, accessibility, browser, network, or Lighthouse result at `https://tylerwilhite.dev`;
- Production reliability, availability, identity, shared approvals, or operational readiness; or
- live E2B and live LiteLLM/provider validation, which remain blocked by unavailable credentials.

Historical failed provider attempts remain provider audit history and are not successful evidence. A local build, provider dashboard configuration, GitHub status, or Ready Preview cannot substitute for Production verification at `https://tylerwilhite.dev`.
