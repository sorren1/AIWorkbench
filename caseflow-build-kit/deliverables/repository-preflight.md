# Repository Preflight — T01

## Result

T01 established the host-repository baseline at
`de11d11944b826c7b8b9087450be6ddc7e0de8a3` on
`feature/caseflow-reference-implementation`. The tracked worktree was clean at
inspection start and remained clean after build and test execution. No CaseFlow
entrypoint or product implementation exists yet, and no existing Workbench
behavior was changed.

## Repository identity

| Item | Observed baseline |
|---|---|
| Repository root | `D:\workbench` |
| Primary remote | `origin` → `https://github.com/sorren1/AIWorkbench.git` |
| Additional remotes | `audit`, `audit-final` |
| Branch | `feature/caseflow-reference-implementation` |
| Upstream | None configured |
| HEAD | `de11d11944b826c7b8b9087450be6ddc7e0de8a3` |
| HEAD subject | `chore: reconcile post-release readiness` |
| Relation to `origin/main` | One commit ahead, zero behind; merge base `9c94140d97df6c931bd22bbd979a37a0290462b1` |
| Dirty tracked or unignored files at start | None |
| Original-prototype tag | Annotated/lightweight lookup resolves `original-prototype-v0.9.0` to `bfc947c9c86798e26ad91aa2124025292b51609d` (`Initial commit`) |

The local `.git/info/exclude` deliberately excludes
`/caseflow-build-kit/` with the comment “Separate CaseFlow build kit kept
beside the Workbench source.” At baseline, `git ls-files
caseflow-build-kit/**` returned zero paths. D-006 preserves that general
exclusion and permits only the required T01 governance/evidence paths to be
force-added for the explicitly requested focused task commit. The archive as a
whole is not added.

## Toolchain and package contract

| Item | Observed baseline |
|---|---|
| Node runtime | `v22.18.0` |
| `.nvmrc` | `22.18.0` |
| `package.json` engine | `>=22.12 <23` |
| npm runtime | `11.12.0` |
| Package manager | npm, established by `package-lock.json`, Vercel `npm ci`, and repository commands |
| Lockfile | `package-lock.json`, lockfile version 3, package version `1.0.9` |
| `packageManager` field | Not declared |
| TypeScript | Strict mode; `typescript` `5.9.3` |
| Vite | `8.1.5` |
| React | `18.3.1` |

No dependency installation or lockfile change occurred during T01.

## Build inputs and output behavior

`vite.config.ts` sets `base: "./"`, uses
`assets/immutable` for hashed assets, emits a Vite manifest, and declares five
explicit Rollup HTML inputs:

| Input name | Source | Initial Vite output | Plugin/deployed output |
|---|---|---|---|
| `home` | `home/index.html` | `dist/home/index.html` | Replaces `dist/index.html` |
| `site` | `index.html` | `dist/index.html` | Copied to `dist/workbench/index.html` before root replacement |
| `article` | `writing/governing-ai-assisted-delivery/index.html` | Same relative path in `dist` | Copied to `dist/workbench/writing/governing-ai-assisted-delivery/index.html` |
| `demo` | `demo/index.html` | `dist/demo/index.html` | Copied to `dist/workbench/demo/index.html` |
| `notFound` | `404.html` | `dist/404.html` | Preserved as the conventional static-host 404 document |

`src/site/vitePlugin.ts` is the compatibility-critical custom build plugin. It:

- requires every HTML input to declare one of the fixed `PageKind` values;
- injects metadata, structured data, configuration links, synchronized source
  excerpts, recorded evidence, and supply-chain status;
- rewrites Workbench asset references to root-public asset paths;
- replaces the root artifact with the portfolio home;
- emits `_headers`, `robots.txt`, `sitemap.xml`,
  `/.well-known/security.txt`, optional deployment binding, and validated
  recorded-evidence assets.

`npm run build` passed with exit code 0. The observed build transformed 69
modules in 412 ms and emitted 77 files. The route-marker check found:

