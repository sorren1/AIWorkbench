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
- a locally supplied LiteLLM master key and stable salt key;
- a locally supplied PostgreSQL password;
- an upstream OpenAI-compatible/provider credential;
- three provider/model identifiers for the `delivery-primary`, `delivery-fallback`, and `delivery-review` aliases.

`.env.example` contains names only. Put values in the current process environment or a gitignored local `.env`; never commit the file. The Node CLI reads `LITELLM_MASTER_KEY` and optional `MODEL_GATEWAY_BASE_URL` from its own process environment, so a Compose-only secret is insufficient for the CLI. Load secrets through the local shell or secret manager without echoing them.

Required names:

```text
LITELLM_MASTER_KEY
LITELLM_SALT_KEY
LITELLM_DB_PASSWORD
MODEL_GATEWAY_UPSTREAM_API_KEY
MODEL_GATEWAY_PRIMARY_MODEL
MODEL_GATEWAY_FALLBACK_MODEL
MODEL_GATEWAY_REVIEW_MODEL
```

Optional names are `MODEL_GATEWAY_BASE_URL` (defaults to `http://127.0.0.1:4000`) and `MODEL_GATEWAY_UPSTREAM_BASE_URL`. The master key should follow LiteLLM's documented `sk-` convention. Keep the salt stable while the database volume exists.

## 3. Start the loopback gateway

```powershell
npm run model-gateway:up
docker compose -f ops/model-gateway/compose.yaml ps
```

The Compose file pins LiteLLM `1.92.0` and PostgreSQL 17.6 by multi-platform digest. Port 4000 binds only to `127.0.0.1`. The database uses an internal-only Docker network. The gateway also joins a provider-egress network because real model calls require outbound access; this profile does **not** claim network isolation.

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

The runner blocks its scoped credential in `finally`. After an interruption, retry every retained lease before stopping the gateway:

```powershell
npm run demo:model-gateway:cleanup
npm run model-gateway:down
```

Limit cleanup to one run when investigating another retained lease:

```powershell
npm run demo:model-gateway:cleanup -- --run-id reviewed-local-run
```

The cleanup summary contains aliases and counts, never key values. A nonzero `failed` count produces a nonzero exit and leaves the lease file for another retry. Keep the gateway and master credential available until cleanup succeeds.

To destroy the local LiteLLM database after successful cleanup, explicitly run:

```powershell
docker compose -f ops/model-gateway/compose.yaml down --volumes
```

This deletes local gateway state. It does not revoke or rotate the upstream provider credential; handle that in the provider's control plane when required.

## Failure interpretation

- Missing environment variable: configuration blocker; no live validation occurred.
- Catalog missing an allowed alias: configuration drift; no credential is vended.
- Retryable primary failure: only the next policy-declared alias may run; inspect the fallback span.
- Token/cost/time threshold exceeded: run stops, trace records the dimension, and cleanup still runs.
- Revocation failure: evidence is not finalized; retain the lease file and run cleanup again.
- Provider data retention or regional handling: governed by the configured provider and LiteLLM deployment; this local demonstration does not change those terms.

Never paste keys into issue text, prompts, command arguments, screenshots, logs, evidence, or the browser UI.
