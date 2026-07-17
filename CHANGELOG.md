# Changelog

All notable changes to AI Delivery Workbench are recorded here. The project follows [Semantic Versioning](https://semver.org/) for public release labels.

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