| Built path | `data-page` |
|---|---|
| `dist/index.html` | `home` |
| `dist/workbench/index.html` | `case-study` |
| `dist/workbench/demo/index.html` | `demo` |
| `dist/workbench/writing/governing-ai-assisted-delivery/index.html` | `article` |
| `dist/404.html` | `not-found` |

The build-output negative check found zero file paths and zero file-content
matches for `caseflow-build-kit` or `CaseFlow`. It also confirmed
`dist/caseflow/index.html` does not exist. The kit is outside Vite's `public/`
directory and explicit input graph, so tracking selected T01 documents does not
cause public emission.

## Route baseline

### Local Vite/preview behavior

The physical local entries remain available at `/`, `/home/`, `/demo/`, and
`/writing/governing-ai-assisted-delivery/`. The generated Workbench copies also
load at `/workbench/`, `/workbench/demo/`, and the namespaced article path.

Manual preview inspection on port 4181 observed:

| Route | Status/identity | Manual result |
|---|---|---|
| `/` | `home`, `Tyler Wilhite` | Loaded; zero CaseFlow links |
| `/workbench/` | `case-study`, `AI Delivery Workbench` | Loaded; zero CaseFlow links; zero external runtime resources |
| `/workbench/writing/governing-ai-assisted-delivery/` | `article`, `Governing AI-assisted delivery` | Loaded; zero CaseFlow links |
| `/workbench/demo/` | `demo`, responsive Workbench surface | Loaded; synthetic disclosure present; zero CaseFlow links |
| `/caseflow/` | HTTP 200 portfolio-home fallback | No CaseFlow entry exists; Vite preview falls back to `dist/index.html` |

The `/caseflow/` preview fallback is not implementation evidence and must not be
used as a route test. T10/T26 must assert the explicit CaseFlow file and Vercel
rewrite contract, while hosted missing-route behavior remains governed by
Vercel and the custom 404.

### Vercel behavior

`vercel.json` uses `npm ci`, `npm run build`, and `dist`. It:

- keeps `/` as the portfolio home;
- permanently redirects legacy `/index.html`, `/demo[/]`, and article paths
  into `/workbench/`;
- uses exact Workbench page rewrites rather than a namespace-wide SPA fallback;
- rewrites Workbench asset, capability, evidence, and manifest paths to their
  root-public files;
- has no CaseFlow redirect or rewrite.

## Security-header baseline

`src/site/securityHeaders.ts`, Vite `server`/`preview`, generated `_headers`,
`vercel.json`, unit tests, and Playwright tests share the same static policy:

```text
Content-Security-Policy: default-src 'self'; base-uri 'self'; connect-src 'self'; font-src 'self'; form-action 'self'; frame-ancestors 'none'; img-src 'self' data:; manifest-src 'self'; media-src 'none'; object-src 'none'; script-src 'self'; style-src 'self'; worker-src 'none'
Referrer-Policy: no-referrer
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), geolocation=(), microphone=(), payment=(), usb=()
Cross-Origin-Opener-Policy: same-origin
```

Only `/assets/immutable/:path*` and its Workbench alias receive the one-year
immutable cache rule. Current configuration has no `X-Robots-Tag` rule. Future
CaseFlow work must add a route-specific `noindex, nofollow, noarchive` header
without changing the existing wildcard security values or broadening
`connect-src`.

## Robots, sitemap, metadata, and discoverability

`src/site/metadata.ts` owns the five-page metadata union and generates robots
and sitemap output. With no `SITE_CANONICAL_URL`, the local build correctly
emitted:

```text
User-agent: *
Allow: /
Disallow: /404.html
```

and an empty sitemap URL set. With a validated production canonical origin, the
sitemap generator includes only `/`, `/workbench/`, the namespaced article,
and `/workbench/demo/`. CaseFlow is currently absent from robots, sitemap,
metadata, existing source HTML, existing navigation, and generated output.

