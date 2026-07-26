# Secret Handling Runbook

## Allowed storage

- ignored `.env.local` or `caseflow-api/.env`;
- ignored `/.caseflow-local/` for OAuth state, the local CData call ledger, and
  other non-evidence operator state;
- operating-system secret manager;
- CData/connector-managed local credential store for CLI;
- Vercel secrets are not needed for the initial static release.

## Prohibited storage

- source code, fixtures, markdown, screenshots, traces, browser local storage, checked-in JSON, completion reports, shell command examples containing real values, or chat messages.

## PAT workflow

1. Human creates PAT in CData settings.
2. Human copies it directly to local secret storage.
3. Agent verifies only presence and a redacted fingerprint, never value.
4. Raw evidence records a stable non-secret credential label, not the token.

Temporary raw source responses belong only in
`/.caseflow-live-evidence/`. Temporary upstream experiment clones belong only
in `caseflow-build-kit/experiments/**/upstream/` or
`caseflow-build-kit/experiments/**/.scratch/`. None of these paths may become a
public-evidence input.
5. Revoke the PAT after the project or rotate if exposure is suspected.

## Publication sanitizer deny patterns

- `Authorization` headers;
- `Basic <base64>` values;
- PAT/token/key-like fields;
- OAuth URLs and codes;
- email addresses other than approved synthetic domains;
- IPs, hostnames, database DSNs, filesystem user paths;
- raw exception objects that may include request headers.
