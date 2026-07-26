# Test Strategy

## Test layers

### Domain unit tests

- money/time calculations;
- policy eligibility and threshold;
- evidence completeness/conflicts;
- state transition guards;
- approval digest and expiration;
- idempotency ledger;
- partial execution/reconciliation;
- customer-response truthfulness.

### Adapter contract tests

Run identical contracts against:

- repository fixture adapter;
- official CData mock/compatible test adapter;
- live CData adapter where safe.

### API tests

- schema validation;
- auth/mode guards;
- stable error categories;
- no arbitrary SQL/tool inputs;
- live-write triple gate.

### Frontend tests

- route rendering;
- replay state transitions;
- claim/mode labels;
- tour controls;
- responsive/keyboard behavior;
- no external network;
- no links from existing site.

### Release tests

- build and asset paths;
- Vercel rewrites/deep links;
- CSP/security headers;
- noindex/robots/sitemap exclusion;
- secret/synthetic-data scanning;
- evidence manifest hashes;
- hosted verification.

## Heightened coverage

Require 100% statements/functions and at least 90% branches for:

- policy evaluator;
- workflow guards;
- approval validator;
- idempotency ledger;
- sanitizer;
- claim-state validator.
