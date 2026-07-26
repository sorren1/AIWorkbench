# Failure Injection Matrix

| ID | Injection | Expected behavior |
|---|---|---|
| F-001 | CRM authentication failure | `FAILED_SAFE`, category `AUTHENTICATION`, no other action |
| F-002 | Operations query timeout | bounded retry then `FAILED_SAFE` or incomplete evidence |
| F-003 | Schema column renamed | `SCHEMA_DRIFT`, fail closed, mapping update required |
| F-004 | Invoice missing | `EVIDENCE_INCOMPLETE`, no proposal |
| F-005 | Conflicting delivery events | `EVIDENCE_CONFLICT`, no proposal |
| F-006 | Policy unavailable | `POLICY_UNAVAILABLE`, no action |
| F-007 | Invalid model output | deterministic facts preserved; explanation omitted/fallback |
| F-008 | Write requested without approval | `APPROVAL_INVALID`, no adapter call |
| F-009 | Duplicate execution | return original receipt; no duplicate record |
| F-010 | Finance success, CRM failure | `RECONCILIATION_REQUIRED`; preserve credit receipt |
| F-011 | Same idempotency key, changed amount | `IDEMPOTENCY_CONFLICT`; operator review |
| F-012 | Public mode attempts live call | hard rejection and test failure |
| F-013 | Sanitizer finds token/email/DSN | publication blocked |
| F-014 | Monthly call budget exceeded | live adapter disabled; use mock/replay |
