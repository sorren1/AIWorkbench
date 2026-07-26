# CaseFlow Build Kit — Start Here

This package is an execution system for building **CaseFlow — Governed Multi-System Customer Resolution**, an independent, synthetic reference implementation that uses CData Connect AI as the enterprise data-access layer.

## Target outcome

A stable, interview-ready product served at direct-only routes on the same Vercel deployment as the existing AI Delivery Workbench:

- `/caseflow/strategy` — Director/hiring-manager lens
- `/caseflow/technical` — technical-lead lens
- `/caseflow/operations` — customer-experience and handoff lens
- `/caseflow/product` — executive/product-leverage lens

The existing homepage and AI Delivery Workbench must contain **no links** to CaseFlow. The route is public but intentionally unlisted, uses entirely synthetic data, contains no secrets, and defaults to deterministic replay mode.

## Where to unzip it

The intended workflow is:

1. Clone or open the current `sorren1/AIWorkbench` repository.
2. Create a branch such as `feature/caseflow-reference-implementation`.
3. Unzip this archive into the repository root so this file exists at `caseflow-build-kit/START_HERE.md`.
4. Run `python caseflow-build-kit/tools/validate_kit.py`.
5. Read `caseflow-build-kit/EXECUTION_ORDER.md`.
6. Execute the numbered prompts serially. Do not batch several implementation prompts into one agent session.

The kit is planning material, contracts, fixtures, and prompts. Product code is intentionally created by Claude Design and Codex inside the host repository so every modification is reviewable.

## Tool allocation

- **Claude Design:** information architecture, visual system, screen composition, interaction and presentation design. It must not invent platform claims or silently change architecture.
- **Codex 5.6 sol extra-high:** repository inspection, architecture enforcement, implementation, tests, CData spikes, evidence capture, deployment integration, and release gates.
- **Human:** CData account creation, OAuth consent, secret entry, live-write confirmation, Vercel deployment approval, and interview judgment.

## First commands

```bash
python caseflow-build-kit/tools/validate_kit.py
python caseflow-build-kit/tools/next_task.py
```

PowerShell:

```powershell
python .\caseflow-build-kit\tools\validate_kit.py
python .\caseflow-build-kit\tools\next_task.py
```

## Core rules

1. One complete system, four presentation lenses. Do not create four unrelated demos.
2. Build every lens before the first hiring-manager presentation. Later rounds reveal more; they do not depend on emergency feature construction.
3. The public route is replay-only. Live CData credentials and live write execution remain local.
4. The model never determines its own authority. Identity, source scope, action scope, approval requirements, and credit limits are deterministic.
5. Structured operational data is queried as structured data. Do not put invoices and shipment rows into a vector database merely because the product uses AI.
6. Any consequential write requires a distinct human approval record and an idempotency key.
7. Every public claim is labeled as `implemented`, `live-validated`, `recorded`, `simulated`, or `production-design-only`.
8. Do not imitate CData branding or imply endorsement, employment, partnership, or customer deployment.
9. Never commit `.env`, PATs, provider keys, OAuth tokens, raw live responses, or customer information.
10. Preserve the existing Workbench behavior, release evidence, URLs, and security posture.

## Canonical case

A synthetic B2B customer disputes a $1,240 expedite surcharge on invoice `INV-88201`. Shipment `SHP-77431` arrived more than 24 hours after its committed delivery time because of a carrier-caused delay. Policy version `2026.2` permits refunding the expedite fee but requires human approval for credits over $1,000. CaseFlow gathers evidence, applies deterministic policy, proposes a credit, blocks execution until approval, writes idempotently, handles partial failure, and produces an operational handoff.

Read `README.md` and `project/MASTER_PLAN.md` next.
