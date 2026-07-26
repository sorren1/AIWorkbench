# Claim and Evidence Boundaries

Every material feature shown publicly must carry one of these labels.

| Label | Meaning | Minimum evidence |
|---|---|---|
| `IMPLEMENTED` | Behavior exists and is covered by local tests | source path + passing test |
| `LIVE_VALIDATED` | Behavior ran against current CData/source endpoints | sanitized manifest + timestamp + hashes + account capability record |
| `RECORDED` | Viewer replays a previously measured or live-validated result | binding to immutable evidence file |
| `SIMULATED` | Deterministic fixture represents an external response or action | disclosure adjacent to result |
| `PRODUCTION_DESIGN_ONLY` | Required production control is described but not implemented | architecture rationale and limitation |

## Mandatory distinctions

- Story Runner professional work and CaseFlow are separate systems.
- Public CaseFlow data is synthetic.
- Live local validation is not a customer deployment.
- Developer Edition is not proof of paid-tier workspace isolation, RBAC, or SSO.
- Application-layer purpose-specific tools are not represented as Connect AI Toolkits unless they were actually created and validated.
- A hash detects change; it is not a trusted signature or timestamp.
- A passing gold-case suite proves deterministic fixture agreement, not real-world resolution accuracy.

## Prohibited phrases

- “CData built this with me.”
- “This is a CData reference architecture.”
- “Production-ready” without an explicit boundary.
- “Enterprise RBAC is implemented” when only a production design is shown.
- “Live demo” while replay mode is active.
- “AI approved the credit.” The human approved; the system proposed.
