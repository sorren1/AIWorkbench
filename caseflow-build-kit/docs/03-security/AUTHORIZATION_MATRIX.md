# Authorization Matrix

| Persona | View evidence | Create proposal | Approve >$1,000 | Execute approved credit | Update CRM case | Reconcile |
|---|---:|---:|---:|---:|---:|---:|
| Resolution Analyst | Yes | Yes | No | No | No | No |
| Finance Manager | Yes | No | Yes | No | No | No |
| CaseFlow Execution Service | scoped | No | No | Yes, with approval | Yes, after receipt | limited |
| Support Manager | Yes | No | No | No | No | view/assign |
| FDE Operator | diagnostic | No | No | disabled by default | disabled by default | diagnostic/manual runbook |
| Public Viewer | replay only | simulated control only | simulated control only | never | never | replay only |

## Approval requirements

- synthetic reviewer identity distinct from proposer;
- proposal digest and evidence digest match;
- exact amount and action list;
- approval class and expiry;
- no unresolved conflict;
- action has not already completed under another key.
