# Runtime Modes

## `PUBLIC_REPLAY`

- default in Vercel and production static build;
- loads checked-in evidence under `/caseflow-evidence/`;
- no CData, model, database, or source requests;
- all actions are replay controls, not mutations;
- visible badge: `Deterministic replay`.

## `LOCAL_MOCK`

- local FastAPI service;
- official CData Query API mock where practical plus repository fixtures;
- supports errors, timeout, streaming, and large-result tests;
- writes are synthetic and resettable.

## `LOCAL_LIVE_READ`

- CData SDK/MCP reads against owner-controlled synthetic sources;
- no source write adapters enabled;
- raw output stored only in ignored evidence workspace;
- sanitizer emits public-safe recorded evidence.

## `LOCAL_LIVE_APPROVED_WRITE`

- opt-in only;
- requires explicit environment flag, allow-listed synthetic target, valid approval, and idempotency key;
- records before/after source identifiers and receipts;
- never used during a remote interview unless the interviewer explicitly requests it and the presenter chooses to accept the risk.

## `RECORDED_LIVE`

- static presentation of a prior sanitized live run;
- includes source aliases, tool/query names, timestamps, row counts, digests, and limitations;
- does not include tokens, credentials, real email addresses, OAuth URLs, raw headers, or unnecessary fields.
