# Local model gateway runbook

This runbook is for a developer-controlled machine. It does not create a public endpoint and must not be used with arbitrary visitor input.

## 1. Verify the offline default

No provider, Docker gateway, or credential is needed:

```powershell
npm ci
npm run demo:model-gateway -- --run-id offline-verification
```

Expected properties in the safe summary:

- profile `offline`;
- gateway `OFFLINE_MOCK`;
- status `gateway implemented; live provider path not validated`;
- `credentialRevoked: true`;
- no evidence file and no live-provider claim.

## 2. Prepare the optional live profile

Prerequisites:

- Docker with Compose v2;
- a local OS secret manager containing a LiteLLM master key, stable salt key, PostgreSQL password, matching PostgreSQL connection URL, and upstream provider credential;
- three provider/model identifiers for the `delivery-primary`, `delivery-fallback`, and `delivery-review` aliases.

Compose receives secret **file paths**, never secret values. Retrieve the five values from Windows Credential Manager or PowerShell SecretManagement, macOS Keychain, `pass`, or another OS-managed store and materialize owner-readable files under gitignored `.workbench/model-gateway/secrets/` for the lifetime of the stack. Local Compose file secrets are mounted at `/run/secrets`; unlike Swarm secrets, the source files are not an encrypted-at-rest Docker store. Protect the source directory with OS permissions and delete the materialized files after shutdown.

Required names:

```text
LITELLM_MASTER_KEY_FILE
LITELLM_SALT_KEY_FILE
LITELLM_DB_PASSWORD_FILE
LITELLM_DATABASE_URL_FILE
MODEL_GATEWAY_UPSTREAM_API_KEY_FILE
MODEL_GATEWAY_PRIMARY_MODEL
MODEL_GATEWAY_FALLBACK_MODEL
MODEL_GATEWAY_REVIEW_MODEL
```

The database URL secret has the form `postgresql://litellm:<URL-encoded-password>@database:5432/litellm` and must match the password file. `.env.example` contains only ignored file paths and non-secret configuration placeholders; do not place secret values in `.env`. The Node CLI reads the same master-key file. As an alternative, an OS secret manager may inject `LITELLM_MASTER_KEY` directly into the CLI process, but setting both master-key inputs is rejected.

Optional names are `MODEL_GATEWAY_BASE_URL` (defaults to `http://127.0.0.1:4000`) and `MODEL_GATEWAY_UPSTREAM_BASE_URL`. The master key should follow LiteLLM's documented `sk-` convention. Keep the salt stable while the database volume exists.

## 3. Start the loopback gateway

```powershell
npm run model-gateway:up
docker compose -f ops/model-gateway/compose.yaml ps
```

The Compose file builds a hash-locked derivative of LiteLLM's signed, Prisma-equipped database image for `v1.94.0-dev.3` and pins PostgreSQL `17.10-alpine3.24` by multi-platform digest. The derivative updates only `mcp` to `1.28.1`, relocates the pinned Prisma cache, generates the client during the image build, and runs as explicit UID/GID `65534:65534`. PostgreSQL runs directly as `70:70`.

Both credential-bearing services drop every Linux capability, enable `no-new-privileges`, and use read-only root filesystems. LiteLLM receives only a 64 MiB `/tmp` tmpfs and the read-only config mount. PostgreSQL receives only `/tmp`, its socket tmpfs, and the named data volume. Port 4000 binds only to `127.0.0.1`; the database is internal-only. The gateway also joins a provider-egress network because real model calls require outbound access, so this profile does **not** claim network isolation.

Spend/accounting metadata is enabled, prompt and response content is excluded from spend logs, records older than seven days are deleted, and cleanup runs daily. The Admin UI is disabled so this local profile does not expose a second configuration surface.

## 4. Run the opt-in integration check

Enable the live test only in the shell that has the required variables:

```powershell
$env:MODEL_GATEWAY_LIVE_TEST = "1"
npm run test:model-gateway:live
```

The test must vend a scoped key, invoke the configured primary alias, block the key, and report cleanup success. A skip is not a pass and does not authorize a validation claim.

Run the evidence-producing path explicitly:

```powershell
npm run demo:model-gateway:live -- --run-id reviewed-local-run
npm run model-gateway:evidence:validate
npm run model-gateway:generate
npm run model-gateway:check
```

The CLI accepts no visitor prompt or arbitrary model ID. Its request is a repository-owned synthetic fixture. A successful run writes normalized JSON trace and evidence files under `evidence/generated/` only after the scoped key is blocked. Regeneration then exposes the sanitized catalog/status to the static site.

## 5. Cleanup and shutdown

The CLI handles SIGINT and SIGTERM at its boundary, stops new calls, propagates cancellation through the runner and adapter, and starts one idempotent cleanup pass. Each cleanup operation is limited to 10 seconds. Interrupted exits use 130 for SIGINT and 143 for SIGTERM; a cleanup failure is always non-zero. The runner blocks its scoped credential before evidence finalization and retries in `finally` as defense in depth.

After an interruption, retry every retained lease before stopping the gateway:

```powershell
npm run demo:model-gateway:cleanup
npm run model-gateway:down
```

Limit cleanup to one run when investigating another retained lease:

```powershell
npm run demo:model-gateway:cleanup -- --run-id reviewed-local-run
```

The cleanup summary contains aliases and counts, never key values. Cleanup reads only validated lease files under `.workbench/model-gateway/leases/`; an exact `--run-id` limits revocation further. Concurrent or repeated revocation for the same lease is single-flight. A nonzero `failed` count produces a nonzero exit and leaves the lease file for another retry. Lease expiry remains a backstop, not successful cleanup evidence. Keep the gateway and master credential available until cleanup succeeds.

To destroy the local LiteLLM database after successful cleanup, explicitly run:

```powershell
docker compose -f ops/model-gateway/compose.yaml down --volumes
```

This deletes local gateway state. It does not revoke or rotate the upstream provider credential; handle that in the provider's control plane when required.

After the stack stops, delete the five materialized files under `.workbench/model-gateway/secrets/`. Deleting the files before virtual-key cleanup prevents the cleanup client and gateway from authenticating.

## Failure interpretation

- Missing environment variable: configuration blocker; no live validation occurred.
- Catalog missing an allowed alias: configuration drift; no credential is vended.
- Retryable primary failure: only the next policy-declared alias may run; inspect the fallback span.
- Token/cost/time threshold exceeded: run stops, trace records the dimension, and cleanup still runs.
- Revocation failure: evidence is not finalized; retain the lease file and run cleanup again.
- Interrupted cleanup or cleanup timeout: the command exits non-zero; keep the loopback gateway available and rerun exact-run cleanup until `failed` is zero.
- Spend-log retention: prompt/response content is disabled; accounting metadata is retained for at most seven days with daily cleanup. Provider-side data retention and regional handling still follow the configured provider's terms.

Never paste keys into issue text, prompts, command arguments, screenshots, logs, evidence, or the browser UI.
