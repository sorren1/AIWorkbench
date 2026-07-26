# Rollback Plan

## Trigger

Rollback if any of the following occurs:

- old portfolio/Workbench route regression;
- secret or real-data exposure;
- broken direct stage route;
- misleading claim label;
- evidence/hash mismatch;
- serious accessibility regression;
- release verification failure.

## Procedure

1. Disable/share no further CaseFlow links.
2. Revert Vercel Production to the last verified deployment.
3. Confirm `/`, `/workbench/`, and `/workbench/demo/` are healthy.
4. Revoke/rotate any potentially exposed credential.
5. Open an incident record with impact, source commit, evidence, and remediation.
6. Fix on a new branch and rerun all release gates; do not mutate the old release record.
