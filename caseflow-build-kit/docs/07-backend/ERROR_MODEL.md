# Error and Failure Model

## Categories

- `AUTHENTICATION`
- `AUTHORIZATION`
- `CONNECTION`
- `RATE_LIMIT`
- `TIMEOUT`
- `SCHEMA_DRIFT`
- `QUERY_CONTRACT`
- `DATA_MISSING`
- `DATA_CONFLICT`
- `POLICY_UNAVAILABLE`
- `POLICY_INDETERMINATE`
- `APPROVAL_INVALID`
- `IDEMPOTENCY_CONFLICT`
- `SOURCE_WRITE_REJECTED`
- `PARTIAL_EXECUTION`
- `MODEL_UNAVAILABLE`
- `MODEL_OUTPUT_INVALID`
- `INTERNAL`

## Retry policy

Automatic retry is limited to classified transient connection, timeout, rate-limit, and 5xx failures with bounded exponential backoff and jitter. Never automatically retry:

- approval-invalid;
- data conflict;
- schema drift;
- idempotency conflict;
- rejected financial action;
- partial execution of a non-idempotent action.

## User-safe error

Expose what failed, customer impact, whether any action occurred, next owner, and next step. Do not expose stack traces, tokens, connection strings, or full source payloads.
