# Implementation prompt: reconcile v1.0.8 release documentation

Work in the AI Delivery Workbench repository and complete this as one focused documentation phase. Read `AGENTS.md` completely before taking any action and follow it. Inspect before editing, preserve unrelated user changes, and do not deploy, publish, move or recreate tags, regenerate release evidence, or change generated security evidence.

## Objective

Make public documentation accurately describe the completed v1.0.8 release while preserving the intentional distinction between audited source, evidence child, tag, and deployed artifact.

The verified lineage is:

- audited source: `fc2957843077606a1cdb8fe9101cbed9421fb243`;
- direct evidence child: `1c1c06b8e5c6973604b025b63aafed606b2bd522`;
- annotated tag: `v1.0.8`, pointing to the evidence child;
- deployed commit: `1c1c06b8e5c6973604b025b63aafed606b2bd522`;
- production origin: `https://tylerwilhite.dev`;
- Workbench route: `https://tylerwilhite.dev/workbench/`.

The current default-branch documentation still contains statements such as “v1.0.8 candidate,” says `public/security/release-summary.json` is absent, or lists hosted v1.0.8 facts as unestablished. Those statements were correct for the audited source commit but contradict the tagged evidence-child checkout and verified deployment when written as current status.

## Required investigation

1. Record the initial worktree, branch, HEAD, exact tag, and source/evidence parent relationship.
2. Inspect at minimum:
   - `README.md`;
   - `ARCHITECTURE.md`;
   - `CHANGELOG.md`;
   - `docs/releases/1.0.8.md`;
   - `docs/deployment-verification.md`;
   - `docs/release-evidence.md`;
   - `docs/release-audit-checklist.md`;
   - `public/security/release-summary.json`;
   - the live `/security/release-summary.json` and `/security/deployment-binding.json`;
   - exact-source and evidence-child hosted Quality and CodeQL results.
3. Identify every statement that confuses historical source-candidate instructions with current release status.
4. Confirm the live release summary matches the checked-in summary and the deployment binding reports the exact lineage before citing either as authoritative.

## Implementation requirements

- Preserve historical statements when they are explicitly scoped to the audited source commit or pre-release procedure.
- Add or update current-status language so a reader can distinguish:
  1. what existed in the audited source;
  2. what the one-file evidence child added;
  3. where `v1.0.8` points;
  4. what is deployed and verified now;
  5. what remains conditional or out of scope.
- Link the authoritative hosted release summary and deployment binding where appropriate.
- Keep Preview and Production terminology exact.
- Do not imply production reliability, shared identity, multi-user state, real external integrations, live E2B, or live LiteLLM/provider validation.
- Keep the approved professional-context statement unchanged and separate from prototype claims.
- Do not edit `public/security/release-summary.json`, the annotated tag, or any generated deployment binding.
- Record a meaningful documentation-boundary decision in `docs/decision-log.md` if the status/history structure changes.

## Verification and acceptance

Run at minimum:

```powershell
npm ci
npm run format:check
npm run links:check
npm run security:release-evidence:require
npm run check
```

Also search the public documentation for stale current-status phrases such as `v1.0.8 candidate`, `summary.*absent`, `No v1.0.8 Production`, and `Facts not established` and review each remaining match in context.

Acceptance requires:

- current status is consistent across README, architecture, changelog, release notes, and deployment documentation;
- the source/evidence/tag/deployment distinction remains explicit;
- all version, link, security-evidence, and deterministic checks pass;
- no generated evidence or tag changes;
- no new professional, security, adoption, performance, or production claim without evidence.

## Completion requirements

End with one focused Git commit. Report the contradictions corrected, files changed, exact commands and exit codes, links manually checked, commit hash/message, and any remaining deferred release-status work.
