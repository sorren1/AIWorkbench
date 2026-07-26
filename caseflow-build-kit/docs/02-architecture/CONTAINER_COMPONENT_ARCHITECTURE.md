# Container and Component Architecture

## Static web application

```text
caseflow/index.html        Vite HTML input; no existing page links to it
src/caseflow/
  main.tsx                isolated React bootstrap
  app/                    shell and mode composition
  routing/                dependency-free pathname selection
  components/             accessible presentation components
  domain/                 TypeScript public-view contracts only
  screens/                strategy, technical, operations, product
  replay/                 checked-in evidence loader and selectors
  tour/                   guided interview state
  styles/                 caseflow-scoped tokens and components
  disclosure/             claim labels and public boundaries
tests/caseflow/            unit and component tests
tests/e2e/caseflow*.spec.ts
```

## Local Python service

```text
caseflow-api/src/caseflow_api/
  api/                    FastAPI routes and request validation
  domain/                 entities, value objects, policy, state machine
  application/            use cases and purpose-scoped service tools
  ports/                  source, approval, ledger, clock, model interfaces
  adapters/
    cdata_sdk/            deterministic DB-API access
    cdata_mcp/            discovery and query MCP proof path
    mock/                 official mock/local fixtures
    replay/               evidence serialization
    llm/                  optional synthesis only
  evidence/               canonicalization, hashing, sanitization
  observability/          traces, metrics, failure classification
caseflow-api/tests/        unit, contract, integration, and failure tests
```

## Development experiments

- official agent scaffold, isolated under `experiments/cdata-agent-scaffold/`;
- optional CData CLI spike under `experiments/cdata-cli-spike/`;
- neither becomes an undeclared runtime dependency.

## Public evidence

`public/caseflow-evidence/` contains only schema-valid, sanitized,
deterministic artifacts and an evidence manifest. Canonical planning fixtures
remain under `caseflow-build-kit/fixtures/` and are referenced directly by
backend tests rather than copied into a second hand-maintained source.

Raw live output remains in ignored `/.caseflow-live-evidence/`. Credentials,
the local CData call ledger, OAuth state, and temporary upstream experiment
clones remain under ignored `/.caseflow-local/`.

The authoritative file-level map and dependency budget are in
`caseflow-build-kit/deliverables/architecture-reconciliation.md`.
