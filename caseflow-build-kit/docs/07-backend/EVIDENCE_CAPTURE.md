# Evidence Capture and Publication Pipeline

```text
raw local run
  → normalized evidence packet
  → schema validation
  → field allow-list sanitizer
  → deny-pattern scanner
  → deterministic canonical JSON
  → SHA-256 digests
  → human diff review
  → public manifest + replay artifacts
```

## Raw workspace

`.caseflow-live-evidence/` is ignored and may contain temporary raw responses. It is never copied wholesale.

## Public workspace

`public/caseflow-evidence/` contains:

- capability summary;
- schema fingerprints;
- canonical evidence packet;
- proposal/approval/action receipts;
- trace;
- evaluation summary;
- manifest with hashes and limitation statements.

## Binding

The public manifest records:

- source commit;
- fixture digest;
- mode;
- collection/sanitization timestamps;
- CData SDK/scaffold versions;
- source aliases only;
- raw-to-public sanitizer version;
- file hashes;
- manual reviewer acknowledgement.
