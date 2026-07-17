# Isolated sandbox walkthrough

This walkthrough runs only the original synthetic fixture in `examples/toy-repo`. It never reads another repository and accepts no patch or command input.

Local Docker remains the default and requires no cloud account. The optional E2B provider is **implemented but not live-validated** in this revision because no `E2B_API_KEY` was available; no E2B evidence is checked in.

## Prerequisites

- Node.js 22 LTS (`.nvmrc` records 22.18.0)
- npm with the committed lockfile
- Git
- Docker Desktop or Docker Engine running with Linux containers

Confirm Docker before the run:

```bash
docker version
```

Both client and server sections must be present. The first sandbox run builds `ops/sandbox/Dockerfile` from its digest-pinned Node 22.23.1 Alpine 3.24 base. The resulting minimal local image contains Node but not npm, runs as numeric non-root by default, and executes with networking disabled.

## Successful vertical slice

Install dependencies and invoke the fixed runner:

```bash
npm ci
npm run demo:sandbox
```

The command:

1. creates an internal run ID and OS temporary directory;
2. copies `examples/toy-repo` and initializes a clean synthetic Git baseline;
3. loads `issue.synthetic.json` and the approved exact target `src/report.js`;
4. writes deterministic spec, plan, change-target, and governed context-pack artifacts beside the copied repository;
5. runs the tests in a constrained, network-disabled container and requires the expected failure;
6. applies one exact replacement to `src/report.js` after path and symlink checks;
7. rejects any unexpected file or changed path;
8. runs the fixed build and tests in fresh constrained, network-disabled containers;
9. removes labeled containers and the temporary workspace in `finally`; and
10. writes immutable-style JSON, Markdown, and normalized OpenTelemetry-compatible trace evidence under `evidence/generated/`.

The last line is JSON. Dynamic IDs, digests, and durations will differ, but a successful result has this shape:

```json
{
  "runId": "sandbox-<generated>",
  "provider": "LOCAL_DOCKER",
  "status": "SUCCEEDED",
  "sourceCommit": "<40-hex commit>",
  "changedFiles": ["src/report.js"],
  "preTestExitCode": 1,
  "buildExitCode": 0,
  "testExitCode": 0,
  "evidenceDigest": "<64-hex SHA-256>",
  "traceId": "<32-hex trace ID>",
  "traceArtifactSha256": "<64-hex SHA-256>"
}
```

Validate the latest checked-in pack's schema, embedded hashes, tree digests, context-pack binding, trace hierarchy/hash/governance binding, canonical evidence digest, index binding, and Markdown binding:

```bash
npm run sandbox:evidence:validate
```

Expected result:

```json
{"status":"VALID","packCount":<number>,"runId":"sandbox-<generated>","evidenceDigest":"<64-hex SHA-256>"}
```

## Optional E2B provider

The project pins the official `e2b` JavaScript SDK 2.34.0. E2B is never selected implicitly. Set the documented key in the current process environment and pass the explicit provider flag:

```powershell
$env:E2B_API_KEY = "<your untracked key>"
npm run demo:sandbox -- --provider e2b
```

The equivalent convenience command is:

```powershell
npm run demo:sandbox:e2b
```

Do not put the credential in source, evidence, command output, or a tracked file. `.env.example` contains only the empty key name. The provider uploads only the copied synthetic repository files and approved generated artifacts. It requests deny-all outbound access and refuses an isolation claim unless E2B reports the setting and a fixed outbound HTTPS probe is blocked. Each phase receives a fresh sandbox with a two-minute `onTimeout: kill` lifecycle; instance cleanup, tagged-orphan cleanup, and inactive-state verification run before evidence can pass.

Run the opt-in live integration test with the same environment variable:

```powershell
npm run test:e2b:live
```

Without `E2B_API_KEY`, the live test is reported as skipped and the E2B CLI exits before creating a sandbox. Fake contract tests still run in the normal suite. This revision did not have the key, so neither the live command nor its network and cleanup controls are claimed as observed.

E2B reports sandbox CPU and memory, but this implementation does not configure or claim E2B process/tmpfs limits, a read-only root filesystem, a non-root identity, or Docker-style capability controls. The outbound restriction applies inside the sandbox; local SDK calls to the E2B control plane still require network access.

## Honest failure path

The repository includes a second fixed scenario that applies an allow-listed but intentionally insufficient patch. It exists only to prove failure receipts and process exit behavior:

```bash
npm run demo:sandbox:failure
```

Expected behavior:

- the pre-patch test fails as required;
- the build passes;
- the post-patch test fails;
- JSON and Markdown failure evidence are written;
- the process exits non-zero; and
- `evidence/generated/index.json` continues to reference the most recent successful evidence.

PowerShell exposes the non-zero result in `$LASTEXITCODE`; POSIX shells expose it in `$?`.

## Focused security and evidence tests

```bash
npm test -- --run tests/local-sandbox.test.ts tests/e2b-sandbox.test.ts
```

The suites cover exact allow-list enforcement, traversal rejection, symlink escape rejection, unexpected files, process timeout, deterministic output normalization, cleanup, successful evidence, failed-test evidence, trace hierarchy/redaction/binding, budget warnings/stops, repair limits, exact-versus-estimated accounting, evidence tamper detection, explicit E2B selection, bounded E2B uploads, network-verification gating, normalized provider metadata, and orphan cleanup. Fake provider tests require neither Docker nor E2B; the checked-in recorded run remains Docker-backed integration evidence.

## Public rendering

After a successful, validated pack is checked in:

```bash
npm run build
npm run preview
```

Open `/` and find **Recorded real sandbox run**. Vite validates the checked-in pack and trace during the build, statically renders their summary, and emits JSON/Markdown/trace files as read-only assets. Open `/demo/?screen=trace` for the accessible waterfall and budget view. Neither page performs execution or connects to Docker, E2B, localhost, a collector, or a telemetry backend. Until a real successful E2B pack exists, E2B appears only as **implemented but not live-validated** and the displayed recorded run remains Docker-backed.

See [sandbox security model](sandbox-security-model.md) for trust boundaries and residual risks.
