# Dependency review process

Dependabot version proposals are enabled after completion of the sanitized public-history publication audit. Weekly npm updates have a five-pull-request limit; monthly GitHub Actions updates have a two-pull-request limit. These bounded queues keep maintenance visible without allowing automated proposals to bypass review.

Dependencies are exact-versioned in `package.json` and resolved through the committed npm lockfile. Actions remain pinned to reviewed full commit SHAs. Dependabot branches are review inputs, not accepted release lineage: an approved update enters a release branch through an owner-authored reviewed commit that preserves the repository's narrow public-history identity policy.

For each dependency change:

1. inspect the direct and transitive lockfile diff, release notes, runtime purpose, and license;
2. confirm the package is maintained and that a smaller existing dependency cannot meet the need;
3. run `npm ci` and `npm run check:all` from a clean checkout; the aggregate includes the lockfile vulnerability gate, license policy, five SBOMs, exact sandbox/LiteLLM/PostgreSQL image scans, LiteLLM signature verification, and browser/performance checks;
4. verify that browser bundles, network behavior, CSP, and performance measurements did not expand unexpectedly;
5. keep GitHub Actions pinned to reviewed full commit SHAs and retain the human-readable version comment;
6. reject newly introduced moderate-or-higher known vulnerabilities through the pull-request dependency-review workflow.

The Lighthouse CI dependency currently needs `tmp` and `uuid` resolutions newer than its declared transitive graph. `package.json` records narrow overrides. Remove an override only after the upstream graph resolves to an equal or newer safe version and the release gate passes.

A clean install currently emits transitive deprecation notices from Lighthouse CI's `chrome-launcher` chain, CycloneDX's optional XML/native tooling chain, and E2B's `glob` dependency. The recorded audit has no vulnerability finding for those resolved versions, but deprecation is maintenance debt rather than a security pass. Re-check the owner paths with `npm explain`, prefer upstream upgrades over broad overrides, and remove optional/native packages only when CycloneDX generation remains schema-valid on all supported platforms.

Dependency review is evidence about the checked-in graph at review time, not a guarantee that a package or advisory database will remain unchanged. The public repository has Dependabot security updates enabled; release branches still require the Quality, dependency-review, CodeQL, exact-history, and supply-chain controls for the exact accepted source.
