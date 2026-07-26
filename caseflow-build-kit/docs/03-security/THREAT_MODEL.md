# Threat Model

## Assets

- CData PAT and provider keys;
- source OAuth tokens;
- synthetic but structurally representative data;
- approval authority;
- financial action endpoint;
- evidence integrity;
- public portfolio reputation.

## Threats and controls

| Threat | Control |
|---|---|
| Secret committed or emitted | ignored env/evidence dirs, history scan, output scan, sanitizer tests |
| Prompt injection in policy/source text | treat source text as data; fixed tool policy; no authority from content; output schema |
| Over-broad SQL or data exfiltration | query catalog, selected columns, limits, source allow list, local-only credentials |
| Model invents eligibility or amount | deterministic policy engine; model only drafts explanation |
| Model/self approves | distinct reviewer identity and approval API; state guard |
| Stale approval used after evidence change | proposal/evidence digest binding; invalidation |
| Duplicate credit on retry | idempotency ledger and source reference |
| Partial write hidden | per-action receipts and reconciliation state |
| Public replay mistaken for live | persistent mode and claim labels |
| Route obscurity treated as security | synthetic-only data; no secrets; no execution endpoint |
| Malicious browser visitor | static assets only; CSP; no forms/actions that leave browser |
| Live response contains PII/token/header | allow-list sanitizer; deny patterns; manual review before publication |
| Schema drift produces wrong query | discovery fingerprint, adapter contract check, fail closed |
| Tool-call quota exhaustion | ledger, mock-first development, cached schema evidence |
