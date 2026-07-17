# Local sandbox security model

## Validation status

- **Local Docker:** implemented and backed by the checked-in successful and failed real-run evidence.
- **E2B:** **implemented but not live-validated** in this revision because `E2B_API_KEY` was not available. Fake contract tests exercise the SDK boundary, upload manifest, normalized evidence, network-verification gate, and cleanup behavior. They are not cloud-run evidence.

The optional provider uses the official `e2b` JavaScript SDK 2.34.0 and reads only the SDK's documented `E2B_API_KEY` environment variable. The key is never passed into the sandbox, written to evidence, or committed.

## Scope and claim boundary

The sandbox is one narrow developer-invoked validation slice for repository-owned synthetic fixtures. The Docker-backed recorded run proves that this repository can create a disposable workspace, enforce an exact change-target allow list, apply one deterministic patch, run fixed checks in constrained local Docker containers, remove the workspace, and emit hash-verifiable evidence. E2B is an explicit alternative implementation of the same provider contract, not a second validated claim.

It is not a hosted code-execution product. The static website has no endpoint, localhost connection, WebSocket, Docker access, patch input, command input, credential input, or way to invoke the runner. It receives only a build-time rendering of a checked-in evidence pack that already passed schema and hash validation.

## Trust boundaries

```text
static public website (read-only recorded evidence)
                 |
                 | no runtime connection
                 x
explicit developer command (Docker by default; E2B only by flag)
                 |
                 v
trusted host controller (repository-owned inputs and fixed patch)
      | creates/copies/checks       | starts fixed commands
      v                             v
disposable temporary repository    selected sandbox provider
      | host-side allow-listed      | network none, non-root user,
      | exact-text replacement      | read-only repository mount,
      | and Git diff verification   | provider-specific controls
      +-----------------------------+
                 |
                 v
checked-in JSON/Markdown evidence (synthetic/public content only)
```

The host controller and selected provider control plane are trusted components. Docker is a privileged local dependency; E2B requires authenticated access to its remote API. This project does not claim to defend a compromised host, Docker daemon, E2B account, SDK, template, or provider control plane. Credentials, the developer home directory, arbitrary repositories, and private files are outside the upload manifest.

## Enforced controls

### Input and command boundary

- `npm run demo:sandbox` accepts no repository path, patch body, test command, file upload, or visitor input. Docker remains the default.
- E2B is selected only with `npm run demo:sandbox -- --provider e2b` or the equivalent convenience script. Selection fails before sandbox creation when `E2B_API_KEY` is absent.
- The only inputs are `examples/toy-repo/issue.synthetic.json`, its checked-in approved `change-targets.json`, deterministic artifact templates, and one of two repository-owned scenarios.
- The default scenario produces a valid repair. The explicit failure script uses a different fixed patch solely to exercise honest failure evidence.
- No LLM, model provider, remote issue tracker, repository provider, database, or enterprise MCP adapter participates.

### Filesystem boundary

- The controller rejects absolute paths, backslashes, empty segments, `.`/`..` segments, paths outside the exact approved list, symbolic links, unsupported filesystem entries, unexpected file creation/deletion, and changes outside the approved target.
- The source fixture and copied workspace are both checked for symbolic links.
- The controlled patch requires exactly one match for the expected source fragment and revalidates the target after the write.
- Git starts from a clean synthetic baseline. The final changed-file set must contain exactly `src/report.js`, and the evidence stores before/after contents, hashes, and the unified diff.
- Artifacts are materialized beside, not inside, the Git repository so controller output cannot be confused with source changes.

### Container boundary

Every fixed command receives a fresh ephemeral container with:

- `--network none`;
- numeric non-root user `65532:65532`;
- a read-only root filesystem and read-only repository bind mount;
- all Linux capabilities dropped and `no-new-privileges` enabled;
- 0.5 CPU, 256 MiB memory and swap, 64 processes, a 16 MiB temporary filesystem, and a 30-second host-side timeout;
- no Docker socket, project root, credentials, or secrets; and
- an exact Node 22.18.0 Alpine tag resolved to the locally inspected repository digest for execution and evidence.

The pre-patch tests must fail without timing out. After the patch, build and test receipts are recorded separately. A failed or timed-out post-patch check makes the run fail and the CLI exit non-zero.

### Optional E2B boundary

The E2B provider creates a fresh `base` sandbox for each execution phase and uploads an explicit manifest containing only:

- text files from the copied synthetic `examples/toy-repo` snapshot, excluding `.git`; and
- the four approved deterministic spec, plan, change-target, and context-pack artifacts.

Upload paths must remain under `workspace/` or `artifacts/`; absolute paths, backslashes, empty segments, `.`/`..` segments, duplicate paths, classification mismatches, content-hash mismatches, more than 128 files, and more than 512 KiB are rejected before an API call. The provider reads every uploaded remote file after execution, rejects symbolic links and unexpected files, compares the remote tree digest with the upload digest, and records the uploaded file count and byte count. The host controller still owns the deterministic patch and final changed-file calculation.

