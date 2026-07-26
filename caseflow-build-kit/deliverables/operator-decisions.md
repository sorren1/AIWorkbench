# Operator Decisions

- **Date:** 2026-07-26
- **Operator:** Tyler Wilhite
- **Host repository:** `D:\workbench` — `sorren1/AIWorkbench`
- **Feature branch:** `feature/caseflow-reference-implementation`
- **Public base route:** `/caseflow/`
- **Stage routes:**
  - `/caseflow/strategy`
  - `/caseflow/technical`
  - `/caseflow/operations`
  - `/caseflow/product`
- **Source profile:** Profile A preferred; Profile C then Profile D are preauthorized fallbacks
- **Salesforce Developer Org available:** No — Salesforce is optional and must not delay delivery
- **Public runtime:** Deterministic static replay
- **Local live read permitted:** Yes, against synthetic owner-controlled sources only
- **One synthetic live write in T25 permitted:** Decide at T25; default is read-only unless the target is isolated, synthetic, reversible, and explicitly approved
- **Vercel production deployment approval owner:** Tyler Wilhite
- **Initial LLM provider for the official scaffold:** None required; complete T06 with limitation if no separately funded API key is available
- **CData CLI policy:** Optional; do not install Java or system-level CLI software unattended
- **Notes:** CaseFlow remains a direct-only, unlisted independent reference implementation. The existing homepage and AI Delivery Workbench will contain no links to it.

## Product and route decisions

1. CaseFlow will be deployed on the existing Vercel site under `/caseflow/*`.
2. The existing AI Delivery Workbench will remain unchanged and will not link to CaseFlow.
3. CaseFlow must not be added to the homepage, article pages, existing Workbench navigation, or sitemap.
4. CaseFlow routes must use:
   - `noindex`
   - `nofollow`
   - `noarchive`
5. All four interview routes will present the same canonical workflow through different lenses.
6. Each stage page must be independently understandable without requiring the interviewer to have seen an earlier stage.
7. The public deployment will contain no Python API, CData credentials, OAuth tokens, PATs, model keys, database credentials, or live write endpoints.
8. The public artifact must function completely in deterministic replay mode without network access to CData or an LLM provider.

## Data and evidence boundaries

1. Only synthetic, owner-controlled data may be used.
2. No current or former employer, client, customer, recruiter, or third-party production tenant may be connected.
3. No real customer, employee, invoice, shipment, payment, support case, contact, or policy data may be used.
4. Live CData reads are permitted only against synthetic sources created specifically for CaseFlow.
5. All public evidence must be sanitized before it is committed.
6. Raw live responses, account identifiers, OAuth URLs, tenant identifiers, emails, tokens, and credentials must not be tracked.
7. Public claims must be classified as one of:
   - `IMPLEMENTED`
   - `LIVE_VALIDATED`
   - `RECORDED`
   - `SIMULATED`
   - `PRODUCTION_DESIGN_ONLY`
8. A capability may not be labeled `live-validated` unless evidence from the actual Developer Edition account supports it.
9. The independent CaseFlow project must not imply CData endorsement, partnership, employment, customer deployment, or official product status.

## Source-profile decision

### Preferred Profile A

- `CaseFlowCRM` — Google Sheets
  - Accounts
  - Contacts
  - Cases
- `CaseFlowOperations` — PostgreSQL
  - invoices
  - invoice lines
  - payments
  - credit memos
  - shipments
  - shipment events
  - execution ledger
- `CaseFlowPolicy` — Google Drive
  - versioned synthetic resolution policy

### Preauthorized fallback order

1. Profile A
2. Profile C
3. Profile D

Profile B, using a Salesforce Developer Org, is optional. It may be used only when an owner-controlled Developer Org is already available and safe to configure. It must not delay the project.

When a safely accessible PostgreSQL instance is not available, do not expose a local database to the public internet merely to preserve Profile A. Use Profile C or Profile D and document the limitation.

