# Security Model

## Security objectives

- keep all credentials out of source and public output;
- restrict reads to the minimum synthetic records and fields;
- prevent the model from choosing authority or action scope;
- require human approval for consequential writes;
- prevent duplicate execution;
- retain enough evidence for review without publishing sensitive material;
- fail safely when evidence or dependencies are incomplete.

## Control layers

1. **Environment control:** live modes only in local trusted environment.
2. **Connection control:** CData PAT and source OAuth outside model/browser context.
3. **Source control:** selected catalogs/schemas/tables and explicit query catalog.
4. **Application authorization:** persona/action matrix, proposal digest, approval threshold.
5. **Workflow control:** state guards, expiration, stale invalidation, idempotency.
6. **Output control:** schema validation, evidence references, PII redaction, sanitizer.
7. **Release control:** secret scans, synthetic-data checks, immutable evidence hashes, direct-route tests.

## Production-design-only controls

- enterprise SSO and RBAC;
- delegated per-user identity passthrough;
- isolated workspaces and service accounts;
- managed vault and rotation;
- immutable signed audit storage;
- SIEM integration and alerting;
- formal retention/deletion policy;
- HA and disaster recovery.