Sandbox creation requests `secure: true`, `allowInternetAccess: false`, `denyOut: ["0.0.0.0/0"]`, no public traffic, and a lifecycle of `onTimeout: "kill"` with a two-minute sandbox TTL. A run is allowed to report `deny-all-verified` only when E2B reports `allowInternetAccess: false` and an in-sandbox outbound HTTPS probe cannot reach the public internet. The restriction applies inside the sandbox; the local SDK necessarily uses outbound access to the E2B control plane for creation, uploads, commands, and cleanup.

No live E2B run occurred in this revision, so these platform settings and the outbound probe have not been observed against an E2B account here. The website therefore labels E2B **implemented but not live-validated** and displays only the existing Docker-backed recorded evidence.

The provider records CPU and memory only from E2B sandbox information. It does not configure or claim an E2B process limit, tmpfs limit, non-root identity, read-only root filesystem, or `no-new-privileges` control. Per-command timeouts and bounded output capture are enforced by the client, and sandbox TTL is the cost backstop.

### Cleanup and evidence

- Provider cleanup and recursive temporary-workspace removal run in `finally`.
- E2B sandboxes carry project/run metadata. Cleanup kills the current instance, verifies that it is no longer running, and searches for tagged running or paused orphans. If the client process is terminated before `finally`, the two-minute `onTimeout: kill` lifecycle is the provider-side cost safeguard.
- A timed-out Docker client triggers an explicit `docker rm --force`; final cleanup also removes any container carrying the run label.
- Command stdout/stderr are bounded, normalized, and hashed. Output truncation prevents a run from passing.
- JSON evidence schema v3 binds inputs, generated artifacts, context pack, registry/approval/budget references, repository trees, command receipts, tool versions, diff, cleanup result, a separate normalized OpenTelemetry-compatible trace artifact, and its own canonical SHA-256 digest.
- Execution budgets are checked before the next tool/repair operation and around measured runtime boundaries. Stops emit a trace event, finalize failure evidence, clean up, and exit non-zero; failed evidence cannot replace the successful public pointer.
- Trace capture is allow-listed metadata only. It excludes prompts, source/diff/output bodies, raw command input, credentials, environment values, personal data, and exception stacks/messages.
- Markdown includes the JSON evidence digest. Immutable-style run filenames use exclusive creation; only a successful pack can update the small `index.json` pointer used by the site build.
- A failed validation run still emits honest JSON and Markdown but exits non-zero and cannot replace the latest successful public snapshot.

## Isolation assumptions and residual risks

This slice is intentionally narrower than a production untrusted-code sandbox.

- Docker Desktop and its Linux VM/kernel remain trusted. A container escape or daemon compromise is outside this prototype's assurance boundary.
- E2B service availability, billing, account policy, template contents, SDK behavior, and provider isolation remain external trust dependencies. A successful future live test would validate only this fixed synthetic slice at that point in time.
- The exact image tag is resolved to a digest at run time and recorded, but this phase does not add image signature verification or a container vulnerability gate. Supply-chain scanning remains a separate release control.
- Linux resource controls vary by Docker host. Evidence records the requested limits, not a claim that every kernel enforced them identically.
- Host-side path validation cannot eliminate every time-of-check/time-of-use race against a malicious local account with write access. The owned fixture, temporary directory permissions, exact replacement, post-write checks, and disposable scope reduce the risk for this local demonstration.
- The host controller applies the patch because the validation container's repository mount is deliberately read-only. Production systems handling untrusted generated patches would need a more isolated patch-application worker and stronger filesystem primitives.
- Captured output is synthetic/public in this fixture. A future runner for real repositories would require redaction, secret isolation, retention controls, and an explicit data-classification policy before evidence could be published.
- Local trace files are hash-bound public fixtures, not an encrypted, access-controlled, tamper-resistant, or production-retention telemetry store.
- The source commit and working-tree state are recorded separately because a generated evidence file cannot contain the hash of the commit that contains itself. A source-tree digest binds the exact inspected local content without pretending the tree was clean.

## Why the website has no live execution

A public execution endpoint would require authenticated identity, abuse prevention, durable authorization, queueing, tenant isolation, secret handling, hardened workers, image governance, egress mediation, monitoring, incident response, and continuous patching. None of those controls are necessary to demonstrate this project's core proof. Keeping execution behind an explicit local command makes the trust boundary inspectable and prevents an anonymous portfolio visitor from turning the site into a code-execution service.

## Public E2B references

- [E2B JavaScript/TypeScript SDK quickstart and `E2B_API_KEY`](https://e2b.dev/docs)
- [Sandbox timeout and explicit shutdown lifecycle](https://e2b.dev/docs/sandbox)
- [Sandbox creation and outbound-network configuration](https://e2b.dev/docs/api-reference/sandboxes/create-sandbox)
