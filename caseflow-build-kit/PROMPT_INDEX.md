# Prompt Index

The prompt files are executable work orders. Copy the full contents of exactly one prompt into the named agent session. Keep this kit inside the host repository so all relative paths resolve.

- `T00` — `00_*.md`: Bootstrap and operator decisions — **Human**
- `T01` — `01_*.md`: Repository preflight and branch baseline — **Codex**
- `T02` — `02_*.md`: Architecture and contract reconciliation — **Codex**
- `T03` — `03_*.md`: CData Developer Edition capability probe — **Human + Codex**
- `T04` — `04_*.md`: Python SDK and official mock-server spike — **Codex**
- `T05` — `05_*.md`: Query MCP and Management MCP spike — **Codex**
- `T06` — `06_*.md`: Official agent scaffold spike — **Codex**
- `T07` — `07_*.md`: Optional CData CLI schema-development spike — **Codex**
- `T08` — `08_*.md`: Claude Design visual system — **Claude Design**
- `T09` — `09_*.md`: Claude Design four-stage interaction specification — **Claude Design**
- `T10` — `10_*.md`: CaseFlow frontend shell and hidden route — **Codex**
- `T11` — `11_*.md`: Local FastAPI service and mode architecture — **Codex**
- `T12` — `12_*.md`: Synthetic domain, policy engine, and fixtures — **Codex**
- `T13` — `13_*.md`: CData adapters and source discovery — **Codex**
- `T14` — `14_*.md`: Evidence collection and provenance — **Codex**
- `T15` — `15_*.md`: Approval, idempotent execution, and reconciliation — **Codex**
- `T16` — `16_*.md`: Replay recorder, sanitizer, and evidence binding — **Codex**
- `T17` — `17_*.md`: Stage 2 strategy and discovery view — **Codex**
- `T18` — `18_*.md`: Stage 3 technical view — **Codex**
- `T19` — `19_*.md`: Stage 4 operations and handoff view — **Codex**
- `T20` — `20_*.md`: Stage 5 product leverage view — **Codex**
- `T21` — `21_*.md`: Guided interview tours and presenter controls — **Codex**
- `T22` — `22_*.md`: Observability, evaluations, and failure injection — **Codex**
- `T23` — `23_*.md`: Security, clean-room, and claim-boundary audit — **Codex**
- `T24` — `24_*.md`: Accessibility, browser, visual, and performance gates — **Codex**
- `T25` — `25_*.md`: Live validation and sanitized evidence capture — **Human + Codex**
- `T26` — `26_*.md`: Same-site Vercel integration — **Codex**
- `T27` — `27_*.md`: Release evidence, deployment, and rollback proof — **Human + Codex**
- `T28` — `28_*.md`: Interview scripts and rehearsal package — **Human + Codex**
- `T29` — `29_*.md`: Final independent audit — **Codex**
- `T30` — `30_*.md`: Optional post-interview enhancements — **Codex**

## Recommended session names

Use names such as `CaseFlow T08 Design System` or `CaseFlow T14 Evidence Collection`. This makes later review and handoff easier.

## Context discipline

Do not paste the entire kit into an agent prompt. The work order directs the agent to read only the canonical files required for that task. Agents may inspect additional repository files when needed, but must record any contract divergence.
