# CaseFlow — Governed Multi-System Customer Resolution Build Kit

CaseFlow is an independent reference implementation for a representative Principal Forward Deployed Engineer engagement: convert a vague request to “use AI to resolve billing disputes” into a bounded, measurable, supportable multi-system workflow.

## Product thesis

The model is not usually the difficult enterprise dependency. The difficult dependency is current, semantically useful, permission-aware access to operational systems—and a safe authority model for acting on the resulting evidence.

CaseFlow demonstrates:

- enterprise source discovery and normalized SQL access through CData Connect AI;
- deterministic source-of-truth and policy decisions;
- optional LLM synthesis that cannot grant authority or set financial amounts;
- evidence provenance and unsupported-claim prevention;
- separate human approval for consequential actions;
- idempotent cross-system execution and reconciliation after partial failure;
- support, Customer Success, and product-feedback handoff;
- conversion of one field implementation into reusable deployment assets.

## Why this use case

The use case combines the candidate's verifiable strengths—Salesforce, APIs, ETL, event-driven logistics integrations, secure reporting, table/row authorization, human review, testing, telemetry, and reusable delivery patterns—without copying employer code or data.

## Build topology

```text
Synthetic CRM source (Google Sheets baseline; Salesforce dev org optional)
                         │
Synthetic Finance + Operations source (PostgreSQL)
                         │
Synthetic Policy source (Google Drive baseline or local recorded fixture)
                         │
                   CData Connect AI
             Query MCP + Management MCP + Python SDK
                         │
                Local CaseFlow FastAPI service
          discovery → evidence → policy → proposal → approval
               → idempotent execution → reconciliation
                         │
        Static React interview application on the existing Vercel site
           public replay / recorded-live evidence; no public secrets
```

## Repository integration contract

The implementation is added to the existing AIWorkbench repository rather than replacing it:

```text
caseflow/index.html
src/caseflow/**
caseflow-api/**
fixtures/caseflow/**
public/caseflow-evidence/**
tools/caseflow/**
caseflow-build-kit/**
```

The existing Workbench remains under `/workbench/`. CaseFlow is emitted at `/caseflow/` and uses internal route selection for `/strategy`, `/technical`, `/operations`, and `/product`.

## Modes

| Mode | Purpose | Network | Writes |
|---|---|---:|---:|
| `PUBLIC_REPLAY` | Vercel and interviews | None | None |
| `LOCAL_MOCK` | development and failure tests | localhost only | synthetic mock only |
| `LOCAL_LIVE_READ` | CData live validation | CData/source | disabled |
| `LOCAL_LIVE_APPROVED_WRITE` | explicit local proof | CData/source | one approved synthetic target only |
| `RECORDED_LIVE` | sanitized checked-in evidence | None at viewing time | recorded receipt only |

## Execution

Use `EXECUTION_ORDER.md` and run the prompt files in `prompts/` exactly once per stage unless a task fails and must be repeated. Every task updates the machine-readable status and writes a completion report.

## Source freshness

The CData integration runbooks were prepared against public documentation available on **2026-07-26**. Product features and commands can change. Task `T03` requires a capability probe against the actual account before implementation assumptions become facts.

## Public disclosure

Every CaseFlow page must state:

> Independent synthetic reference implementation built from public documentation. Not an official CData product, customer deployment, or endorsement. Live credentials and raw source data are never included in the public build.
