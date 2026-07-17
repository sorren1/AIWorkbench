# Independent release audit — 1.0.0

- Audit date: 2026-07-17
- Audited base commit: `feeef8fa26f61880bcbafd312d9c8892f370b13f`
- Release disposition: **local release approved after two reproducibility blockers were fixed; not deployed or pushed**

## Scope and method

This audit approached the repository as an external reviewer would: start from Git history, reconstruct a checkout using tracked files and the lockfile, run the declared release gate, inspect generated output and recorded evidence, and then challenge public claims in a real production preview. The first clean clone was deliberately created under the workstation's existing `core.autocrlf=true` policy so checkout portability was tested rather than assumed.

The audit did not use E2B, a live model provider, or a hosted telemetry service. Those paths are credential-gated and the public project does not claim they were validated.

## Executive result

The first clean clone **failed** at `format:check`: 275 files were checked out as CRLF and Prettier rejected them. The repository had no `.gitattributes`, so its clean-build claim depended on the reviewer's global Git configuration. Adding `* text=auto eol=lf` plus an explicit binary rule for PNG assets fixed the root cause. A second tracked-files-only candidate clone then passed the full gate in 308.5 seconds.

The first rerun in the release worktree then exposed a separate integration-test race: Testing Library's one-second default elapsed while a lazy Control Plane module loaded. The clean candidate had passed the same test, demonstrating that this was timing-sensitive. The assertion now uses an explicit five-second bounded wait and passed five consecutive targeted runs before the full gate was attempted again.

No further release-blocking source, behavior, accessibility, evidence, security, or performance defect was found. External publication checks remain deliberately incomplete because this phase does not push or deploy.

## Source recovery and clean build

| Check                           | Command or observation                                                                       | Result                                                                                                                                                                                 |
| ------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Working tree before audit       | `git status --short`                                                                         | PASS — empty at audited base commit.                                                                                                                                                   |
| Original tag identity           | `git rev-parse original-prototype-v0.9.0` and `git rev-parse original-prototype-v0.9.0^{}`   | PASS — annotated tag object `123c22ce9ee7e48f103d1c4470dcee73c734a994` resolves to commit `13d01bb75d5d20b0f7be11897512186ba5a321b0`.                                                  |
| Original archive recovery       | `git archive --format=tar --output=<temporary file> original-prototype-v0.9.0` and `tar -tf` | PASS — 42 archive entries; the standalone prototype HTML and original `workbench/README.md` are present.                                                                               |
| Existing release tag            | `git tag --list`                                                                             | PASS — only `original-prototype-v0.9.0` existed before this release; no prior `v1.0.0` was overwritten.                                                                                |
| Clean checkout                  | `git clone --no-local --branch main D:\workbench <temporary directory>`                      | PASS — `node_modules/` and `dist/` were absent.                                                                                                                                        |
| Runtime pin                     | `node --version`, `npm --version`, and `.nvmrc`                                              | PASS — Node `v22.18.0`, npm `11.12.0`, and `.nvmrc` `22.18.0` agree.                                                                                                                   |
| Clean install                   | `npm ci`                                                                                     | PASS — 766 packages installed from `package-lock.json`; npm reported 0 vulnerabilities. Transitive deprecation notices are recorded as a maintenance limitation.                       |
| First full gate                 | `npm run check:all`                                                                          | FAIL as expected during falsification — stopped at `format:check` after 6.5 seconds because the clean Windows clone had CRLF working-tree files.                                       |
| Checkout diagnosis              | `git ls-files --eol ...` and `git config --show-origin --get core.autocrlf`                  | CONFIRMED — index LF, clean-clone worktree CRLF, no attributes, user Git configuration `core.autocrlf=true`.                                                                           |
| Candidate re-clone after fix    | Audit-only candidate commit followed by `git clone --no-local`                               | PASS — representative text files were `i/lf w/lf attr/text=auto eol=lf`; build directories were absent. The audit-only commit exists only in the temporary clone, not project history. |
| Second clean install            | `npm ci`                                                                                     | PASS in 14.3 seconds; 0 vulnerabilities.                                                                                                                                               |
| Full release gate               | `npm run check:all`                                                                          | PASS in 308.5 seconds.                                                                                                                                                                 |
| First release-worktree rerun    | `npm run check:all`                                                                          | FAIL after 61.8 seconds — 104 tests passed and one lazy Control Plane navigation assertion exceeded Testing Library's one-second default.                                              |
| Flake diagnosis and bounded fix | Five sequential `npx vitest run tests/app.test.tsx` invocations                              | PASS — 2 of 2 tests passed in every run; the lazy-screen assertion now has a 5,000 ms maximum wait.                                                                                    |
| Final release-worktree gate     | `npm run check:all`                                                                          | PASS in 306.9 seconds after both blocker fixes.                                                                                                                                        |

