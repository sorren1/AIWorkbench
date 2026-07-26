# Master Plan

## Mission

Build a compact but production-minded reference implementation that demonstrates the complete Principal Forward Deployed Engineer operating model:

1. discover the business problem and authoritative sources;
2. design a governed architecture;
3. implement a working, inspectable technical slice;
4. make failure, ownership, and customer handoff explicit;
5. convert field learning into reusable product assets.

## Canonical business outcome

Reduce the time required to investigate a multi-system invoice dispute while preserving evidence quality, approval authority, duplicate-write protection, and supportability.

The project does **not** claim a real customer productivity improvement. It measures synthetic case completion, evidence correctness, deterministic disposition agreement, blocked unauthorized writes, duplicate prevention, and handoff completeness.

## Target release

`CaseFlow v1.0.0-interview`

Public deployment:

- static deterministic replay;
- direct-only `/caseflow/*` routes;
- no secrets or live source access;
- no indexability or existing-site navigation;
- sanitized evidence for any local live validation;
- clear independent-project disclosure.

## Workstreams

### A. Product and discovery

- engagement brief;
- stakeholder map;
- source authority and business policy;
- measurable acceptance criteria;
- phased rollout and non-goals.

### B. CData integration

- Developer Edition capability probe;
- Query MCP and Management MCP;
- Python DB-API connector;
- official agent scaffold experiment;
- optional CLI schema-development experiment;
- live validation evidence and quota control.

### C. Workflow implementation

- explicit state machine;
- evidence packet;
- deterministic policy engine;
- proposal and approval records;
- idempotent write execution;
- reconciliation after partial failure;
- support-ready trace and runbook.

### D. Presentation application

- strategy, technical, operations, and product lenses;
- guided interview tours;
- interruption-safe deep links;
- implemented/recorded/simulated labels;
- accessibility and responsive behavior.

### E. Assurance and release

- unit, contract, integration, browser, accessibility, visual, performance, security, and evidence gates;
- same-site route compatibility;
- release summary and deployment binding;
- rollback proof.

## Canonical implementation boundary

The initial public artifact is a static React application. The Python service runs locally for live and mock validation and emits sanitized evidence. No CData PAT, source credential, model key, or write endpoint is deployed to Vercel.

## Decision hierarchy

1. Security and truthfulness.
2. Existing Workbench compatibility.
3. Interview clarity.
4. Correct domain behavior.
5. Live integration depth.
6. Visual polish.
7. Optional enhancements.

## Exit criteria

See `DEFINITION_OF_DONE.md`. T29 must independently verify all mandatory criteria.
