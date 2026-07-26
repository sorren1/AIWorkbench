# CaseFlow Architecture and Contract Reconciliation — T02

## Result

CaseFlow remains one deterministic workflow presented through four static
public lenses, with a separate local-only Python service for mock and
credentialed validation. This architecture is compatible with the observed
Vite 8 multi-page build, React 18, strict TypeScript, relative Vite base,
custom portfolio build plugin, restrictive same-origin CSP, exact Vercel
rewrites, and commit-bound release-evidence model.

T02 creates no product entrypoint, route, navigation item, sitemap entry, API
service, CData adapter, or application feature. It defines the paths and
contracts that later tasks must implement.

No unresolved high-severity architecture or contract contradiction remains.

## Repository reality that governs the design

| Concern | Observed host behavior | CaseFlow consequence |
|---|---|---|
| Build | `vite.config.ts` declares five explicit HTML inputs with `base: "./"` | T10 adds exactly one input named `caseflow`; no SPA conversion |
| HTML processing | `src/site/vitePlugin.ts` rejects unknown `data-page` values and moves the portfolio/Workbench outputs | T10 adds an isolated `caseflow` page kind and preserves every existing mapping |
| Routing | `vercel.json` has exact Workbench rewrites and no namespace-wide SPA fallback | T26 adds CaseFlow-only rewrites; existing redirect/rewrite order remains intact |
| CSP | `connect-src 'self'`; scripts/styles/assets are same-origin only | Public CaseFlow performs no CData, API, model, font, analytics, or third-party request |
| Headers | Global security headers are synchronized in TypeScript, Vite, `_headers`, and Vercel | T26 adds route-specific robots headers without changing global values |
| Robots/sitemap | `src/site/metadata.ts` generates both; sitemap paths are explicit | CaseFlow gets a robots disallow and is never added to sitemap paths |
| Static links | `scripts/check-links.ts` validates emitted physical assets | T10/T24 add the CaseFlow entry/evidence mappings to this checker |
| Release evidence | Public summaries are direct evidence-child artifacts bound to an audited parent and hosted CodeQL | CaseFlow cannot inherit v1.0.9 evidence; T27 starts a new audited lineage |
| Browser gates | Playwright uses build + preview across Chromium, Firefox, WebKit, and visual projects | T24 extends the same projects; it does not create a second browser stack |
| Port | Default test port 4175 can be occupied locally | Verification may use the existing `WORKBENCH_TEST_PORT` override |

## Authoritative implementation boundary

| Surface | Public Vercel artifact | Local trusted environment |
|---|---|---|
| React UI | Yes, deterministic replay only | Same static UI may inspect sanitized local output |
| Checked-in fixtures/evidence | Yes, only files that passed schema validation and sanitization | Yes |
| FastAPI | No | Loopback `127.0.0.1:8090` only |
| CData SDK/MCP | No | Read-only until the separate T25 write decision |
| Source credentials/OAuth/PAT | No | Ignored env/secret storage only |
| Source writes | Never | Mock writes in `LOCAL_MOCK`; an allow-listed synthetic live target only after T25 approval |
| LLM | No required public or local dependency | Optional explanation adapter only; never policy, approval, or write authority |
| Raw live evidence | No | Ignored `/.caseflow-live-evidence/` only |
| Call ledger/OAuth state | No | Ignored `/.caseflow-local/` only |

`PUBLIC_REPLAY` and `RECORDED_LIVE` are browser presentation modes, not FastAPI
server modes. The local service accepts only `LOCAL_MOCK`, `LOCAL_LIVE_READ`,
and `LOCAL_LIVE_APPROVED_WRITE`.

## Target implementation tree and ownership