## Automated quality results

| Area                           | Command within the full gate                                                 | Observed result                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Formatting                     | `npm run format:check`                                                       | PASS after LF checkout fix.                                                                                                                                     |
| Lint                           | `npm run lint`                                                               | PASS with zero warnings.                                                                                                                                        |
| Strict types                   | `npm run typecheck`                                                          | PASS.                                                                                                                                                           |
| Generated contracts            | `registry:check`, `mcp:evidence:check`, `trace:check`, `model-gateway:check` | PASS; checked-in generated records match source contracts.                                                                                                      |
| Sandbox evidence               | `npm run sandbox:evidence:validate`                                          | PASS — 2 packs valid; latest successful digest `b1e5b880b2bde6efdacca6944200fa5dd644e18435cf8b9aef36065a186f7ba7`.                                              |
| Model-gateway evidence         | `npm run model-gateway:evidence:validate`                                    | PASS — no live evidence is checked in and no live-validation claim is made.                                                                                     |
| Unit and integration           | `npm run test:coverage`                                                      | PASS — 20 test files and 105 tests passed; 2 credential-gated live tests skipped. Coverage: 79.43% statements, 64.25% branches, 83.84% functions, 82.27% lines. |
| Production build               | `npm run build`                                                              | PASS — Vite 8.1.5 transformed 63 modules with no build error.                                                                                                   |
| Screenshot verification        | `tsx scripts/generate-public-screenshots.ts --check`                         | PASS — seven public screenshots and the social card matched their decoded-pixel baselines.                                                                      |
| Screenshot reproduction        | `npm run screenshots:generate` followed by `git status --short`              | PASS — all eight asset hashes reproduced and no tracked diff resulted.                                                                                          |
| Static/document links          | `npm run links:check`                                                        | PASS — production links/fragments resolve; 116 Markdown links across 53 documents validated.                                                                    |
| Bundle budgets                 | `npm run performance:budgets`                                                | PASS — case study 11,532 B gzip, demo entry 110,553 B gzip, all JavaScript 125,513 B gzip.                                                                      |
| Repository/build secret policy | `npm run security:check`                                                     | PASS — no credential-shaped value in tracked/public output; file contents were not printed.                                                                     |
| Supply chain                   | `npm run security:supply-chain`                                              | PASS — 6 controls passed, 0 suppressions, Docker image `sha256:adae508da516…`; detailed reports remained local.                                                 |
| E2E, accessibility, and visual | `npm run test:e2e`                                                           | PASS — 137 passed across Chromium, Firefox, WebKit, and the visual project; 2 Firefox/WebKit clipboard-capability cases skipped.                                |
| Axe                            | Accessibility cases inside `npm run test:e2e`                                | PASS — no critical or serious violation on the case study, article, principal demo screens, modal, or drawer.                                                   |
| Keyboard workflow              | `tests/e2e/interactions.spec.ts` inside `npm run test:e2e`                   | PASS — skip links, row actions, tabs, native controls, overlay focus/escape/return, and all eight guided-tour steps use keyboard events.                        |
| Lighthouse                     | `npm run performance:audit`                                                  | PASS — all configured desktop and mobile assertions succeeded.                                                                                                  |

### Lighthouse measurements

| Profile | Route    | Performance | Accessibility | Best Practices | SEO |      LCP |  TBT | CLS |
| ------- | -------- | ----------: | ------------: | -------------: | --: | -------: | ---: | --: |
| Desktop | `/`      |         100 |           100 |            100 | 100 |   246 ms | 0 ms |   0 |
| Desktop | `/demo/` |         100 |           100 |            100 | 100 |   365 ms | 0 ms |   0 |
| Mobile  | `/`      |         100 |           100 |            100 | 100 |   905 ms | 0 ms |   0 |
| Mobile  | `/demo/` |          99 |           100 |            100 | 100 | 1,657 ms | 5 ms |   0 |

These are local Lighthouse measurements, not production-service performance claims.

## Production preview review

The audited `dist/` was served with `npm run preview -- --host 127.0.0.1 --port 4180 --strictPort` and reviewed with the in-app Chromium browser plus direct HTTP requests.

