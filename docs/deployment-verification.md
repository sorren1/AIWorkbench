# Vercel deployment verification

## Release boundary

- Release source-boundary date: 2026-07-22
- Source repository: <https://github.com/sorren1/AIWorkbench>
- Vercel project: `workbench1/ai-delivery-workbench`
- Production origin: [https://tylerwilhite.dev](https://tylerwilhite.dev)
- Workbench URL: [https://tylerwilhite.dev/workbench/](https://tylerwilhite.dev/workbench/)
- Verified predecessor at the v1.0.9 source boundary: [`v1.0.8`](https://github.com/sorren1/AIWorkbench/tree/v1.0.8)
- Audited source: [`fc2957843077606a1cdb8fe9101cbed9421fb243`](https://github.com/sorren1/AIWorkbench/commit/fc2957843077606a1cdb8fe9101cbed9421fb243)
- Evidence/deployed commit: [`1c1c06b8e5c6973604b025b63aafed606b2bd522`](https://github.com/sorren1/AIWorkbench/commit/1c1c06b8e5c6973604b025b63aafed606b2bd522)
- Live release summary: [hosted generated record](https://tylerwilhite.dev/security/release-summary.json)
- Live deployment identity: [hosted generated binding](https://tylerwilhite.dev/security/deployment-binding.json)
- Previous immutable release: `v1.0.7`
- v1.0.7 audited source: `7cb0e186c8d3225908fcfeed8df8c8e143ff0ed6`
- v1.0.7 evidence/deployed commit: `af3b0b3554d9a26d4d9538eb2fc5626e84342827`
- Historical verified artifact: [exact v1.0.7 Preview](https://ai-delivery-workbench-e7sfli7i9-workbench1.vercel.app/)

The v1.0.7 artifact remains a verified Preview, not Production. Version 1.0.8 has its own completed lineage: the audited source contains no public summary, its direct evidence child adds only that generated file, and annotated tag `v1.0.8` points to the child. Version 1.0.9 begins a separate audited-source lineage. The live hosted summary and deployment binding, rather than this source-state paragraph, identify which exact tagged artifact is currently deployed.

### Historical domain configuration snapshot — 2026-07-20

The following bullets record the pre-release state observed on 2026-07-20. They are retained as deployment history and are superseded as current status by the completed v1.0.8 Production result above.

- The Vercel account owns a domain record for `tylerwilhite.dev`, and the linked project has Production-only `SITE_CANONICAL_URL=https://tylerwilhite.dev` configured.
- Vercel refused to assign the domain to `workbench1/ai-delivery-workbench` because the project's latest Production deployment is an error. Its retained build log shows the intended fail-closed reason: the Production environment did not provide `APPROVED_DEPLOYMENT_COMMIT_SHA`. No older Preview was promoted and no approval binding was invented to bypass that release boundary.
- Authoritative DNS remains with Porkbun and does not point to the Vercel project. Vercel currently recommends apex record `A 76.76.21.21`; re-inspect the provider's live instructions at cutover rather than treating this snapshot as an evergreen DNS value.
- At that time, apex or `www` DNS was not to change until the exact v1.0.8 evidence artifact was Ready, the domain assignment succeeded, and the alternate-host redirect was configured. Those provider settings alone did not establish deployment, DNS, TLS, or Production success.

## Durable evidence sources

Use generated, commit-bound records instead of copying provider run numbers into status prose:

- [v1.0.8 generated deployment binding](https://tylerwilhite.dev/security/deployment-binding.json) — exact release tag, audited source, evidence parent, evidence/deployed commit, CodeQL source/result, and verified Production relation;
- [v1.0.8 generated release summary](https://tylerwilhite.dev/security/release-summary.json) — sanitized local supply-chain controls, artifact hashes, source digest, runtime-image digests, suppressions, and hosted CodeQL binding;
- [`v1.0.8` annotated tag](https://github.com/sorren1/AIWorkbench/tree/v1.0.8) — points to evidence/deployed commit `1c1c06b8e5c6973604b025b63aafed606b2bd522`;
- [v1.0.8 audited source](https://github.com/sorren1/AIWorkbench/commit/fc2957843077606a1cdb8fe9101cbed9421fb243) and [direct evidence child](https://github.com/sorren1/AIWorkbench/commit/1c1c06b8e5c6973604b025b63aafed606b2bd522);
- [v1.0.7 generated deployment binding](https://ai-delivery-workbench-e7sfli7i9-workbench1.vercel.app/security/deployment-binding.json) — exact release tag, audited source, evidence parent, evidence/deployed commit, CodeQL source/result, and verified relation;
- [v1.0.7 generated release summary](https://ai-delivery-workbench-e7sfli7i9-workbench1.vercel.app/security/release-summary.json) — sanitized local supply-chain controls, artifact hashes, source digest, runtime-image digests, suppressions, and hosted CodeQL binding;
- [`v1.0.7` annotated tag](https://github.com/sorren1/AIWorkbench/tree/v1.0.7) — immutable Git release boundary;
- [`v1.0.7` audited source](https://github.com/sorren1/AIWorkbench/commit/7cb0e186c8d3225908fcfeed8df8c8e143ff0ed6) and [evidence commit](https://github.com/sorren1/AIWorkbench/commit/af3b0b3554d9a26d4d9538eb2fc5626e84342827).

The v1.0.8 audited-source tree omits `public/security/release-summary.json` by design. Its evidence-child tree contains the generated summary after fresh hosted CodeQL and all other gates succeeded. The deployment binding is build-generated and therefore exists only on the correctly bound deployed artifact, not in either Git tree.

## v1.0.7 Preview disposition

The immutable v1.0.7 source and evidence commits each received successful hosted Quality, dependency-review, and CodeQL results. The tagged evidence commit reached a Ready Vercel Preview. Direct inspection on 2026-07-19 observed 200 responses for `/`, `/demo/`, `/writing/governing-ai-assisted-delivery/`, the generated release summary, the generated deployment binding, and `/.well-known/security.txt`; a nested unknown route returned the authored page with status 404.

The same inspection found two release defects, so the Preview was not promoted to Production:

1. `/.well-known/security.txt` declared a different temporary Preview hostname as `Canonical` instead of deriving identity from the stable site origin.
2. The nested 404 response used `./` asset and recovery-link URLs, which resolve under the missing route rather than at the site root.

Version 1.0.8 contains source and test fixes for both findings. Their local presence was not hosted verification; the later release procedure re-observed the exact tagged artifact before Production. The current generated binding, rather than this historical v1.0.7 disposition, is authoritative for v1.0.8 deployment identity.

Earlier release-iteration history remains immutable: v1.0.3 and v1.0.4 were untagged audit attempts, v1.0.5 was a tagged Preview rejected by its hosted accessibility result, and v1.0.6/v1.0.7 superseded those candidates. None is represented as Production.

## v1.0.9 audited-source boundary

This source revision begins the v1.0.9 release lineage and deliberately removes the inherited public release summary. It does not inherit v1.0.8 hosted or Production evidence. The exact merged default-branch source must pass Quality and CodeQL; the hosted release-evidence workflow must then bind that CodeQL result and rerun the full Linux supply-chain gate. The downloaded summary may become the only change in one direct evidence child, and annotated tag `v1.0.9` must point to that child before any deployment is approved.

After deployment, dispatch the commit-bound post-deployment workflow with the canonical origin, evidence/deployed child SHA, `v1.0.9` tag, and audited parent SHA. Only a successful hosted run against the matching live binding can establish the v1.0.9 Production behavior result. Until those steps are directly observed, the live generated v1.0.8 records remain the verified predecessor and the existing Production deployment must not be changed.

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

## v1.0.8 exact Preview procedure — completed release procedure

The numbered steps below are retained as the pre-release procedure that separated Preview from Production. They are historical for v1.0.8 and remain a reusable pattern for a later release; they are not current-status to-dos.

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

## v1.0.8 Production gate — completed release procedure

Only the exact v1.0.8 tagged evidence artifact that passed the Preview procedure was eligible for Production at `https://tylerwilhite.dev`, with the Workbench rooted at `/workbench/`.

1. Configure the stable domain, DNS, TLS, and permanent redirects so `www.tylerwilhite.dev` resolves to `https://tylerwilhite.dev` and legacy Workbench page routes resolve beneath `/workbench/`.
2. Set Production-only `SITE_CANONICAL_URL` to exactly `https://tylerwilhite.dev` and set the three Production release bindings to the approved v1.0.8 tag/source/evidence tuple.
3. Change the provider's Production branch/ref only as required to deploy the exact tagged evidence commit; do not treat an ordinary development branch as the approval boundary.
4. Require Ready status, then run `npm run test:deployment` with `DEPLOYMENT_BASE_URL=https://tylerwilhite.dev` and `EXPECTED_CANONICAL_URL=https://tylerwilhite.dev`.
5. Require the generated deployment binding to identify v1.0.8 and the exact audited source/evidence/deployed relation.
6. Repeat route, nested-404, maintained-browser, axe, keyboard/focus, responsive, header, cache, network, and desktop/mobile Lighthouse verification.
7. Require the portfolio canonical to be `https://tylerwilhite.dev/`, Workbench canonical URLs to remain beneath `https://tylerwilhite.dev/workbench/`, and `robots.txt`, sitemap locations, Open Graph URLs, and the RFC 9116 `Canonical` field to use the same origin and intended paths.
8. Only after those observations may public live-demo links or a release report call v1.0.8 Production.

## Commit-bound post-deployment verification

The manually dispatchable `Commit-bound production verification` workflow retains behavior evidence after a site is live without requiring Vercel credentials. Its four required inputs are the canonical Production origin, full deployed evidence SHA, release tag, and full audited parent SHA. The workflow rejects Preview `vercel.app` origins and performs these checks in order:

1. Fetch `/security/deployment-binding.json` without following redirects. Require its strict schema, verified relation, evidence/deployed SHA, release tag, audited/evidence-parent SHA, and CodeQL source SHA to match the requested candidate.
2. Fetch `/.well-known/security.txt` without following redirects and require its single `Canonical` field to identify the same origin. An operator label, copied binding, redirect, or Preview hostname is insufficient.
3. Run `npm run test:deployment` with both `DEPLOYMENT_BASE_URL` and `EXPECTED_CANONICAL_URL` set to that origin. The retained sanitized result identifies browser, accessibility, same-origin network, security-header, and cache-control outcomes; raw Playwright output remains a restricted 14-day artifact.
4. Run desktop and mobile Lighthouse against `/`, `/workbench/`, and `/workbench/demo/`. Hosted mode rejects an unexpected final origin, a duplicate result, a missing route/profile, or a failed assertion. Raw Lighthouse reports remain a restricted 14-day artifact.
5. Validate and retain the small `post-deployment-summary.json` artifact for 90 days. It contains only the canonical origin, bound release identities, workflow/run identity, timestamp, tool versions, sanitized control counts/statuses, route/profile scores, and overall state. Runtime schema validation rejects raw headers, bodies, HTML, cookies, authorization data, logs, screenshots, traces, and undeclared fields.

Run it from GitHub Actions with the exact candidate tuple. A local implementation check may use the same public inputs, but its summary is labeled `LOCAL` and cannot pass `npm run post-deployment:evidence:validate`, which requires GitHub Actions run identity. The workflow appends only sanitized identities and links to the GitHub job summary. It neither deploys the site nor alters the v1.0.8 tag or release summary.

No retained post-deployment artifact is claimed here until a successful hosted workflow run is directly observed. Publishing the workflow commit and dispatching it require GitHub write authority; the behavior checks themselves require only the public canonical URL after deployment.

## Current v1.0.8 Production result and limits

- Hosted Quality and CodeQL completed against audited source `fc2957843077606a1cdb8fe9101cbed9421fb243` and evidence child `1c1c06b8e5c6973604b025b63aafed606b2bd522`; the generated release summary binds the zero-finding [CodeQL run](https://github.com/sorren1/AIWorkbench/actions/runs/29789562556) to the audited source.
- Evidence child `1c1c06b8e5c6973604b025b63aafed606b2bd522` adds only `public/security/release-summary.json`, and annotated tag `v1.0.8` points to that child.
- The hosted release summary matches the checked-in evidence-child summary. The hosted deployment binding reports audited source `fc2957843077606a1cdb8fe9101cbed9421fb243`, evidence/deployed commit `1c1c06b8e5c6973604b025b63aafed606b2bd522`, tag `v1.0.8`, the audited-source CodeQL result, and a verified relation.
- The exact tagged artifact is deployed in Production at `https://tylerwilhite.dev`, with the Workbench at `https://tylerwilhite.dev/workbench/`. Any release Preview remains a Preview and is not the Production evidence cited here.

This result does not establish Production reliability, availability, an SLA, authenticated/shared identity, durable multi-user approvals or state, operational readiness for an agent service, real external integrations, safe multi-tenant execution, live E2B, or live LiteLLM/provider validation. Historical failed provider attempts remain provider audit history and are not successful evidence. A local build, provider dashboard configuration, GitHub status, or Ready Preview cannot substitute for the generated Production binding.
