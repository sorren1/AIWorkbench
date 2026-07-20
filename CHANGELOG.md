# Changelog

All notable changes to AI Delivery Workbench are recorded here. The project follows [Semantic Versioning](https://semver.org/) for public release labels.

## [1.0.8](docs/releases/1.0.8.md) — 2026-07-20

Evidence policy: this entry describes the source contents only. A v1.0.8 tag, hosted controls, Preview artifact, and Production deployment are accepted only through the generated release summary and deployment binding described in the release notes.

### Added

- durable v1.0.8 release notes and deployment-verification records that distinguish the v1.0.7 Preview baseline, the v1.0.8 source candidate, and the intended Production origin;
- an automated alignment check for the package, lockfile, web manifest, case-study footer, and demo footer version labels;
- hosted deployment coverage for nested missing routes and Production-derived RFC 9116 canonical identity.
- a static portfolio index for `tylerwilhite.dev` that links into the independently implemented Workbench without turning the origin page into the Workbench itself.

### Changed

- aligned the package, lockfile, web manifest, case-study footer, and interactive-demo footer on version `1.0.8`;
- moved the stable `security.txt` disclosure fields into a source template and made canonical identity build-derived from the validated Production origin;
- restored bounded Dependabot queues after the public-history publication audit: five weekly npm proposals and two monthly GitHub Actions proposals;
- replaced release-iteration prose and hand-maintained run-status narration with links to generated release/deployment evidence and immutable commit boundaries.
- scoped the hosted case study, article, and interactive prototype beneath `/workbench/`; retained their simple local development routes and added permanent redirects from the former hosted page locations.
- kept release identity fail-closed for Vercel Preview and Production while allowing `VERCEL_ENV=development` to exercise the provider's local development adapter without fabricated release evidence.
- distinguished provider-created review refs from accepted release lineage: exact Dependabot and discarded GitHub squash identities are recognized only outside `HEAD` and annotated tags, while all reachable content remains audited.

### Fixed

- made the custom 404 page use root-relative assets and navigation so it remains functional at nested missing routes;
- prevented a Preview hostname from remaining hard-coded as the canonical RFC 9116 security record.
- allowed bounded extra startup time for process-backed Vitest suites and parallel local WebKit workflows so Windows release-gate runs do not fail at framework timing defaults while the same assertions pass independently; retries remain disabled and CI retains its existing limit.
- kept the public-history identity gate compatible with restored Dependabot proposal branches without permitting bot-authored or GitHub-web-committed changes into a release.

### Security

- the audited v1.0.8 source intentionally carries no inherited `public/security/release-summary.json`; fresh CodeQL and supply-chain evidence must be generated in the permitted one-file evidence child;
- E2B and live LiteLLM/provider paths remain credential-gated and are not promoted to validated capabilities;
- `https://tylerwilhite.dev` is the intended Production origin and `https://tylerwilhite.dev/workbench/` is the intended Workbench URL; neither value is evidence that Production deployment, DNS, TLS, headers, canonical metadata, or route checks have passed.

## [1.0.7] — 2026-07-19

Status: immutable tag and evidence commit with a Ready Vercel Preview. The artifact was not promoted to Production.

### Changed

- connected the FIN-1150 change-target, reviewer checklist, acceptance, security, accessibility, and validator decisions to the browser-local release gates;
- preserved sequential validation evidence instead of replacing earlier review state;
- recorded the release summary as the sole change in evidence commit `af3b0b3554d9a26d4d9538eb2fc5626e84342827`, directly above audited source `7cb0e186c8d3225908fcfeed8df8c8e143ff0ed6`.

### Verified for that release only

- hosted Quality, dependency review, and CodeQL completed successfully for the immutable v1.0.7 boundaries;
- the exact tagged evidence commit reached a Ready Preview and emitted a verified [deployment binding](https://ai-delivery-workbench-e7sfli7i9-workbench1.vercel.app/security/deployment-binding.json).

### Not promoted

- post-Preview inspection found a stale Preview canonical value in `security.txt` and route-relative assets/links on nested 404 responses; v1.0.8 contains the fixes;
- no Production, custom-domain, DNS, TLS, or Production canonical verification was recorded.

## [1.0.0] — 2026-07-17

Status: independently audited local release. No deployment, push, or hosted-CI success is claimed.

### Added

- statically rendered case study, technical article, custom 404, metadata, sitemap, and static-host security headers;
- strict-TypeScript React demo with accessible workflow screens, deterministic scenarios, deep links, local actions, guided tour, and responsive desktop boundary;
- versioned agent/tool/model/memory/approval registries, capability cards, scoped authorization, durable local approval protocol, context manifests, and stale-state propagation;
- fixture-only Docker sandbox with fixed patch/validation flow, versioned evidence, normalized OpenTelemetry-compatible traces, and enforced execution budgets;
- optional E2B sandbox and scoped local LiteLLM gateway adapters, both explicitly credential-gated and not live-validated in this revision;
- unit/component, cross-browser Playwright, axe, visual capture, performance, evidence, security, and supply-chain quality gates;
- CycloneDX SBOM generation, secret/history scanning, SAST, dependency/container scanning, license policy, CodeQL/dependency-review workflows, and sanitized release evidence.

### Changed

- migrated the original browser-side React/Babel prototype to a conventional Vite multi-page build with local dependencies and no runtime CDN/font requests;
- repositioned all public copy as an independent portfolio prototype and separated functional, synthetic, measured, estimated, and professional-context claims;
- refactored interaction semantics, overlays, keyboard navigation, focus handling, contrast, motion, and responsive behavior;
- curated the active branch around one maintained UI implementation and the latest validated evidence snapshot.

### Fixed

- enforced LF checkouts through `.gitattributes` so a clean Windows clone with `core.autocrlf=true` passes the reproducible formatting gate.
- removed a lazy-screen integration-test race by giving the asynchronous Control Plane assertion an explicit bounded wait.

### Removed

- generated standalone UI/export backups, design-system bundle/manifest/adherence exports, interview-specific packaging, and unreferenced guideline specimens;
- browser globals, ordered script loading, development React/Babel CDNs, runtime font requests, and duplicate legacy implementation files.

### Security

- the public site exposes no live code execution, arbitrary repository/patch/command input, model-provider credential, or external write path;
- hashes bind recorded evidence but are not signatures or trusted attestations;
- optional provider paths require separate owner credentials and validation.

See [the complete 1.0.0 release notes](docs/releases/1.0.0.md).
