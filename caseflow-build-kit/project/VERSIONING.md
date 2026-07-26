# Versioning and Evidence Lineage

Use semantic versions for public artifacts:

- `0.x` — implementation and interview rehearsal.
- `1.0.0-interview` — first stable complete panel artifact.
- patch release — corrections that do not change case behavior.
- minor release — new optional scenario or view.

A release record must bind:

1. audited source commit;
2. generated public evidence commit, if separate;
3. route contract;
4. fixture digest;
5. live-evidence manifest digest, if present;
6. hosted deployment commit;
7. release tag;
8. test and hosted-verification results.

Never reuse live validation evidence for a later source revision without rerunning the affected validation.
