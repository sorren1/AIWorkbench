# Release security evidence

## Reproducible command

Prerequisites are the pinned Node version, a clean `npm ci`, Git history, and Docker Engine with Linux containers. Run:

```powershell
npm run security:supply-chain
```

The first run may download the immutable Gitleaks, Trivy, and Cosign images, Trivy's current vulnerability database, the digest-pinned Node and LiteLLM bases, and the exact PostgreSQL image. Scanner images, versions, base digests, package floors, thresholds, and runtime targets are declared in `security/tooling.json`.

`npm run security:supply-chain:record` performs the same gate and, only after success, refreshes the small sanitized `public/security/release-summary.json` used by the case study. The record identifies a Git base commit and a digest of the scanned source worktree; it does not pretend a pre-commit worktree is already the eventual commit.

## Generated artifacts

The gitignored `.security-reports/` directory contains:

| Artifact                  | Purpose                                                                          |
| ------------------------- | -------------------------------------------------------------------------------- |
| `security-summary.md`     | Human-readable outcome with no source or secret values                           |
| `release-summary.json`    | Sanitized control/result/source/artifact digest record                           |
| `scanner-metadata.json`   | Tool versions, immutable scanner images, Docker version, and every target digest |
| `gitleaks-*.sarif`        | Redacted worktree and history results                                            |
| `eslint.sarif`            | TypeScript/JavaScript static-analysis results without snippets                   |
| `container-policy.sarif`  | Compose, Dockerfile, and language-coverage policy results                        |
| `sandbox-image.sarif`     | Trivy high/critical image vulnerability results                                  |
| `litellm-image.sarif`     | Trivy high/critical results for the exact patched LiteLLM runtime                |
| `postgres-image.sarif`    | Trivy high/critical results for the exact PostgreSQL runtime                     |
| `license-policy.sarif`    | Unknown, denied, or disallowed license results                                   |
| `npm-production.cdx.json` | Reproducible CycloneDX SBOM for the locked production npm graph                  |
| `npm-all.cdx.json`        | Reproducible CycloneDX SBOM for runtime and development dependencies             |
| `sandbox-image.cdx.json`  | CycloneDX SBOM for the exact scanned sandbox image ID                            |
| `litellm-image.cdx.json`  | CycloneDX SBOM for the exact scanned LiteLLM image ID                            |
| `postgres-image.cdx.json` | CycloneDX SBOM for the exact scanned PostgreSQL image ID                         |
| `litellm-signature.json`  | Sanitized Cosign result bound to the upstream LiteLLM digest and pinned key      |
| `license-inventory.json`  | Component/version/scope/license inventory                                        |
| `npm-audit.json`          | Machine-readable lockfile vulnerability result                                   |
| `suppression-report.json` | Active exceptions and unsuppressed count                                         |

CI uploads this directory as a 14-day artifact. No detailed generated scan report or SBOM is committed. SARIF source contents, snippets, proposed fixes, and attachments are removed before upload; Gitleaks receives `--redact=100`; public job output prints counts and statuses only.

## Enforcement policy

- All secret findings fail.
- ESLint and repository container-policy findings fail.
- npm and container HIGH/CRITICAL findings fail, including findings already present; the enforced count is zero after exact, documented, unexpired suppressions.
- The sandbox, LiteLLM, and PostgreSQL runtime images are each resolved to an exact local content ID, Trivy-scanned, and assigned a validated CycloneDX SBOM.
- LiteLLM must meet the configured Python, `ddtrace`, and `mcp` floors, retain numeric non-root user `65534`, and derive from an upstream digest whose Cosign signature verifies with the commit-pinned LiteLLM key.
- Missing or disallowed license declarations fail.
- SBOM generation and CycloneDX validation failures fail.
- A new tracked Python, shell, PowerShell, or additional Dockerfile source fails until an explicit scanner is added.
- Missing Docker, scanner downloads, advisory databases, or package registry access are failures, not passes. The exact environmental blocker must be reported.

## Suppression protocol

`security/suppressions.json` is the only release exception ledger. Each entry requires:

- `id` in `SUP-YYYY-NNN` format;
- `scanner` and exact `ruleId`;
- exact public `path` or target identifier;
- a specific risk-based `reason`;
- `reviewer` role/name suitable for the public repository;
- `reviewOn`; and
- `expiresOn`.

The scanner report retains the original finding. The orchestrator matches the documented entry before applying policy, records the active suppression, and fails on malformed, duplicate, expired, path-mismatched, or unused entries. The only current exceptions are the exact-digest PostgreSQL `gosu` findings reviewed in [`postgres-gosu-reachability.md`](postgres-gosu-reachability.md); they expire on 2026-08-15.

## GitHub-only controls

Pull requests run GitHub dependency review and the complete local-equivalent gate. CodeQL uses GitHub's JavaScript/TypeScript extractor and `security-extended` queries in a separate SHA-pinned workflow. CodeQL cannot be honestly marked executed by a local run; the checked-in summary therefore reports `CONFIGURED_NOT_RUN` until hosted evidence exists.