```text
caseflow/index.html                         frontend HTML input
src/caseflow/
  main.tsx                                  frontend bootstrap
  app/App.tsx                               shell and composition
  app/caseflowRouteMiddleware.ts            Vite dev/preview path rewrite helper
  routing/routes.ts                         exact pathname map; no router package
  domain/contracts.ts                       public-view types
  domain/claimClassification.ts             claim taxonomy
  components/                               accessible shared CaseFlow UI
  disclosure/                               persistent boundary and claim labels
  replay/contracts.ts                       public artifact types/guards
  replay/loadEvidence.ts                    same-origin static loader
  replay/selectors.ts                       canonical view projections
  screens/{Strategy,Technical,Operations,Product}Screen.tsx
  tour/                                     query/hash deep-link state
  styles/caseflow.css                       --cf-* scoped styles
  assets/                                   local SVG only

caseflow-api/
  pyproject.toml                             Python project and tool settings
  requirements.lock                         exact hashed local-service lock
  requirements-dev.lock                     exact hashed development lock
  src/caseflow_api/
    main.py                                  loopback FastAPI composition
    settings.py                              safe mode/env parsing
    api/
      dependencies.py
      errors.py
      models.py
      routes/{health,capabilities,cases,runs,approvals,executions,evidence}.py
    domain/
      {entities,enums,errors,hashing,money,policy,state_machine}.py
    application/
      {investigate,propose,review,execute,reconcile,export_evidence}.py
    ports/
      {approval,clock,evidence_source,execution_ledger,finance_action,crm_action}.py
    adapters/
      mock/
      cdata_sdk/
      cdata_mcp/
      replay/
      llm/
    evidence/
      {canonicalize,manifest,sanitize,schemas}.py
    observability/
      {events,metrics,tracing}.py
  tests/
    unit/
    contract/
    integration/
    failure/
    fixtures/                                invalid/test-only payloads

caseflow-build-kit/fixtures/                 canonical planning/source fixtures
public/caseflow-evidence/                    generated sanitized public artifacts
tests/caseflow/                              frontend unit/component/contract tests
tests/e2e/caseflow*.spec.ts                  browser/accessibility/network tests
scripts/check-caseflow-public.ts             T23 public-data/claim boundary scan
```

The canonical synthetic inputs remain in
`caseflow-build-kit/fixtures/`. Backend tests reference that directory through
one fixture-root helper. They do not create a second hand-maintained
`fixtures/caseflow/` copy. Implementation-generated replay output has a
different authority and belongs only under `public/caseflow-evidence/`.

## Route selection and static-host behavior

No React router dependency is approved.

1. `vite.config.ts` adds `caseflow/index.html` as Rollup input `caseflow`.
2. T10 adds a small Vite `configureServer` and `configurePreviewServer`
   middleware that rewrites `/caseflow` and `/caseflow/*` requests internally
   to `/caseflow/index.html`. The browser pathname is unchanged.
3. `src/caseflow/routing/routes.ts` reads `new URL(window.location.href).pathname`,
   removes one trailing slash for comparison, and performs an exact map:
   `/caseflow` defaults to strategy; the four approved stage paths select their
   stage; any other path renders the CaseFlow not-found view.
4. `history.pushState` is unnecessary for ordinary stage navigation: stage
   links are real same-origin anchors. Query parameters or hashes may address
   tour steps in T21.
5. The build plugin converts CaseFlow asset references to root-public
   `/assets/immutable/...` URLs. This avoids relative-asset failure when a
   rewrite preserves a deep browser pathname.
6. T26 adds CaseFlow-only Vercel rewrites for `/caseflow`, `/caseflow/`, and
   `/caseflow/:path*` to `/caseflow/index.html`.
7. The entry contains
   `<meta name="robots" content="noindex,nofollow,noarchive">`; Vercel and
   generated `_headers` add the same `X-Robots-Tag` policy.
8. Robots disallows `/caseflow/`; the sitemap and every existing page remain
   link-free.

Route obscurity is not a security control. All emitted CaseFlow content must be
safe for an unauthenticated public reader.

## Contract reconciliation

| Contract | Correction | Reason |
|---|---|---|
| OpenAPI | Converted to JSON-compatible YAML, fixed external schema refs, added all documented endpoints, loopback-only server, safe errors, exact IDs, typed responses, approve/reject, controlled failure injection, and reconciliation operator input | The prior evidence ref resolved to `contracts/contracts/schemas`; route docs and API contract differed; several responses were untyped |
| Mode contract | Added service/browser distinction, evidence source, exact mock/live write targets, enable flag, approval, and idempotency requirements | `PUBLIC_REPLAY`/`RECORDED_LIVE` must never be server modes; `sourceWrites: true` alone was too broad |
| Route contract | Canonicalized `/caseflow/`, documented `/caseflow` alias, build entry, exact pathname selection, trailing-slash normalization, pathname preservation, and not-found behavior | `redirectView` incorrectly implied an HTTP redirect and the route mechanism was underspecified |
| Tool registry | Separated probe-required universal CData names from local application tools; replaced ambiguous `writes` with effect/source-write semantics; standardized allowed modes and exact guards | Local approval-journal mutation is not a source write; live/mock write guards must be machine-visible |
| Approval schema | Tightened digest/money/proposal patterns and restricted allowed actions to the two approved source actions | Free-form allowed actions could authorize an undeclared operation |
| Evidence schema | Made `mode` required | Evidence without its mode cannot support replay/live claim classification |
| Proposal schema | Tightened case, packet, and digest patterns | Loose identifiers weakened cross-record binding |
| Execution schema | Tightened record bindings and allowed an in-progress attempt to have `completedAt: null` | The prior schema listed `EXECUTING` but could represent only completed attempts |
| Support handoff | Restricted `currentState` to the workflow state set | A handoff cannot claim a state the orchestrator does not recognize |
| Workflow state doc | Made human approval mandatory for every consequential source action; amount selects approval role | The prior example implied sub-threshold credits could bypass approval, contradicting product/security contracts |
| Claim taxonomy | Standardized operator-decision tokens to uppercase schema values | Lowercase decision text contradicted the canonical claim schema |

