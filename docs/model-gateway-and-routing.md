# Model gateway and routing

The model gateway is an optional local control-plane adapter. It demonstrates how a stage agent can receive narrower authority than the gateway administrator while preserving the project's offline default and static-host boundary.

## Runtime boundaries

| Surface                          | Default behavior                                  | Network and credential boundary                                                          |
| -------------------------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Public case study and React demo | Reads checked-in sanitized status only            | No gateway client, provider call, credential entry, or live catalog request              |
| `offline` CLI profile            | Deterministic `OfflineModelGateway`               | No network; in-memory opaque lease; no live-validation evidence                          |
| `live` CLI profile               | `LiteLlmModelGateway` over loopback               | Explicit invocation; administrator secret comes from a file or OS-injected process value |
| LiteLLM container                | Routes allowed aliases to the configured provider | Loopback admin/API port; provider egress is required and documented                      |

The local Docker code-validation sandbox and the model gateway are separate systems. The sandbox remains deterministic and network-disabled. The gateway is not imported into `demo:sandbox` and cannot execute repository writes.

## Contract

`ModelGateway` defines five operations:

- fetch a sanitized versioned catalog;
- reconcile and vend a scoped credential;
- invoke an allowed model through an opaque credential lease;
- revoke the exact lease; and
- retry cleanup for interrupted runs.

The returned lease contains alias, agent/run binding, allow-listed models, cost ceiling, and expiry. It intentionally has no credential-value field. Only the LiteLLM adapter can read the raw key from its gitignored local lease state.

## Versioned routing policy

Registry schema version 4 represents these model-policy controls:

- preferred model alias;
- allowed provider IDs and model aliases;
- ordered fallback aliases;
- maximum input/output tokens, cost, and latency;
- allowed delivery stages and task categories;
- optional required independent-review model; and
- `OFFLINE_ONLY` or `EXPLICIT_LOCAL_PROFILE` execution mode.

The policy evaluator fails closed when a policy is not approved, the stage/task is denied, an alias falls outside the allow list, or the selected profile conflicts with the execution mode. The live catalog must contain every allowed alias before a credential is vended.

Fallback is narrow and visible. Only retryable transport, rate-limit, timeout, or server failures can advance to the next declared alias. The runner emits an error span for the failed attempt and a `model.fallback` event before the next `model.call`. It does not create consensus or silently retry a different provider.

An independent-review model is invoked only when `independentReview.required` is true, its alias is allowed, and it is distinct from the primary response model. Otherwise the public record says configured but not exercised.

## Credential and secret handling

Compose receives only paths to Docker secret source files. The LiteLLM master key, stable salt, PostgreSQL password/URL, and upstream provider key are mounted below `/run/secrets` and converted to process environment only by the gateway entrypoint. The Node client reads `LITELLM_MASTER_KEY_FILE`, or accepts `LITELLM_MASTER_KEY` only when an OS secret manager injects it directly into that one process. Neither values nor materialized files belong in source, `.env`, browser configuration, command output, trace attributes, evidence, or UI.

The credential alias is deterministic and non-personal:

```text
ai-delivery-workbench--agent-implementation--<run-id>--<identity-digest>
```

Before vending, an existing local lease with the same alias is blocked. The replacement key is bounded to model aliases, a maximum spend, and a 15-minute lifetime. Revocation occurs before evidence finalization, and `finally` retries revocation on errors. SIGINT/SIGTERM cancellation reaches catalog, vending, invocation, revocation, and cleanup requests. The CLI registers exact-run cleanup before acquisition, makes concurrent revocation single-flight, bounds each cleanup operation to 10 seconds, and rejects evidence when cleanup fails. `.workbench/model-gateway/leases/` exists only for crash recovery and is ignored by Git; lease expiry is defense in depth rather than proof of cleanup.

## Budgets and accounting

The runner derives a versioned `ExecutionBudget` from the approved model policy. It checks wall-clock time, stage time, model-call count, input tokens, output tokens, and cost after each call. `STOP_RUN` is the default threshold action. A stop emits a trace budget event, fails the run, and still enters credential cleanup.

Token and cost labels preserve their source:

- `ACTUAL_PROVIDER_REPORTED` when returned by the provider/gateway response;
- `ESTIMATED` when derived from character count or the sanitized model catalog; and
- zero cost in the deterministic offline profile, without a live-provider claim.

Pricing metadata identifies the response header or catalog version and its retrieval time. The system does not call an estimate billed or actual.

LiteLLM spend logging is deliberately metadata-only: spend logs remain enabled for accounting, `store_prompts_in_spend_logs` is false, the maximum retention period is seven days, and cleanup runs daily. Prompt and response content remains excluded from both gateway spend logs and workbench traces. Upstream-provider retention is a separate provider control.

## Trace and evidence data

The model path uses the same official OpenTelemetry packages as the sandbox observability path. Safe spans record run, issue, agent version/hash, policy version/hash, credential alias, provider/model IDs, attempt, fallback, latency, usage/cost basis, budget events, and output digest.

Prompt bodies, response bodies, source code, provider keys, virtual keys, master credentials, and raw headers are excluded. A successful live evidence manifest binds its trace ID and SHA-256 trace artifact hash. The generated public status changes to `validated local gateway integration` only when that evidence and its trace validate together.

## Current truth state

The offline adapter and LiteLLM adapter are implemented and contract-tested. No live local/provider credential was available during this phase, so no live catalog or live-run evidence is checked in. The public label is exactly:

> gateway implemented; live provider path not validated

See [`docs/local-model-gateway-runbook.md`](local-model-gateway-runbook.md) for opt-in commands and [`docs/adr/local-model-gateway.md`](adr/local-model-gateway.md) for the choice rationale.