## Live-write decision

No live write is authorized during T01 through T24.

During T25, one synthetic live write may be proposed for approval only when all of the following are true:

1. The target is entirely synthetic and owner-controlled.
2. The action is isolated from financial, employer, customer, or third-party production systems.
3. The action is reversible or disposable.
4. The exact before-state and expected after-state are documented.
5. An idempotency key is required.
6. Duplicate execution has been tested.
7. The operator gives explicit approval immediately before execution.
8. The result can be sanitized without exposing account or tenant details.

When any condition is unmet, T25 remains read-only and the write is demonstrated through deterministic replay and local mock execution.

## Phase-one preauthorization — T01 through T07

Codex is authorized to execute T01 through T07 in dependency order after T00 is complete.

Codex may continue automatically between successfully completed Codex-owned tasks only when:

- the prior task passed every acceptance gate;
- the next task dependencies are complete;
- no human, credential, destructive-action, design, or deployment checkpoint is pending;
- no unexpected repository changes are present;
- no secret value must be printed or placed in a prompt.

Codex must stop before T08.

### T01 — Repository preflight

Authorized:

- Inspect repository state, branch, remotes, build configuration, entry points, routes, Vercel configuration, security headers, tests, and release evidence.
- Run existing read-only repository inspection and validation commands.
- Create required planning, evidence, and completion artifacts.

Not authorized:

- Reset, discard, overwrite, or stash unrelated user changes.
- Modify product source code.
- Change production routes.
- Install new runtime dependencies.
- Deploy or publish anything.

### T02 — Architecture and contract reconciliation

Authorized:

- Reconcile planning documents, route contracts, schemas, fixtures, OpenAPI definitions, and architecture assumptions against actual repository evidence.
- Correct inconsistencies in build-kit planning artifacts.
- Add validation-only utilities when justified.
- Produce the authoritative architecture-reconciliation artifact used by Codex and Claude Design.

Not authorized:

- Begin CaseFlow production implementation.
- Alter existing Workbench behavior.
- Add a new runtime dependency without documented justification.
- Change the approved public route or static/live boundary.

### T03 — CData Developer Edition capability probe

Authorized:

- Inspect the current Developer Edition account capabilities.
- Validate owner-controlled synthetic connections.
- Perform read-only catalog, schema, table, column, and metadata discovery.
- Execute narrow synthetic read-only queries with explicit selected columns and row limits.
- Use Query MCP.
- Use Management MCP only for listing, inspection, and connection-test operations.
- Record sanitized tool names, source aliases, schema names, table names, row counts, feature availability, call counts, and errors.
- Fall back from Profile A to Profile C and then Profile D without requesting another decision.

Not authorized:

- Destructive Management MCP operations.
- Remote source writes.
- Stored-procedure execution.
- Broad or unbounded queries.
- Employer or customer data.
- Tracking the real CData account email.
- Printing PATs, OAuth tokens, Basic-auth values, or raw authentication headers.
- Claiming live validation when using mock or replay data.

### T04 — Python SDK and official mock-server spike

Authorized:

- Create an isolated Python virtual environment.
- Install the official `cdata-connect-ai` package.
- Clone or inspect the official CData Python repository in an ignored temporary directory.
- Run the official mock server, tests, and examples.
- Perform one narrow live synthetic read when T03 established safe account access.
- Install development-only dependencies inside the isolated spike.

Required:

- The official mock path must pass even if the live account path is unavailable.
- Values must be parameterized.
- Timeouts and classified retries must be explicit.
- Raw secret-bearing requests and responses must not be recorded.

Not authorized:

- Main CaseFlow API implementation.
- Live writes.
- Publishing a package.
- Committing the virtual environment, credentials, or raw live output.

### T05 — Query MCP and Management MCP spike

Authorized Query MCP operations:

