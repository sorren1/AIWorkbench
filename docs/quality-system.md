# Release-grade quality system

The quality system is organized around claims rather than test volume. `npm run check:all` is the release gate; it runs deterministic source checks, evidence validation, coverage, the production build, link and credential checks, the reproducible supply-chain evidence gate, Chromium/Firefox/WebKit browser tests, axe, controlled screenshots, and desktop/mobile Lighthouse assertions. The supply-chain gate covers redacted Git history/worktree secret scanning, SAST and container policy, lockfile and all three runtime-image vulnerability checks, five CycloneDX SBOMs, LiteLLM signature/package-floor checks, license policy, suppression expiry/use, and source/report binding; see `docs/release-evidence.md`.

## Claim-to-test map

| Claim                                                                            | Primary executable evidence                                                                                     |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Plan redo invalidates Change Targets, Implement, Verify, and Review              | `tests/store.test.ts`, `tests/e2e/functional-actions.spec.ts`                                                   |
| Failed Verify blocks PR and validation readiness                                 | `tests/governance-guards.test.ts`, `tests/e2e/quality-gates.spec.ts`                                            |
| Diff review, required checks, checklist, and a distinct approval gate validation | `tests/governance-guards.test.ts`, `tests/quality-components.test.tsx`, `tests/e2e/quality-gates.spec.ts`       |
| Release readiness requires complete validation evidence                          | `tests/governance-guards.test.ts`, `tests/e2e/quality-gates.spec.ts`                                            |
| Locked demo governance controls remain enabled                                   | `tests/store.test.ts`, `tests/e2e/interactions.spec.ts`                                                         |
| Reset and deep links are deterministic and allow-listed                          | `tests/functional-actions.test.ts`, `tests/e2e/functional-actions.spec.ts`                                      |
| Local copy/download/export actions work                                          | `tests/functional-actions.test.ts`, `tests/quality-components.test.tsx`, `tests/e2e/functional-actions.spec.ts` |
| Principal routes have no serious or critical axe findings                        | `tests/e2e/accessibility.spec.ts`                                                                               |
| Production preview has the declared CSP and makes no external runtime requests   | `tests/security-headers.test.ts`, `tests/e2e/security.spec.ts`                                                  |

The pure guard functions in `src/demo/state/guards.ts` are the shared decision source for the PR and Validation screens. Their coverage threshold is stricter than the aggregate domain threshold. Global coverage is enforced over state, authorization, context selection, registry lifecycle, exports, browser utilities, and static-site policy code at 75% statements/lines/functions and 60% branches; the guard module requires 100% statements/lines/functions and at least 85% branches.

## Browser and visual strategy

The same functional suite runs in the current Playwright Chromium, Firefox, and WebKit builds. Clipboard permission behavior is Chromium-only; download, export, governance, keyboard, accessibility, responsive, and offline behavior remain cross-engine.

`npm run test:visual` is a controlled visual-review workflow, not a brittle cross-platform pixel equality gate. It fixes viewports, disables animation and caret rendering, waits for fonts, captures the desktop case study, mobile case study, light Work Queue, and dark Control Plane, and attaches the PNGs to Playwright results. CI retains those files for 14 days. A reviewer compares them when presentation-layer changes are intentional.

## Failure policy

- Never update thresholds or recorded bundle measurements merely to make a regression green.
- A fixture or policy change must update the relevant guard and E2E evidence together.
- Axe blocks critical and serious findings. Manual keyboard, zoom, screen-reader-oriented, and forced-colors review remains part of publication review because automation is not exhaustive.
- Credential checks print only the tracked path and rule name, never a matched value.
- Credential-gated E2B and model-gateway live suites remain explicit and are not part of the offline release gate.
