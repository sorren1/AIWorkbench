# Release security evidence

## Release lineage

Version 1.0.9 begins a fresh release lineage at an audited source that intentionally omits `public/security/release-summary.json`; it cannot inherit any v1.0.8 evidence. Version 1.0.8 is the verified completed predecessor. Its audited source `fc2957843077606a1cdb8fe9101cbed9421fb243` omits the summary, direct child `1c1c06b8e5c6973604b025b63aafed606b2bd522` adds only that generated file, and annotated tag `v1.0.8` points to the child. The hosted [release summary](https://tylerwilhite.dev/security/release-summary.json) and [deployment binding](https://tylerwilhite.dev/security/deployment-binding.json) identify the exact artifact currently deployed at `https://tylerwilhite.dev`, including the Workbench at `/workbench/`.

The immutable v1.0.7 example remains available through its [generated release summary](https://ai-delivery-workbench-e7sfli7i9-workbench1.vercel.app/security/release-summary.json) and [generated deployment binding](https://ai-delivery-workbench-e7sfli7i9-workbench1.vercel.app/security/deployment-binding.json). Those historical Preview records bind audited source `7cb0e186c8d3225908fcfeed8df8c8e143ff0ed6`, evidence/deployed commit `af3b0b3554d9a26d4d9538eb2fc5626e84342827`, tag `v1.0.7`, and its hosted CodeQL result; they are not v1.0.8 evidence.

## Reproducible command

Prerequisites are the pinned Node version, a clean `npm ci`, Git history, and Docker Engine with Linux containers. Run:

```powershell
npm run security:supply-chain
```

The first run may download the immutable Gitleaks, Trivy, and Cosign images, Trivy's current vulnerability database, the digest-pinned Node and LiteLLM bases, and the exact PostgreSQL image. Scanner images, versions, base digests, package floors, thresholds, and runtime targets are declared in `security/tooling.json`.

For v1.0.8, the audited code commit deliberately contained no `public/security/release-summary.json`; the completed evidence child added it only after the local and hosted gates passed. For a later release, run every local and hosted gate against its clean audited commit first. After hosted CodeQL succeeds with zero release-blocking SARIF results, `npm run security:supply-chain:record` requires `AUDITED_RELEASE_COMMIT_SHA`, `RELEASE_TAG`, `CODEQL_RUN_URL`, `CODEQL_RUN_COMMIT_SHA`, and `CODEQL_FINDING_COUNT=0`. It then creates the only permitted evidence-child change: `public/security/release-summary.json`.

When the release operator's machine cannot provide the required Linux Docker engine, the manually dispatched `Generate release evidence` workflow is the hosted equivalent. It must run from the exact audited commit on the default branch. The workflow independently requires the supplied CodeQL run to be a successful `CodeQL` run for that same commit, downloads its retained summary, confirms zero release-blocking findings, reruns the complete supply-chain scanner gate on a Linux runner, and retains the newly generated public summary as a 14-day artifact. Download that artifact without modification and create the direct evidence child locally; the workflow does not commit, tag, merge, or deploy anything.

`npm run security:release-evidence:require` verifies that the summary names the evidence commit's direct parent, that the parent is reachable from the annotated release tag, that CodeQL ran against that parent, and that the evidence commit changes no other path. A later code change makes the summary stale and fails `npm run security:release-evidence`; the next candidate must remove it and repeat the two-commit process.

## Generated artifacts

The gitignored `.security-reports/` directory contains:

| Artifact                        | Purpose                                                                           |
| ------------------------------- | --------------------------------------------------------------------------------- |
| `security-summary.md`           | Human-readable outcome with no source or secret values                            |
| `release-summary.json`          | Sanitized control/result/source/artifact digest record                            |
| `scanner-metadata.json`         | Tool versions, immutable scanner images, Docker version, and every target digest  |
| `tracked-source-inventory.json` | Exact `git ls-files --cached` paths and source-tree digest used by worktree gates |
| `gitleaks-*.sarif`              | Redacted worktree and history results                                             |
| `eslint.sarif`                  | TypeScript/JavaScript static-analysis results without snippets                    |
| `container-policy.sarif`        | Compose, Dockerfile, and language-coverage policy results                         |
| `sandbox-image.sarif`           | Trivy high/critical image vulnerability results                                   |
| `litellm-image.sarif`           | Trivy high/critical results for the exact patched LiteLLM runtime                 |
| `postgres-image.sarif`          | Trivy high/critical results for the exact PostgreSQL runtime                      |
| `license-policy.sarif`          | Unknown, denied, or disallowed license results                                    |
| `npm-production.cdx.json`       | Reproducible CycloneDX SBOM for the locked production npm graph                   |
| `npm-all.cdx.json`              | Reproducible CycloneDX SBOM for runtime and development dependencies              |
| `sandbox-image.cdx.json`        | CycloneDX SBOM for the exact scanned sandbox image ID                             |
| `litellm-image.cdx.json`        | CycloneDX SBOM for the exact scanned LiteLLM image ID                             |
| `postgres-image.cdx.json`       | CycloneDX SBOM for the exact scanned PostgreSQL image ID                          |
| `litellm-signature.json`        | Sanitized Cosign result bound to the upstream LiteLLM digest and pinned key       |
| `license-inventory.json`        | Component/version/scope/license inventory                                         |
| `npm-audit.json`                | Machine-readable lockfile vulnerability result                                    |
| `suppression-report.json`       | Active exceptions and unsuppressed count                                          |

CI uploads this directory as a 14-day artifact. No detailed generated scan report or SBOM is committed. SARIF source contents, snippets, proposed fixes, and attachments are removed before upload; Gitleaks receives `--redact=100`; public job output prints counts and statuses only.

## Enforcement policy

- All secret findings fail.
- Lint, repository credential checks, provenance checks, worktree Gitleaks, language coverage, and source-tree hashing operate on the same explicit tracked-file inventory. Generated or ignored browser, coverage, Lighthouse, build, and scanner artifacts cannot enter that inventory.
- ESLint and repository container-policy findings fail.
- npm and container HIGH/CRITICAL findings fail, including findings already present; the enforced count is zero after exact, documented, unexpired suppressions.
- The sandbox, LiteLLM, and PostgreSQL runtime images are each resolved to an exact local content ID, Trivy-scanned, and assigned a validated CycloneDX SBOM.
- LiteLLM must meet the configured Python, `ddtrace`, and `mcp` floors, use the reviewed database-compatible upstream, retain numeric non-root user/group `65534:65534`, and derive from an upstream digest whose Cosign signature verifies with the commit-pinned LiteLLM key.
- Every credential-bearing Compose service must use its reviewed explicit non-root identity, dropped capabilities, `no-new-privileges`, read-only root, Docker secret mounts, and exact writable tmpfs/volume allowlist. Plaintext credential environment values and unreviewed writable paths fail the gate.
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

Pull requests run GitHub dependency review and the complete local-equivalent gate. CodeQL uses GitHub's JavaScript/TypeScript extractor and `security-extended` queries in a separate SHA-pinned workflow. The hosted job retains SARIF and a small commit/run/count record and fails unless the result count is zero. The public repository also uploads the SARIF result to GitHub code scanning; the generated release summary binds the exact audited commit and retained zero-finding record used for the release rather than treating the repository's mutable alert page as release evidence.

Vercel builds fail closed unless `VERCEL_GIT_COMMIT_SHA` exactly equals `APPROVED_DEPLOYMENT_COMMIT_SHA`, and the audited commit and release tag match the checked-in summary. A successful build emits `/security/deployment-binding.json` with the full deployed commit, audited parent, release tag, CodeQL run, and verified relation. This build-generated file avoids placing a self-referential evidence-commit SHA inside its own Git tree.

For v1.0.8, the hosted [deployment binding](https://tylerwilhite.dev/security/deployment-binding.json) identifies deployed/evidence commit `1c1c06b8e5c6973604b025b63aafed606b2bd522`, audited parent `fc2957843077606a1cdb8fe9101cbed9421fb243`, tag `v1.0.8`, and the audited-source [CodeQL run](https://github.com/sorren1/AIWorkbench/actions/runs/29789562556). This is artifact-specific evidence, not an operational-reliability or live-provider claim.

The separate `Commit-bound production verification` workflow is the durable post-deployment behavior boundary for future observed runs. It fetches the live binding and canonical `security.txt` before executing the existing hosted Playwright suite and all six desktop/mobile Lighthouse route/profile checks. A successful run retains a strict sanitized summary for 90 days; Playwright JSON, command logs, failure artifacts, and Lighthouse reports remain restricted 14-day Actions artifacts or local files under gitignored `.security-reports/` and `.lighthouseci/`. The public bundle receives no post-deployment report, and raw headers, bodies, HTML, cookies, tokens, logs, screenshots, and traces are forbidden from the summary schema.

`npm run post-deployment:evidence:validate` requires GitHub Actions workflow/run identity as well as a complete pass state bound to one canonical origin, deployed SHA, release tag, and audited SHA. A local result, a Preview, a provider dashboard label, or a dispatch input without a matching live binding is not retained Production evidence. This mechanism does not rewrite the immutable v1.0.8 release summary or tag.