- `tools/list`
- catalog discovery
- schema discovery
- table discovery
- column discovery
- source-specific instruction discovery
- narrow read-only queries against synthetic sources

Authorized Management MCP operations:

- `tools/list`
- list CaseFlow connections
- inspect CaseFlow connections
- test CaseFlow connections

Not authorized:

- Create, delete, or modify a connection without a separate human action.
- Execute a stored procedure.
- Invoke a write tool.
- Query non-synthetic data.
- Run an unbounded query.

### T06 — Official agent scaffold spike

Preferred scaffold:

- LangChain
- Python

The scaffold is an experiment, not the public runtime and not automatically a production dependency.

Provider policy:

- A separate LLM API key is not required to complete T06.
- When no approved API key exists, Codex may generate, install, inspect, test the non-model portions, document the limitation, and complete T06 with limitation.
- ChatGPT, Claude, or Gemini subscriptions must not be treated as API credentials.
- No API key may be requested in chat or committed.

The generated agent may:

- read synthetic evidence;
- perform read-only discovery;
- summarize evidence in experimental local runs.

The generated agent may not:

- determine authoritative policy;
- approve a resolution;
- execute a write;
- bypass deterministic authorization;
- become a mandatory public runtime dependency.

### T07 — Optional CData CLI spike

Codex may:

- Detect whether Java 17+ and the CData CLI are already installed.
- Use an existing safe installation.
- Inspect official installation instructions.
- Perform read-only schema discovery against synthetic sources when the CLI is already usable.

Codex may not:

- Install Java or other system-level software unattended.
- Change machine-wide configuration.
- Enter licensing, activation, OAuth, or account credentials on behalf of the operator.
- Delay the core implementation to force the CLI spike to succeed.

When Java, CLI installation, licensing, activation, or OAuth is not already available, T07 must complete with limitation after its documented timebox.

## CData call budget

Maximum pooled CData calls for T03 through T06: 120.

Suggested allocation:

- T03 capability and source discovery: 40
- T04 Python SDK live smoke test: 10
- T05 MCP discovery and narrow query tests: 50
- T06 scaffold experiment: 20

At least 150 calls should remain reserved for later live validation, rehearsal, and debugging.

All live calls must be recorded in the ignored local call ledger.

## Mandatory pause conditions

Codex must pause immediately when:

1. A credential, PAT, API key, OAuth consent, or account login requires human action.
2. A source unexpectedly exposes non-synthetic data.
3. A write or destructive operation would be required.
4. A credential would need to appear in a tracked file, command transcript, completion report, screenshot, or prompt.
5. Repository state contains unexplained user changes.
6. T01 or T02 cannot pass without changing existing Workbench behavior.
7. T04 cannot pass its mandatory official-mock acceptance gate.
8. A documented acceptance criterion conflicts with another authoritative contract.
9. A task would need to broaden beyond its defined scope.
10. A public claim cannot be supported by sanitized evidence.
11. The next task is T08.

## Parallel Claude Design authorization

Claude Design may begin only after T02 is complete and committed.

After T02:

- create a separate Git worktree and design branch;
- run T08 and T09 in that isolated worktree;
- continue T03 through T07 in the primary CaseFlow worktree;
- merge and reconcile both tracks before T10.

Claude Design may not:

- begin before the T02 architecture-reconciliation artifact exists;
- change routes, case facts, architecture, security boundaries, or claim classifications;
- write production application code;
- imitate CData branding;
- begin T10.

## Phase-one completion condition

Phase one is complete when T01 through T07 are either:

- `COMPLETE`; or
- `COMPLETE_WITH_LIMITATION` only where the task permits that outcome.

At phase completion, Codex must stop and report:

- completed tasks;
- limitations;
- live capabilities actually proven;
- CData call budget consumed;
- files changed;
- validation results;
- current Git commit;
- next required task or design reconciliation.

No deployment, public release, production promotion, live financial action, or optional T30 work is authorized by this record.
