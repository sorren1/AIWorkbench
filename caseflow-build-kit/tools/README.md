# Build-Kit Utilities

- `validate_kit.py` — checks required files, JSON, task sequence, prompt references, and obvious secret-like values.
- `render_status.py` — renders `project/STATUS.md` from `project/status.json`.
- `next_task.py` — prints the next dependency-ready task and prompt.
- `preflight_repo.py` — non-destructive host-repository inspection for T01.
- `hash_fixtures.py` — regenerates `fixtures/FIXTURES.sha256` with
  platform-independent LF-normalized hashes for UTF-8 text and byte-exact
  hashes for binary files.
- `render_artifact_manifest.py` — records the complete tracked build-kit inventory.
- `hash_kit.py` — regenerates the kit hash ledger from that tracked inventory
  using the same portable hashing rule.

These scripts manage the planning kit. Product-specific tooling is implemented later under the host repository's `tools/caseflow/` path.
