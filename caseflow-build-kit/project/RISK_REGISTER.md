# Risk Register

| ID | Risk | Likelihood | Impact | Mitigation | Trigger / owner | Status |
|---|---|---:|---:|---|---|---|
| R-001 | Developer Edition capability differs from public documentation | Medium | High | Run T03 probe; make adapters capability-driven; record actual account facts | Any missing tool / T03 owner | Open |
| R-002 | CData monthly quota is consumed during development | Medium | Medium | Use official mock server, cache schema metadata, keep call ledger, reserve live-call budget | 350 calls consumed / technical owner | Open |
| R-003 | Live demo fails because of network/OAuth/source availability | Medium | High | Public replay and recorded-live modes are primary; live mode is optional | Any degraded dependency / presenter | Open |
| R-004 | Public build leaks secrets or raw source data | Low | Critical | No live backend; ignored evidence directory; sanitizer; secret scanning; synthetic-only sources | Any scanner finding / security owner | Open |
| R-005 | Project overstates customer-facing or production experience | Medium | High | Explicit claim taxonomy and professional-evidence bridge language | Review detects ambiguity / owner | Open |
| R-006 | New route destabilizes existing Workbench release evidence | Medium | High | Isolated entrypoint; compatibility tests; no navigation changes; T26/T27 gates | Existing check regression / owner | Open |
| R-007 | Interview artifact dominates the conversation | Medium | Medium | Timeboxed stage tours; ask permission; answer question first | Tour overruns rehearsal / presenter | Open |
| R-008 | Scope expands into a full CRM/ERP product | Medium | Medium | One canonical case, five gold cases, explicit non-goals | New feature lacks interview purpose / owner | Open |
| R-009 | Toolkits/RBAC/workspace capabilities are assumed incorrectly | Medium | High | Capability probe; distinguish CaseFlow service tools from Connect AI Toolkits | Unsupported feature found / T03 | Open |
| R-010 | CData CLI licensing or Java setup blocks progress | Medium | Low | Treat T07 as optional evidence; do not block core product | CLI not usable in 60 minutes / owner | Open |
| R-011 | Claude Design produces non-implementable visual concepts | Medium | Medium | Enforce component/state/responsive/accessibility handoff format | Missing acceptance detail / T08–T09 | Open |
| R-012 | Partial cross-source write creates inconsistent state | Medium | High | Saga receipts, idempotency ledger, reconciliation state, failure tests | Second write fails / workflow owner | Open |
| R-013 | The CaseFlow build-kit archive is locally excluded and absent from branch history | Medium | High | Preserve the local exclude; force-add only required task evidence; retain a private backup; choose a durable prompt/contract distribution boundary before cross-worktree design handoff | Required kit input is unavailable in another clone/worktree / operator before T08 | Open |
