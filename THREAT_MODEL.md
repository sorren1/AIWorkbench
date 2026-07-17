# Threat model

This is the public entry point for the AI Delivery Workbench threat model. The detailed control-by-control model remains in [`docs/threat-model.md`](docs/threat-model.md); the Docker execution boundary is in [`docs/sandbox-security-model.md`](docs/sandbox-security-model.md), and trace handling is in [`docs/trace-data-handling.md`](docs/trace-data-handling.md).

## Supply-chain trust boundary

The repository trusts the reviewed lockfile, pinned scanner/container digests, GitHub Actions runner and action revisions, vulnerability/license databases at their recorded update time, the Docker daemon, and the Node/npm registries used during a clean install. A successful scan is point-in-time evidence about those inputs, not proof that upstream infrastructure or future advisory data is safe.

| Threat                                      | Current control                                                                                                                                                                | Residual risk                                                                                                             |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Secret committed now or retained in history | Redacted Gitleaks worktree and full-history scans plus repository/output pattern checks                                                                                        | Encoded or novel credentials may evade signatures; rotate any real credential regardless of scan result                   |
| Malicious or vulnerable npm dependency      | Exact lockfile, clean install, npm high/critical gate, pull-request dependency review, SBOM and license inventory                                                              | Registry compromise, maintainer takeover, and advisories published after the scan remain possible                         |
| Vulnerable sandbox base/runtime             | Digest-pinned Node base, minimal custom image without npm, Trivy high/critical gate, image-ID binding and image SBOM                                                           | Scanner/database blind spots and Docker daemon or kernel compromise remain outside this control                           |
| Compromised scanner or CI action            | Scanner images and Actions use reviewed immutable digests/SHAs; versions are recorded                                                                                          | The upstream artifact may already be compromised before pinning; independent signatures/attestations are not yet verified |
| Static-analysis blind spot                  | ESLint and CodeQL cover JavaScript/TypeScript; container policy covers Compose/Dockerfile; new Python/shell/PowerShell/Dockerfile sources fail closed until a scanner is added | CodeQL requires the hosted GitHub environment and is not locally validated in this revision                               |
| SBOM or report tampering                    | Reports and scanner metadata are SHA-256 bound into a sanitized summary; detailed artifacts are retained by CI                                                                 | CI artifacts are not signed, transparency-logged, or stored in immutable long-term evidence storage                       |
| License-policy drift                        | Complete npm CycloneDX inventory is compared with the reviewed allow/deny policy and notices                                                                                   | Automated metadata can be incomplete or legally ambiguous; publication still requires owner review                        |
| Exception becomes permanent                 | Central suppressions require rule, path, reason, reviewer, review date, and expiry; expired entries fail                                                                       | Reviewer identity is repository text, not an authenticated approval system                                                |

## Explicit non-claims

- CodeQL is configured but not claimed as executed until a hosted run succeeds.
- The scanners do not make the project production-ready or prove absence of vulnerabilities.
- Reports are not signed attestations and no SLSA level is claimed.
- The public site displays only a sanitized recorded summary and never runs scanners, Docker, or package-manager commands in a visitor's browser.