T10/T26 must add the robots disallow and noindex metadata/header while
preserving sitemap and navigation exclusion. Tests must explicitly reject
CaseFlow links in the portfolio home, Workbench case study, article, and demo.

## Test and validation baseline

### Normal gate

`npm run check` is the documented deterministic source/build/security gate. It
completed with exit code 0 at the baseline commit, including the
Docker/network-dependent supply-chain stage.

Observed results included:

- 29 unit/component test files passed and 2 credential-gated files skipped;
- 177 tests passed and 2 credential-gated tests skipped;
- total coverage: 78.15% statements, 65.55% branches, 80.72% functions, and
  80.72% lines;
- production budgets passed at 11,524 B gzip for case-study HTML, 114,006 B
  gzip for the demo entry, and 131,574 B gzip total JavaScript;
- repository credential policy passed for 354 tracked files without logging
  values;
- public-history policy passed for 131 commits, 84 release-lineage commits, 9
  annotated tags, and 4 reachable provenance commits;
- public build/generated-evidence credential scan found no
  credential-shaped values;
- supply-chain evidence passed 7 controls with 15 active suppressions and 3
  scanned runtime images.

### Full gate

The first `npm run check:all` attempt passed its nested `check` and failed at
Playwright startup because unrelated `D:\Website` development processes already
owned the default port 4175. Those user processes were left untouched. The
documented override was used after verifying port 4177 was free:

```powershell
$env:WORKBENCH_TEST_PORT='4177'; npm run check:all
```

The rerun completed with exit code 0:

- nested `npm run check`: passed;
- Playwright: 200 passed, 2 intentional browser-capability skips, across
  Chromium, Firefox, WebKit, and the visual project;
- Lighthouse: all assertions passed for `/`, `/workbench/`, and
  `/workbench/demo/` in desktop and mobile profiles;
- measured Lighthouse category scores were 1.00 for every audited category
  except mobile demo performance at 0.99;
- focused post-browser Chromium security checks: 3 passed;
- second supply-chain run: 7 controls passed, 15 suppressions, 3 runtime images
  scanned;
- tracked-source reuse digest remained stable at
  `37947f348da4b161accc37910b75c212a6e3a60e3f22a9e27d00a6e6d86e7c09`.

Detailed generated logs and reports are local-only under ignored
`.workbench/t01-preflight/`, `.security-reports/`, `.lighthouseci/`,
`coverage/`, `playwright-report/`, and `test-results/`.

## Release-evidence baseline

The current verified public release is v1.0.9:

- audited source:
  `afb771d145e988adbbf61c642815514a5c4fb464`;
- direct summary-only evidence/deployment child:
  `9c94140d97df6c931bd22bbd979a37a0290462b1`;
- annotated tag: `v1.0.9`.

HEAD `de11d11944b826c7b8b9087450be6ddc7e0de8a3` is a post-release source
revision and intentionally has no
`public/security/release-summary.json`. `npm run
security:release-evidence` correctly reported that a future hosted summary must
be added only in a direct child. A non-development Vercel build fails closed
unless the checked-in summary, release tag, audited parent, approved deployment
commit, and `VERCEL_GIT_COMMIT_SHA` all match. The generated deployment binding
is emitted only after that validation.

CaseFlow changes cannot inherit or rewrite v1.0.9 evidence. T27 must create a
fresh audited source, hosted CodeQL evidence, one-file evidence child,
annotated tag, exact Vercel binding, and post-deployment verification.

## Authoritative integration touchpoints

### Build and page generation

- `vite.config.ts`
- `src/site/vitePlugin.ts`
- `src/site/metadata.ts`
- `src/site/config.ts`
- `src/site/securityHeaders.ts`
- future `caseflow/index.html`
- future `src/caseflow/**`

### Hosting and discoverability

