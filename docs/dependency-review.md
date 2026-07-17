# Dependency review process

Dependencies are exact-versioned in `package.json` and resolved through the committed npm lockfile. Dependabot proposes weekly npm updates and monthly GitHub Actions updates. Automated proposals do not bypass review.

For each dependency change:

1. inspect the direct and transitive lockfile diff, release notes, runtime purpose, and license;
2. confirm the package is maintained and that a smaller existing dependency cannot meet the need;
3. run `npm ci`, `npm audit --audit-level=high`, and `npm run check:all` from a clean checkout;
4. verify that browser bundles, network behavior, CSP, and performance measurements did not expand unexpectedly;
5. keep GitHub Actions pinned to reviewed full commit SHAs and retain the human-readable version comment;
6. reject newly introduced moderate-or-higher known vulnerabilities through the pull-request dependency-review workflow.

The Lighthouse CI dependency currently needs `tmp` and `uuid` resolutions newer than its declared transitive graph. `package.json` records narrow overrides. Remove an override only after the upstream graph resolves to an equal or newer safe version and the release gate passes.

Dependency review is evidence about the checked-in graph at review time, not a guarantee that a package or advisory database will remain unchanged. Repository owners should also enable GitHub's dependency graph, Dependabot security updates, and branch protection for the two quality workflows before publication.
