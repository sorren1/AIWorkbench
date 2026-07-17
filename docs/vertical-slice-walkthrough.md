# Isolated local sandbox walkthrough

This walkthrough runs only the original synthetic fixture in `examples/toy-repo`. It never reads another repository and accepts no patch or command input.

## Prerequisites

- Node.js 22 LTS (`.nvmrc` records 22.18.0)
- npm with the committed lockfile
- Git
- Docker Desktop or Docker Engine running with Linux containers

Confirm Docker before the run:

```bash
docker version
```

Both client and server sections must be present. The first sandbox run pulls the exact `node:22.18.0-alpine` tag if it is not already cached; execution then uses its resolved digest with networking disabled.

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
10. writes an immutable-style JSON pack and Markdown summary under `evidence/generated/`.

The last line is JSON. Dynamic IDs, digests, and durations will differ, but a successful result has this shape:

```json
{
  "runId": "sandbox-<generated>",
  "status": "SUCCEEDED",
  "sourceCommit": "<40-hex commit>",
  "changedFiles": ["src/report.js"],
  "preTestExitCode": 1,
  "buildExitCode": 0,
  "testExitCode": 0,
  "evidenceDigest": "<64-hex SHA-256>"
}
```

Validate the latest checked-in pack's schema, embedded hashes, tree digests, context-pack binding, canonical evidence digest, index binding, and Markdown binding:

```bash
npm run sandbox:evidence:validate
```

Expected result:

```json
{"status":"VALID","packCount":<number>,"runId":"sandbox-<generated>","evidenceDigest":"<64-hex SHA-256>"}
```

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
npm test -- --run tests/local-sandbox.test.ts
```

The suite covers exact allow-list enforcement, traversal rejection, symlink escape rejection, unexpected files, process timeout, deterministic output normalization, cleanup, successful evidence, failed-test evidence, and evidence tamper detection. The test suite uses a typed fixture provider and does not require Docker; the checked-in recorded run is the Docker-backed integration evidence.

## Public rendering

After a successful, validated pack is checked in:

```bash
npm run build
npm run preview
```

Open `/` and find **Recorded real sandbox run**. Vite validates the checked-in pack during the build, statically renders its summary, and emits the JSON/Markdown as read-only assets. The page performs no execution and makes no request to Docker or localhost.

See [sandbox security model](sandbox-security-model.md) for trust boundaries and residual risks.