| Behavior                  | Result                                                                                                                                                                                                                                                                                                                                                                        |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Direct routes and refresh | PASS for `/`, `/demo/`, `/writing/governing-ai-assisted-delivery/`, `/404.html`, and the checked-in evidence JSON. Each returned 200 from the preview and retained its expected page title/content after refresh. Non-default demo deep link `/demo/?screen=trace` retained the selected screen after refresh; the default queue URL canonically removed its redundant query. |
| Case-study semantics      | PASS — one visible H1, skip link, landmarks, named sections, semantic table/captions, architecture text alternative, and distinct functional/simulated/evidence language were present in the accessibility-oriented DOM snapshot.                                                                                                                                             |
| Demo semantics            | PASS — principal screens expose one accessible H1 at a time, named navigation, labeled scenario/persona controls, semantic evidence tables, live-status region, and explicit synthetic/no-write boundary.                                                                                                                                                                     |
| Responsive boundary       | PASS — at 320 px, case study and demo both had `scrollWidth === clientWidth`; the workbench exposed its deliberate narrow-screen overview and case-study return link. Automated coverage also passed 320, 375, 768, 1024, 1280, 1440, and a 200%-zoom equivalent.                                                                                                             |
| Console                   | PASS — no warning or error entry was captured on the reviewed demo route.                                                                                                                                                                                                                                                                                                     |
| Runtime network/assets    | PASS — the demo asset inventory contained one local stylesheet and one local script, both from `127.0.0.1`; no font, image, video, analytics, gateway, telemetry, or provider request occurred. Cross-browser security tests independently observed no external runtime request.                                                                                              |
| Security headers          | PASS in Vite preview — CSP, `Referrer-Policy: no-referrer`, `X-Content-Type-Options: nosniff`, restrictive `Permissions-Policy`, and `Cross-Origin-Opener-Policy: same-origin` were present. CSP includes no `unsafe-eval`; inline styles remain explicitly allowed because the current UI uses inline style attributes.                                                      |
| 404 artifact              | PARTIAL BY HOST BOUNDARY — `/404.html` renders the custom page. Vite preview returns the case-study fallback with status 200 for an arbitrary unknown path; the selected static host must be observed routing unknown paths to `404.html` with a real not-found status before publication.                                                                                    |
| Canonical metadata        | HONESTLY OMITTED — `canonicalUrl` is null, so canonical/absolute social URLs and sitemap entries are omitted instead of fabricated. Titles, descriptions, local icons/manifest, Open Graph text, Twitter text, and structured data are present. Deployment must configure and re-audit the canonical URL.                                                                     |

## Evidence and execution claim review

The latest index points to a `SUCCEEDED` `LOCAL_DOCKER` evidence pack. Its source commit is reachable, its normalized trace hash exactly matches the index, container networking is `none`, `websiteExecutesCode` and `visitorInputAccepted` are false, and accounting records zero model calls/cost rather than inventing model use. The public page describes this as a recorded local run and exposes the exact source commit, modified-worktree state, approved path, limits, command receipts, context digest, evidence digest, trace ID, and trace digest.

The second checked-in pack is an honest failed run. E2B status remains “implemented but not live-validated,” the LiteLLM gateway remains “gateway implemented; live provider path not validated,” and CodeQL remains “configured · not validated.” No public claim upgrades these states.

## Semantic-distance and secret search

The active tracked tree and `dist/` were searched case-insensitively for the required terms and for credential/contact shapes.

| Search                            |                                                      Active tracked tree | Production build | Interpretation                                                                                                                       |
| --------------------------------- | -----------------------------------------------------------------------: | ---------------: | ------------------------------------------------------------------------------------------------------------------------------------ |
| Specified organization identifier |                                                                        0 |                0 | PASS.                                                                                                                                |
| Required interview-only phrase    |                                                                        0 |                0 | PASS.                                                                                                                                |
| TS-style JSX phrase               |                                                                        1 |                0 | The sole match is the prohibition in `AGENTS.md`, not product copy or source syntax.                                                 |
| Legacy CDN host                   |                                                                        4 |                0 | Baseline audit only; it documents removed original behavior.                                                                         |
| Babel/development React markers   | Documentation plus transitive lockfile packages; no active runtime entry |                0 | Babel packages are build-tool transitive dependencies, not browser-side transformation.                                              |
| Placeholder URL shapes            |                                                                        2 |                0 | The E2B provider's `example.com` request is the tested outbound-denial probe and its fake test. No rendered placeholder link exists. |
| Loopback host URLs                |                                              Expected local-only matches |                0 | Local preview, Lighthouse, tests, and optional local gateway configuration only.                                                     |
| Secret/key/private-key shapes     |           Two reviewed placeholders/declarations; repository policy PASS |                0 | `.env.example` contains names only; no value is committed or emitted.                                                                |
| Phone-number shape                |                                                                        0 |                0 | PASS.                                                                                                                                |
| Street-address shape              |                                                                        0 |                0 | PASS.                                                                                                                                |

