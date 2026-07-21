# Implementation prompt: review expiring supply-chain suppressions

Work in the AI Delivery Workbench repository and complete this as one focused supply-chain phase. Read `AGENTS.md` completely before taking any action and follow it. Inspect before editing, preserve unrelated user changes, and do not deploy, publish, regenerate the public release summary, expose detailed scanner output, or extend suppressions merely to make a gate pass.

## Objective

Resolve the 15 active PostgreSQL/gosu vulnerability suppressions in `security/suppressions.json` before their 2026-08-15 expiry using current scanner data and the exact pinned runtime-image provenance.

At the 2026-07-21 audit, all 15 suppressions were active, zero were expired, and each was scoped to `gosu` in the exact pinned PostgreSQL 17.10 Alpine image digest. Their current justification says the trusted entrypoint supplies fixed local arguments only to drop privileges before PostgreSQL starts. That prior justification is context, not permission to renew without fresh evidence.

## Required investigation

1. Record the initial worktree, branch, HEAD, full-history status, Docker availability, scanner/image versions, and current date.
2. Inspect at minimum:
   - `security/suppressions.json`;
   - all pinned runtime-image references and digests;
   - `scripts/supply-chain/` contracts and gate logic;
   - SBOM, license, provenance, and public-summary generation boundaries;
   - applicable Dockerfiles/configuration and the PostgreSQL entrypoint call path;
   - supply-chain documentation and recent decision-log entries.
3. Refresh current advisory databases and scan the exact pinned image. Keep raw SARIF, SBOM, license, and scanner reports only in gitignored `.security-reports/` or restricted CI artifacts.
4. For every suppression, determine whether the finding is:
   - fixed by an available trusted image update;
   - no longer reported;
   - still applicable and reachable;
   - still present but demonstrably unreachable under the exact runtime configuration;
   - duplicated or obsolete.
5. Inspect upstream image and package provenance from authoritative sources. Do not rely on a stale cached summary or severity label alone.

## Implementation requirements

Choose the safest evidence-supported disposition for each finding:

- remove suppressions for findings that are fixed, absent, duplicated, or no longer relevant;
- update the pinned image by digest when a compatible trusted fix exists, then rebuild/retest all dependent tooling;
- treat a reachable unresolved release-blocking vulnerability as a blocker;
- renew only findings that remain present and demonstrably unreachable, with exact package/image scope, current advisory identifiers, a concise threat-path justification, reviewer date, and a short explicit expiry;
- never use a wildcard package, image, path, version, advisory, or indefinite expiry;
- keep `reviewOn <= expiresOn` and ensure the gate rejects expired or malformed entries;
- update operational/security documentation and `docs/decision-log.md` when the image or risk decision changes materially.

Do not run `security:supply-chain:record`, alter `public/security/release-summary.json`, or claim the existing v1.0.8 evidence covers a new image digest. A runtime-image change requires a new release lineage and fresh hosted evidence under the repository's release process.

## Verification and acceptance

Use the committed Node version, full reachable Git history, Docker with Linux containers, network access, pinned scanner images, and current advisory databases. Run at minimum:

```powershell
npm ci
npm run security:check
npm run security:supply-chain
npm run security:release-evidence:require
npm run check
```

If an image digest changes, also run all sandbox, model-gateway, integration, and complete release gates applicable to that image, including `npm run check:all`. Confirm that detailed reports remain untracked and that no generated public release evidence changed.

Acceptance requires:

- zero expired suppressions;
- every remaining suppression independently justified against current exact-image scan evidence;
- no wildcard or indefinite suppression;
- current dependency, container, SBOM, license, provenance, and history controls pass;
- any image update is pinned by digest and fully tested;
- `public/security/release-summary.json` and existing tags remain unchanged;
- missing Docker, network, advisory data, scanners, or full history is reported as a blocker, not a pass.

## Completion requirements

End with one focused Git commit. Report each suppression disposition in a sanitized summary, image/digest changes, files changed, exact commands and exit codes, scanner/database dates without sensitive raw findings, commit hash/message, and any release blocker or follow-up deadline.