All public or live capability labels remain planning/simulated until their
task-specific evidence exists. T02 performs no CData capability probe.

## Source authority and safe-write resolution

- CRM remains authoritative for case/account/contact and final case history.
- Finance remains authoritative for invoice/payment/credit-memo records.
- Operations remains authoritative for shipment facts.
- The versioned policy source supplies policy content; the deterministic
  CaseFlow policy engine supplies eligibility, amount, and approval class.
- The local approval journal records the human decision; it is not an external
  financial write.
- Finance credit creation precedes CRM update. A finance receipt plus CRM
  failure enters `RECONCILIATION_REQUIRED`; finance is never repeated.
- Whether a probed CData source exposes a safe procedure or another supported
  action mechanism remains T03/T13/T25 evidence, not a T02 assumption.
- A model may draft an evidence-bound explanation only. It cannot select
  authority, calculate the amount, approve, or execute.

## Dependency budget

### Public frontend

| Category | Budget | Decision |
|---|---:|---|
| New runtime packages through T24 | 0 by default | Reuse React, React DOM, native URL/history/fetch, and existing build/test packages |
| Router/state/CSS/icon/chart packages | 0 | Exact pathname map, React state/reducer, CSS, local SVG, and semantic HTML are sufficient |
| External fonts/assets/analytics | 0 | Prohibited by CSP and product boundary |
| Network runtime origins | 0 external | Static same-origin evidence only |

Any later frontend runtime package requires a new decision recording the
missing capability, bundle impact, lockfile change, maintenance cost, and why a
platform/native solution is insufficient.

### Local Python service

| Group | Maximum direct packages | Approved purpose |
|---|---:|---|
| Core runtime | 5 | FastAPI, Pydantic, Pydantic Settings, Uvicorn, JSON Schema validation |
| CData optional adapter extra | 1 | `cdata-connect-ai`, only after T04 records the exact supported package/version |
| Test/type development | 4 | pytest, pytest-cov, HTTPX test client, mypy |
| LLM/agent runtime | 0 required | T06 remains an isolated optional experiment |

T11 must commit exact hash-locked runtime and development dependency files and
document Python version compatibility. Ruff remains a repository scanner in a
pinned Docker image rather than a mutable virtual-environment dependency.

### Size/performance allocation

- T10 records the first CaseFlow-only entry and shared-chunk gzip measurement.
- T24 may add a CaseFlow-specific budget but may not raise or remove an
  existing Workbench ceiling merely to make CaseFlow pass.
- Public evidence is JSON and must be split by scenario/view if one eager
  payload materially delays the first stage.

## File-level implementation map — T10 through T24

