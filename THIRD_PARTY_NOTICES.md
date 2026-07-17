# Third-party notices

This file summarizes directly selected packages and security tools. The complete transitive license inventory is generated from the installed lockfile by `npm run security:supply-chain` as `.security-reports/license-inventory.json`; the governing allow/deny list is `security/license-policy.json`. Those generated artifacts are CI evidence and are not committed.

This notice does not grant a license to first-party project code. Review the upstream project and package license texts before redistribution.

## Runtime dependencies

| License    | Direct packages                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ |
| MIT        | `@modelcontextprotocol/sdk`, `ajv`, `ajv-formats`, `e2b`, `react`, `react-dom`, `zod`                                    |
| Apache-2.0 | `@opentelemetry/api`, `@opentelemetry/resources`, `@opentelemetry/sdk-trace-base`, `@opentelemetry/semantic-conventions` |

## Development and validation dependencies

| License    | Direct packages                                                                                                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| MPL-2.0    | `@axe-core/playwright`                                                                                                                                                                                                                                                                     |
| Apache-2.0 | `@cyclonedx/cyclonedx-npm`, `@lhci/cli`, `@playwright/test`, `typescript`                                                                                                                                                                                                                  |
| MIT        | `@eslint/js`, `@testing-library/jest-dom`, `@testing-library/react`, `@types/node`, `@types/react`, `@types/react-dom`, `@vitejs/plugin-react`, `@vitest/coverage-v8`, `eslint`, `eslint-plugin-react-hooks`, `globals`, `jsdom`, `prettier`, `tsx`, `typescript-eslint`, `vite`, `vitest` |

## Pinned external tools and images

| Component                             | Use                                                   | License                                                          |
| ------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------- |
| Gitleaks 8.30.1                       | Redacted worktree and Git-history secret scanning     | MIT                                                              |
| Trivy 0.70.0                          | Container vulnerability scan and image CycloneDX SBOM | Apache-2.0                                                       |
| Node.js 22.23.1 official Alpine image | Minimal sandbox execution base                        | Node.js MIT plus licenses of included Alpine packages            |
| Alpine Linux 3.24 packages            | Sandbox operating-system layer                        | Package-specific open-source licenses recorded in the image SBOM |
| LiteLLM 1.92.0 image                  | Optional local model-gateway profile                  | MIT                                                              |
| PostgreSQL 17.6 image                 | Optional local model-gateway data store               | PostgreSQL License                                               |

The public site uses system font fallbacks and ships no third-party font files, stock imagery, copied UI components, or external runtime scripts.
