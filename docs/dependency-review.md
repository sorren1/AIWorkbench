# Dependency review process

Dependabot version proposals are enabled after completion of the sanitized public-history publication audit. Weekly npm updates have a five-pull-request limit; monthly GitHub Actions updates have a two-pull-request limit. These bounded queues keep maintenance visible without allowing automated proposals to bypass review.

Dependencies are exact-versioned in `package.json` and resolved through the committed npm lockfile. Actions remain pinned to reviewed full commit SHAs. Dependabot branches are review inputs, not accepted release lineage: an approved update enters a release branch through an owner-authored reviewed commit that preserves the repository's narrow public-history identity policy.

The public-history check recognizes the exact Dependabot author plus GitHub web-committer pair only while that commit remains outside `HEAD` and annotated-tag lineage. The same commit becomes release-blocking if it enters either boundary, so a green proposal branch cannot substitute for owner-authored acceptance.

For each dependency change:

1. inspect the direct and transitive lockfile diff, release notes, runtime purpose, and license;
2. confirm the package is maintained and that a smaller existing dependency cannot meet the need;
3. run `npm ci` and `npm run check:all` from a clean checkout; the aggregate includes the lockfile vulnerability gate, license policy, five SBOMs, exact sandbox/LiteLLM/PostgreSQL image scans, LiteLLM signature verification, and browser/performance checks;
4. verify that browser bundles, network behavior, CSP, and performance measurements did not expand unexpectedly;
5. keep GitHub Actions pinned to reviewed full commit SHAs and retain the human-readable version comment;
6. reject newly introduced moderate-or-higher known vulnerabilities through the pull-request dependency-review workflow.

The Lighthouse CI dependency currently needs `tmp` and `uuid` resolutions newer than its declared transitive graph. `package.json` records narrow overrides. Remove an override only after the upstream graph resolves to an equal or newer safe version and the release gate passes.

The v1.0.9 source also pins two narrow transitive security overrides reviewed on 2026-07-22. `fast-uri` 3.1.4 resolves [GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx) through AJV's compatible `^3.0.1` range. `@hono/node-server` 2.0.11 resolves [GHSA-frvp-7c67-39w9](https://github.com/advisories/GHSA-frvp-7c67-39w9) while the v1 MCP SDK still declares `^1.19.9`; this repository imports only the SDK's stdio client/server transports, but the complete locked graph remains subject to the vulnerability gate. Clean install, MCP integration, type, unit, build, license, SBOM, and full release checks must pass with these resolutions. Remove either override when the owning upstream graph resolves to an equal or newer non-vulnerable version.

The first v1.0.9 hosted Quality run on 2026-07-22 failed closed after Trivy reported `CVE-2026-59885` and `CVE-2026-59886` in the upstream LiteLLM image's `pyasn1` 0.6.3 installation. Both findings name 0.6.4 as the fixed version. The derivative image now hash-pins the official universal wheel for `pyasn1` 0.6.4 (`sha256:deda9277cfd454080ec40b207fb6df82206a3a2688735233cdcd8d3d565f088b`), installs it with `--no-deps --require-hashes`, asserts the installed version during the image build, and enforces the same version through the generated SBOM package floor. The failed [Quality run](https://github.com/sorren1/AIWorkbench/actions/runs/29945604301) and its restricted scanner artifact remain the audit record for the rejected image; a later successful exact-commit run is required before release.

A clean install currently emits transitive deprecation notices from Lighthouse CI's `chrome-launcher` chain, CycloneDX's optional XML/native tooling chain, and E2B's `glob` dependency. The recorded audit has no vulnerability finding for those resolved versions, but deprecation is maintenance debt rather than a security pass. Re-check the owner paths with `npm explain`, prefer upstream upgrades over broad overrides, and remove optional/native packages only when CycloneDX generation remains schema-valid on all supported platforms.

Dependency review is evidence about the checked-in graph at review time, not a guarantee that a package or advisory database will remain unchanged. The public repository has Dependabot security updates enabled; release branches still require the Quality, dependency-review, CodeQL, exact-history, and supply-chain controls for the exact accepted source.
