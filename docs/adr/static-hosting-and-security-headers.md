# ADR: Static Git-backed hosting and security headers

- Status: Accepted; provider selection deferred
- Date: 2026-07-17
- Decision owners: repository maintainers

## Context

The case study must remain indexable without loading the demo bundle, work on a repository subpath, have no backend/runtime secrets, and apply a restrictive policy matching only local assets. No public canonical URL or final host is configured yet.

## Decision

Build a Vite multi-page static artifact for a Git-backed host. Keep substantive case-study/article HTML at build time and isolate React to `/demo/`. Use relative/subpath-safe assets, generated canonical/robots/sitemap behavior only when a real canonical URL is configured, and no third-party analytics by default.

Emit host configuration for Content-Security-Policy, Referrer-Policy, X-Content-Type-Options, Permissions-Policy, and anti-framing through `frame-ancestors`. The CSP permits only the local script/style/image/font/connect forms the build uses and does not require `unsafe-eval`. Publication must verify that the chosen host actually applies these headers; a committed manifest is not evidence of edge behavior.

## Consequences

- The project can be previewed and audited locally without network calls or credentials.
- Host-specific rewrite/header configuration may need a small adapter after a provider is selected.
- Canonical, contact, résumé, and live-demo links remain omitted rather than becoming placeholders.
- Deployment and release tagging remain a separately authorized final phase.

## Alternatives considered

- **Server-rendered framework:** rejected because there is no dynamic/public backend requirement.
- **Single React SPA:** rejected because the case study should be useful without the demo runtime.
- **Third-party analytics on by default:** rejected because it adds unnecessary tracking, network, and policy surface.
