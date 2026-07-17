# ADR: Static Git-backed hosting and security headers

- Status: Accepted; Vercel selected, hosted verification pending
- Date: 2026-07-17
- Decision owners: repository maintainers

## Context

The case study must remain indexable without loading the demo bundle, work on a repository subpath, have no backend/runtime secrets, and apply a restrictive policy matching only local assets. Vercel is the selected Git-backed host. A final custom domain is not yet configured, so canonical metadata must remain absent from preview builds.

## Decision

Build a Vite multi-page static artifact for Vercel. Keep substantive case-study/article HTML at build time and isolate React to `/demo/`. Vercel installs from the lockfile with `npm ci`, runs `npm run build`, and publishes `dist/`. Filesystem routing serves the emitted page directories and conventional `404.html`; do not add a catch-all SPA rewrite.

Use relative/subpath-safe assets, generated canonical/robots/sitemap behavior only when a real canonical URL is configured, and no third-party analytics by default. `SITE_CANONICAL_URL` is a build-only environment setting scoped to Production. The typed parser requires HTTPS, rejects credentials/query/fragment values, and rejects `vercel.app` hostnames so a preview URL cannot silently become canonical.

Emit Vercel configuration for Content-Security-Policy, Referrer-Policy, X-Content-Type-Options, Permissions-Policy, Cross-Origin-Opener-Policy, and anti-framing through `frame-ancestors`. The CSP permits only the local script/style/image/font/connect forms the build uses and does not require `unsafe-eval`. Vite-generated hashed JavaScript and CSS live under `/assets/immutable/` and receive a one-year immutable cache directive. Unhashed assets do not. HTML retains Vercel's revalidation-safe default. Publication must verify the observed edge headers; a committed configuration is not evidence of deployed behavior.

Connect the GitHub repository through Vercel's Git integration with `main` as the production branch. Pull requests and non-production branches create Preview deployments. Preview must pass the hosted verification suite and Lighthouse review before any production promotion or merge.

## Consequences

- The project can be previewed and audited locally without network calls or credentials.
- The repository has one small host adapter, `vercel.json`; no Vercel application runtime or SDK is introduced.
- Canonical, contact, resume, and live-demo links remain omitted rather than becoming placeholders until their real destinations exist.
- Preview and production evidence remain separate. A successful local build does not prove custom-domain DNS, TLS, edge headers, or Git integration.
- Alternate custom domains must redirect to the single configured canonical origin in Vercel project settings.

## Alternatives considered

- **Server-rendered framework:** rejected because there is no dynamic/public backend requirement.
- **Single React SPA:** rejected because the case study should be useful without the demo runtime.
- **GitHub Pages:** not selected because it cannot apply the required response headers without another edge layer.
- **Vercel SPA rewrite:** rejected because the project is a real multi-page static build and the rewrite would hide the custom 404 behavior.
- **Third-party analytics on by default:** rejected because it adds unnecessary tracking, network, and policy surface.
