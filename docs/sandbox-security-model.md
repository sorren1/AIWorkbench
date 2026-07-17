# Local sandbox security model

## Scope and claim boundary

The sandbox is one narrow developer-invoked validation slice for repository-owned synthetic fixtures. It proves that this repository can create a disposable workspace, enforce an exact change-target allow list, apply one deterministic patch, run fixed checks in constrained local Docker containers, remove the workspace, and emit hash-verifiable evidence.

It is not a hosted code-execution product. The static website has no endpoint, localhost connection, WebSocket, Docker access, patch input, command input, credential input, or way to invoke the runner. It receives only a build-time rendering of a checked-in evidence pack that already passed schema and hash validation.

## Trust boundaries

```text
static public website (read-only recorded evidence)
                 |
                 | no runtime connection
                 x
explicit local developer command
                 |
                 v
trusted host controller (repository-owned inputs and fixed patch)
      | creates/copies/checks       | starts fixed commands
      v                             v
disposable temporary repository    local Docker Engine
      | host-side allow-listed      | network none, non-root user,
      | exact-text replacement      | read-only repository mount,
      | and Git diff verification   | resource and time limits
      +-----------------------------+
                 |
                 v
checked-in JSON/Markdown evidence (synthetic/public content only)
```

The host controller and local Docker daemon are trusted components. Docker is a privileged local dependency; this project does not claim to defend a compromised host or daemon from the machine owner. The container receives a read-only bind mount of only the copied toy repository. The Docker socket, project repository, credentials, home directory, environment secrets, and evidence output directory are not mounted.

## Enforced controls

### Input and command boundary

- `npm run demo:sandbox` accepts no repository path, patch body, test command, file upload, or visitor input.
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

### Cleanup and evidence

- Provider cleanup and recursive temporary-workspace removal run in `finally`.
- A timed-out Docker client triggers an explicit `docker rm --force`; final cleanup also removes any container carrying the run label.
- Command stdout/stderr are bounded, normalized, and hashed. Output truncation prevents a run from passing.
- JSON evidence is schema-validated and binds inputs, generated artifacts, context pack, registry references, repository trees, command receipts, tool versions, diff, cleanup result, and its own canonical SHA-256 digest.
- Markdown includes the JSON evidence digest. Immutable-style run filenames use exclusive creation; only a successful pack can update the small `index.json` pointer used by the site build.
- A failed validation run still emits honest JSON and Markdown but exits non-zero and cannot replace the latest successful public snapshot.

## Isolation assumptions and residual risks

This slice is intentionally narrower than a production untrusted-code sandbox.

- Docker Desktop and its Linux VM/kernel remain trusted. A container escape or daemon compromise is outside this prototype's assurance boundary.
- The exact image tag is resolved to a digest at run time and recorded, but this phase does not add image signature verification or a container vulnerability gate. Supply-chain scanning remains a separate release control.
- Linux resource controls vary by Docker host. Evidence records the requested limits, not a claim that every kernel enforced them identically.
- Host-side path validation cannot eliminate every time-of-check/time-of-use race against a malicious local account with write access. The owned fixture, temporary directory permissions, exact replacement, post-write checks, and disposable scope reduce the risk for this local demonstration.
- The host controller applies the patch because the validation container's repository mount is deliberately read-only. Production systems handling untrusted generated patches would need a more isolated patch-application worker and stronger filesystem primitives.
- Captured output is synthetic/public in this fixture. A future runner for real repositories would require redaction, secret isolation, retention controls, and an explicit data-classification policy before evidence could be published.
- The source commit and working-tree state are recorded separately because a generated evidence file cannot contain the hash of the commit that contains itself. A source-tree digest binds the exact inspected local content without pretending the tree was clean.

## Why the website has no live execution

A public execution endpoint would require authenticated identity, abuse prevention, durable authorization, queueing, tenant isolation, secret handling, hardened workers, image governance, egress mediation, monitoring, incident response, and continuous patching. None of those controls are necessary to demonstrate this project's core proof. Keeping execution behind an explicit local command makes the trust boundary inspectable and prevents an anonymous portfolio visitor from turning the site into a code-execution service.
