# Security policy

## Supported revision

Security fixes target the current `main` branch. This independent portfolio prototype is a static public site plus explicitly invoked local developer tools; it is not a hosted agent, model, or code-execution service.

## Reporting a vulnerability

Use [GitHub's private vulnerability-reporting form](https://github.com/sorren1/AIWorkbench/security/advisories/new). Do not open a public issue containing a credential, exploit payload, private repository content, or personal information. If GitHub reports that the private form is temporarily unavailable, open a minimal public issue asking the owner to restore the private channel without including sensitive details.

Do not test against systems or accounts outside this repository's synthetic local fixtures. The project does not authorize probing third-party Jira, GitHub, model, database, E2B, or gateway services.

## Release controls

`npm run security:supply-chain` is the reproducible evidence command. It runs:

- Gitleaks over a tracked-worktree snapshot and reachable Git history with full redaction;
- ESLint over TypeScript and JavaScript, plus repository policy checks for Compose and Dockerfile sources;
- npm audit against the committed lockfile;
- Trivy high/critical scans of the exact sandbox, LiteLLM, and PostgreSQL runtime images;
- CycloneDX generation for the production npm graph, complete npm graph, and all three runtime images;
- LiteLLM signature verification, runtime package floors, and container-hardening policy;
- license inventory and policy validation; and
- suppression-schema, expiry, scanner-version, source-digest, and report-hash recording.

GitHub dependency review runs on pull requests. CodeQL is configured separately for JavaScript/TypeScript, and a release requires a successful hosted run against the exact audited commit with no unresolved release-blocking result.

The gate rejects all unsuppressed secrets, static-analysis errors, disallowed/unknown licenses, and high/critical dependency or container vulnerabilities. Detailed SARIF, SBOM, and inventory output is gitignored and uploaded as a short-lived CI artifact. Public logs contain summaries only and scanner reports have source snippets removed.

## Suppressions

Suppressions live only in `security/suppressions.json`. Every entry must include a stable ID, scanner, rule ID, exact path/target, reason, reviewer, review date, and expiry date. Expired, duplicate, malformed, unused, or path-mismatched entries fail the release gate. Current exceptions are restricted to unreachable `gosu` findings in the digest-pinned PostgreSQL image and expire unless they are explicitly re-reviewed or eliminated by a maintained replacement image.

See [release evidence](docs/release-evidence.md), the [threat model](THREAT_MODEL.md), and the [sandbox security model](docs/sandbox-security-model.md) for assurance boundaries and residual risks.
