# Third-party notices

This file summarizes directly selected packages and security tools. The complete transitive license inventory is generated from the installed lockfile by `npm run security:supply-chain` as `.security-reports/license-inventory.json`; the governing allow/deny list is `security/license-policy.json`. Those generated artifacts are CI evidence and are not committed.

This notice does not grant a license to first-party project code. No first-party reuse license has been selected in this revision; see the [license decision](docs/adr/source-license-decision.md). Review upstream license texts before redistributing third-party components.

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

## Fonts and material assets

| Asset                                                  | Origin and terms                                                                                                                                              |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| System UI and monospace font stacks                    | References fonts already supplied by the visitor's operating system/browser. No font binary is bundled or requested, so there is no redistributed font asset. |
| `public/assets/logo-mark.svg` and `logo-mark-mono.svg` | Original first-party project marks; no third-party source or component.                                                                                       |
| `public/assets/social-card.svg`                        | Original first-party vector composed from local project marks, type, and shapes; no stock illustration.                                                       |
| `public/assets/screenshots/workbench-overview.png`     | Deterministically captured by `npm run screenshots:generate` from the first-party built application; no manually composited or external screenshot material.  |
| `src/shared/Icon.tsx` icon paths                       | Original first-party SVG icon set retained from the clean-room prototype; not copied from an icon library.                                                    |

The public build ships no third-party font files, stock imagery, copied UI components, or external runtime scripts. The complete machine-readable transitive inventory remains the CycloneDX/license-policy output described above; this file is the human-reviewed direct-material summary.