| Task | Files created or owned | Existing integration files allowed to change |
|---|---|---|
| T10 | `caseflow/index.html`; `src/caseflow/main.tsx`; `src/caseflow/app/**`; `src/caseflow/routing/routes.ts`; `src/caseflow/disclosure/**`; `src/caseflow/styles/caseflow.css`; four screen shells; `tests/caseflow/{routing,shell,disclosure}.test.{ts,tsx}` | `vite.config.ts`; `src/site/{vitePlugin,metadata}.ts`; focused metadata/build tests only |
| T11 | `caseflow-api/{pyproject.toml,requirements.lock,requirements-dev.lock,README.md}`; `caseflow-api/src/caseflow_api/{main,settings}.py`; `api/**`; `domain/enums.py`; `ports/**`; adapter placeholders; `caseflow-api/tests/{unit,contract}/**` | Root `package.json` only for explicit Python gate commands; scanner config only if the new source type requires it |
| T12 | `caseflow-api/src/caseflow_api/domain/{entities,hashing,money,policy,state_machine}.py`; fixture adapter; `application/{investigate,propose}.py`; gold-case/unit tests | Canonical contracts/fixtures only when tests expose a real contradiction; no copied fixture authority |
| T13 | `adapters/cdata_sdk/**`; `adapters/cdata_mcp/**`; source mapping/query catalog modules; schema fingerprint tests; `deliverables/cdata-adapter-report.md` | Capability/reference records supported by T03–T05 evidence |
| T14 | `evidence/{canonicalize,schemas}.py`; provenance/audit domain modules; evidence/claim tests; generated replay candidates in ignored work area | Evidence/audit schemas and replay fixtures only through the generator |
| T15 | `application/{review,execute,reconcile}.py`; approval/execution ledger modules; `adapters/mock/{approval,finance_action,crm_action,execution_ledger}.py`; failure tests | Approval/execution contracts and replay candidates only through tested generation |
| T16 | `evidence/{manifest,sanitize}.py`; `application/export_evidence.py`; public export CLI; `src/caseflow/replay/{contracts,loadEvidence,selectors}.ts`; sanitizer tests; `public/caseflow-evidence/**` | Public link/secret scanners as required; never raw-to-public copy |
| T17 | `src/caseflow/screens/StrategyScreen.tsx`; strategy components/selectors; `tests/caseflow/strategy.test.tsx`; deterministic capture | No homepage, Workbench, article, demo, sitemap, or existing navigation content |
| T18 | `src/caseflow/screens/TechnicalScreen.tsx`; technical evidence/source/trace components; synchronized CaseFlow source excerpts; focused tests/capture | Build plugin excerpt registry only for markers in current CaseFlow source |
| T19 | `src/caseflow/screens/OperationsScreen.tsx`; operations/handoff/failure components; generated public support handoff; tests/capture | Support-handoff contract only if implementation evidence requires correction |
| T20 | `src/caseflow/screens/ProductScreen.tsx`; reuse/friction components and data; product tests/capture; public-safe friction artifacts | No speculative roadmap or existing portfolio copy |
| T21 | `src/caseflow/tour/**`; URL step parser; focus/scroll controls; copy-link/timing controls; tour tests; generated public run-sheet index | Stage route contract only for evidence-backed deep-link additions |
| T22 | `caseflow-api/src/caseflow_api/observability/**`; evaluation/failure runner; generated evaluation/trace summaries; frontend metric selectors; coverage tests | Coverage configuration and public summaries using measured results only |
| T23 | `scripts/check-caseflow-public.ts`; CaseFlow security/PII/claim tests; `deliverables/security-audit.md`; threat/risk updates | Existing secret/history/supply-chain gates may be extended, never weakened or broadly suppressed |
| T24 | `tests/e2e/caseflow-{accessibility,browser,keyboard,network,responsive,visual}.spec.ts`; deterministic captures; CaseFlow performance report/budget | `playwright.config.ts`; `quality/performance-budgets.json`; Lighthouse route config; screenshot/link scripts, preserving all existing thresholds |

T26, not T10–T24, owns production `vercel.json` CaseFlow rewrites and
route-specific hosted headers. T27 owns release evidence, deployment, and
rollback proof. Neither begins in T02.

## Repository durability and scanner coverage

The local `.git/info/exclude` rule `/caseflow-build-kit/` was the exact rule
that hid 203 non-secret kit files. T02 removes that local rule and tracks the
complete non-secret kit.

The tracked root and kit `.gitignore` files retain narrow exclusions for:

- `.env` variants except `.env.example`;
- Python/Node environments and caches;
- `/.caseflow-live-evidence/` raw evidence;
- `/.caseflow-local/` credentials, OAuth state, and local call ledger;
- experiment-local `.scratch/` and `upstream/` clones;
- normal build, report, log, and temporary outputs.

No whole CaseFlow source, prompt, contract, fixture, template, or experiment
deliverable directory is ignored.

The host supply-chain gate now assigns every tracked `.py` file to pinned Ruff
`0.15.14` at an immutable multi-platform image digest. It runs explicit
correctness, import, upgrade, bug-risk, and Bandit-derived security rule
families plus format checking and retains sanitized SARIF. Ruff has no
suppression category in `security/suppressions.json`. The fail-closed policy
continues to reject unscanned shell, PowerShell, and additional Dockerfiles.
Hosted CodeQL is configured for JavaScript/TypeScript and Python.

## Acceptance evidence required before T02 completion

- every JSON contract/fixture parses as UTF-8 without BOM;
- schema-bound replay fixtures and trace events validate;
- all OpenAPI paths, path parameters, operation IDs, and internal/external refs
  validate;
- every prompt, contract, fixture, template, project-control file, and required
  helper is present in the Git index;
- integrity ledgers canonicalize UTF-8 text to LF while preserving binary bytes
  so hashes are stable across checkout platforms;
- a checkout made only from the Git index runs `validate_kit.py`,
  `render_status.py`, and `next_task.py`;
- existing public build output remains free of CaseFlow and the CaseFlow build
  kit;
- the repository secret, history, Ruff/ESLint, supply-chain, build, test, link,
  and formatting gates pass;
- `git diff --check` passes.