The preserved original tag remains recoverable by requirement and therefore retains historical prototype wording that has been removed from the active branch and build. Git author metadata also contains the configured commit email; it is absent from site content and build output. The owner should confirm that metadata is appropriate before pushing rather than rewriting the preserved history silently.

## Claim taxonomy

| Category                         | Public examples                                                                                                                                                                                                                | Traceability conclusion                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Functional repository behavior   | Navigation, deep links, deterministic reducer/reset/scenarios, stale propagation, local copy/download/export, approval protocol, registry/context/budget/trace contracts, validation scripts, fixture-only MCP/Docker commands | Supported by unit/integration/E2E tests, build output, CLI validators, and the recorded Docker evidence where execution is claimed.                        |
| Synthetic fixture                | Ten queue issues, personas, branches, pull requests, checks, logs, durations, thresholds, currencies, review state, provider responses                                                                                         | Screen-level and persistent-shell disclosures classify these as synthetic. Queue counts explicitly say “synthetic fixture count/failures/gate/state.”      |
| Recorded/measured local evidence | Docker command durations/exits, hashes, changed path, resource limits, trace spans, budget counters, supply-chain results, bundle sizes, Lighthouse scores                                                                     | Bound to checked-in JSON or the observed audit command output and labeled measured/recorded/local. Hashes are not described as signatures or attestations. |
| Approved professional context    | Approximately 50 production stories through human-reviewed pull requests                                                                                                                                                       | Appears only in the separately labeled approved statement and explicitly says the public prototype is a separate implementation.                           |
| Proposed production design       | Production identity, secret management, isolated execution expansion, durable shared state/evidence, observability, rollback/incident handling                                                                                 | Introduced as design requirements or productionization work, not current prototype capability.                                                             |

The guided “5–8 minute” label is a designed interview-tour timebox, not a measured delivery-performance claim. Version numbers, schema versions, configured budgets, and synthetic financial thresholds are identifiers, policy values, or fixtures rather than outcome claims.

## Hiring-manager review

The repository root leads with a value proposition, screenshot, evidence boundary, architecture, commands, tests, clean-room disclosure, repository map, limitations, and links to substantive architecture/threat/evaluation records. The maintained application is under `src/`; contracts and local runtime code are under `tools/`; synthetic execution input is under `examples/toy-repo/`; tests are discoverable under `tests/`; checked-in real-run snapshots are isolated under `evidence/generated/`.

The strongest implementation evidence is the explicit state/guard test surface, schema-backed registry/context contracts, allow-listed sandbox runner, trace/evidence binding, and public generated-excerpt mechanism. The most important limits are equally visible: the browser is not a live execution service, local approvals are not production identity, hashes are not attestations, and optional cloud/model paths are not live-validated.

## Remaining limitations and publication blockers

- `gh run list` returned no hosted workflow runs. Local configuration is present for quality, dependency review, and CodeQL, but those controls must not be marked executed until the candidate is pushed and GitHub reports success.
- `git ls-remote origin` showed remote `main` still at the original prototype commit and no remote `v1.0.0`. This audit intentionally does not push or deploy. The source link becomes current only after a separately authorized publication step.
- Canonical/contact/résumé URLs are null and analytics is off. This avoids dead placeholders and tracking but requires a final deployment-specific metadata review.
- The custom `404.html` exists, but real unknown-path status/routing and emitted security headers must be observed on the chosen host.
- Live E2B and LiteLLM/provider integrations remain unvalidated without credentials; no release claim depends on them.
- Docker isolation and recorded evidence retain the trust assumptions documented in `docs/sandbox-security-model.md`; evidence digests are integrity checks, not trusted attestations.
- Several transitive development dependencies emit deprecation notices during `npm ci`; the locked audit currently reports zero vulnerabilities, but dependency maintenance should continue.
- The ignored private publication checklist, confidentiality/invention-assignment review, and personal metadata decision remain owner responsibilities outside the repository.

None of these limitations justifies a stronger public claim. Hosted CI, remote publication, and deployment verification remain explicit follow-up gates rather than fabricated successes.
