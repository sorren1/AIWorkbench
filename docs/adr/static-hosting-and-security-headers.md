# ADR: Static Git-backed hosting and security headers

- Status: Accepted; Vercel selected, v1.0.8 Production binding verified
- Date: 2026-07-17
- Decision owners: repository maintainers

## Context

The case study must remain indexable without loading the demo bundle, work on a repository subpath, have no backend/runtime secrets, and apply a restrictive policy matching only local assets. Vercel is the selected Git-backed host. The stable Production origin is `https://tylerwilhite.dev`, with the project at `/workbench/`; v1.0.8 verification is recorded in its hosted [release summary](https://tylerwilhite.dev/security/release-summary.json) and [deployment binding](https://tylerwilhite.dev/security/deployment-binding.json). Preview builds must still omit canonical metadata, and configuration alone remains insufficient evidence for any later release or deployment.

## Decision

Build a Vite multi-page static artifact for Vercel. Keep substantive portfolio-index, case-study, and article HTML at build time and isolate React to the demo entry. Vercel installs from the lockfile with `npm ci`, runs `npm run build`, and publishes `dist/`. Narrow rewrites serve the portfolio index at `/` and map `/workbench/:path*` to the corresponding static output; permanent redirects move former public page routes into that namespace. The conventional `404.html` remains authoritative, and no catch-all SPA rewrite is added.

Use relative/subpath-safe assets, generated canonical/robots/sitemap behavior only when a real canonical origin is configured, and no third-party analytics by default. `SITE_CANONICAL_URL` is a build-only environment setting scoped to Production and is exactly `https://tylerwilhite.dev`; page metadata supplies `/workbench/` paths where appropriate. The typed parser requires an HTTPS origin without credentials, port, query, fragment, or path, and rejects `vercel.app` hostnames so a preview URL cannot silently become canonical.

Emit Vercel configuration for Content-Security-Policy, Referrer-Policy, X-Content-Type-Options, Permissions-Policy, Cross-Origin-Opener-Policy, and anti-framing through `frame-ancestors`. The CSP permits only the local script/style/image/font/connect forms the build uses and does not require `unsafe-eval`. Vite-generated hashed JavaScript and CSS live under `/assets/immutable/` and receive a one-year immutable cache directive. Unhashed assets do not. HTML retains Vercel's revalidation-safe default. Publication must verify the observed edge headers; a committed configuration is not evidence of deployed behavior.

Connect the GitHub repository through Vercel's Git integration. Keep ordinary development and source/evidence review on non-Production refs; the provider's Production ref remains isolated until an approved tagged evidence commit is ready. Pull requests and non-Production branches create Preview deployments. The exact tagged Preview must pass deployment binding, hosted route/header/accessibility/browser/network/cache checks, and Lighthouse review before Production is considered.

## Consequences

- The project can be previewed and audited locally without network calls or credentials.
- The repository has one small host adapter, `vercel.json`; no Vercel application runtime or SDK is introduced.
- Preview omits Production canonical output. A Production build derives canonical HTML, Open Graph, robots/sitemap, and `security.txt` identity only from validated `SITE_CANONICAL_URL=https://tylerwilhite.dev`.
- Preview and production evidence remain separate. A successful local build does not prove custom-domain DNS, TLS, edge headers, or Git integration.
- Alternate custom domains must redirect to the single configured canonical origin in Vercel project settings.
- The v1.0.7 generated deployment binding is immutable Preview evidence only. Version 1.0.8 has separate generated Production records bound to audited source `fc2957843077606a1cdb8fe9101cbed9421fb243` and evidence/deployed commit `1c1c06b8e5c6973604b025b63aafed606b2bd522`.

## Alternatives considered

- **Server-rendered framework:** rejected because there is no dynamic/public backend requirement.
- **Single React SPA:** rejected because the case study should be useful without the demo runtime.
- **GitHub Pages:** not selected because it cannot apply the required response headers without another edge layer.
- **Vercel SPA rewrite:** rejected because the project is a real multi-page static build. The accepted rewrites are limited to the root portfolio entry and `/workbench/` namespace; they do not catch arbitrary missing routes or hide the custom 404 behavior.
- **Third-party analytics on by default:** rejected because it adds unnecessary tracking, network, and policy surface.