- `vercel.json`
- generated `dist/_headers`
- generated `dist/robots.txt`
- generated `dist/sitemap.xml`
- `tests/vercel-deployment.test.ts`
- `tests/security-headers.test.ts`
- `tests/site-metadata.test.ts`

### Static-output and browser compatibility

- `scripts/check-links.ts`
- `scripts/check-performance-budgets.ts`
- `quality/performance-budgets.json`
- `scripts/generate-public-screenshots.ts`
- `tests/e2e/security.spec.ts`
- `tests/e2e/accessibility.spec.ts`
- `tests/e2e/responsive.spec.ts`
- `tests/e2e/deployment.spec.ts`
- `playwright.config.ts`

### Performance, hosted verification, and release evidence

- `quality/lighthouse/desktop.json`
- `quality/lighthouse/mobile.json`
- `scripts/run-lighthouse.ts`
- `scripts/post-deployment/contracts.ts`
- `scripts/post-deployment/run.ts`
- `tests/post-deployment-verification.test.ts`
- `scripts/check-release-evidence.ts`
- `src/site/deploymentBinding.ts`
- `src/site/supplyChainEvidence.ts`
- `.github/workflows/quality.yml`
- `.github/workflows/codeql.yml`
- `.github/workflows/release-evidence.yml`
- `.github/workflows/post-deployment-verification.yml`
- `docs/release-evidence.md`

### Existing surfaces that must remain undiscovering

- `home/index.html`
- `index.html`
- `writing/governing-ai-assisted-delivery/index.html`
- `demo/index.html` and `src/demo/**`
- `404.html`

## Comparison with `reference/EXISTING_SITE_INSPECTION.md`

The reference accurately describes the current architecture, route namespace,
fixed page-kind plugin, restrictive CSP, static public runtime, and
commit-specific release evidence. No correction to that reference is justified
by T01 evidence.

The authoritative baseline adds details that the reference intentionally
summarized:

- exact Node/npm/lockfile versions and the absence of a `packageManager` field;
- exact five-input Vite mapping and root-home substitution;
- exact Vercel redirect/rewrite list and header synchronization;
- post-release HEAD has no checked-in summary by design;
- current Vite preview treats `/caseflow/` as a portfolio fallback until an
  explicit input exists;
- the build kit is locally excluded from Git;
- the default Playwright port is occupied by an unrelated user project in this
  workspace.

These are recorded here rather than rewriting the still-correct reference.

## Known risks and constraints

- R-006 remains open: a new same-site route can destabilize Workbench release
  evidence unless integration stays isolated and old-route assertions remain
  exact.
- R-013 records the local build-kit version-control boundary. Required task
  artifacts need deliberate force-add, while the untracked archive itself is
  not durable in branch history.
- Local Vite preview's fallback can create a false-positive route check. Tests
  must assert the emitted CaseFlow file and hosting rewrite.
- The branch has no upstream. T01 does not push or publish.
- Local full-gate execution requires a free `WORKBENCH_TEST_PORT`; port 4175 is
  currently owned by another user project.
- The locally corrected `tools/render_status.py` remains inside the excluded
  build-kit archive. Tracking that Python file would activate the host
  repository's fail-closed language-coverage rule and requires a separately
  authorized scanner boundary; T01 does not broaden into that work.
- Windows screenshot checks validate dimensions; canonical pixel freshness
  remains Linux-enforced.
- Local CodeQL is configured but not run. Fresh hosted CodeQL is required for a
  future release.
- The 15 current supply-chain suppressions expire on 2026-08-15 and must be
  re-reviewed before any later release if still applicable.

## T01 acceptance gate

- [x] Repository, branch, remotes, and current commit identified.
- [x] Existing normal and full gate results recorded.
- [x] Repository, build, route, security-header, test, release-evidence, and
  integration touchpoints listed.
- [x] Build output proven not to emit `caseflow-build-kit/`.
- [x] Current planning reference compared against repository reality.
- [x] No product code, route, dependency, navigation, sitemap entry, deployment,
  or publish action added.
