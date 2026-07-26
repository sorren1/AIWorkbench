# Live Validation Runbook

## Before the run

- Confirm all sources contain only synthetic data.
- Confirm mode `LOCAL_LIVE_READ`; writes disabled.
- Confirm PAT exists without printing it.
- Record source aliases and schema fingerprints.
- Run secret scanner against working tree.
- Reset ignored evidence directory.
- Copy `caseflow-build-kit/templates/CData_CALL_LEDGER.csv` to the ignored
  `/.caseflow-local/cdata-call-ledger.csv` path if the local ledger does not
  already exist.

## Read-only run

1. Resolve canonical case.
2. Retrieve account and case facts.
3. Retrieve invoice, charge line, payments.
4. Retrieve shipment and ordered events.
5. Retrieve policy metadata/content.
6. Build normalized evidence packet.
7. Evaluate deterministic policy.
8. Produce proposal and explanation draft.
9. Validate evidence and proposal schemas.
10. Sanitize and inspect public candidate evidence.

## Optional approved-write run

Only during T25:

1. Human confirms synthetic target and enables live writes.
2. Create proposal and separate approval.
3. Execute finance credit with unique idempotency key.
4. Persist receipt.
5. Update CRM case if supported and safe.
6. Re-run same key to prove duplicate prevention.
7. Disable live writes immediately.
8. Manually inspect source state.

## Publication

- Never copy raw output directly into `public/`.
- Run sanitizer and schema validator.
- Review diff manually.
- Generate evidence manifest and hashes.
- Preserve raw files only in ignored local storage and delete when no longer needed.
