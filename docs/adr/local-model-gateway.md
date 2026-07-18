# ADR: use a local LiteLLM gateway for the optional provider path

- Status: Accepted
- Date: 2026-07-18
- Scope: developer-invoked local model routing only

## Context

The workbench already has a versioned model-policy contract, explicit execution budgets, and OpenTelemetry-compatible local evidence. It needs one optional path that can exercise real provider-neutral routing without adding a backend to the public site, placing a provider master key in an agent process, or making the deterministic sandbox depend on model availability.

The required control is broader than an OpenAI-compatible completion endpoint. A run needs an allow-listed model catalog, a short-lived per-agent/per-run credential, a cost ceiling, explicit fallback order, revocation, cleanup after interruption, and sanitized evidence. Building those administrator functions as an original proxy would add security-sensitive surface unrelated to the case study's delivery-governance thesis.

## Decision

Use [LiteLLM Proxy](https://docs.litellm.ai/docs/simple_proxy) as an optional loopback-only local gateway. The runtime derives from LiteLLM's signed, Prisma-equipped database `v1.94.0-dev.3` multi-platform digest `sha256:e71660f09007a1c08a870b6c9819e86621b1ee8578d5843857dabb5ccb78e1be`. The generic upstream non-root variant cannot currently initialize the database-backed proxy reliably, so the repository makes the database image non-root explicitly: it relocates the pinned Prisma cache, generates the client at build time, and sets numeric user `65534:65534`. It also installs one hash-locked, dependency-neutral `mcp==1.28.1` wheel because the base contains Python `3.13.14`, `ddtrace 4.11.0`, and vulnerable `mcp 1.26.0`. The exact locally built result is Trivy-gated and receives a CycloneDX SBOM. PostgreSQL `17.10-alpine3.24` at multi-platform digest `sha256:742f40ea20b9ff2ff31db5458d127452988a2164df9e17441e191f3b72252193` provides the database required by LiteLLM virtual keys and runs as `70:70`.

The release gate verifies the LiteLLM upstream with Cosign and the public key pinned to immutable upstream commit `0112e53046018d726492c814b3644b7d376029d0`. The derivative itself is not described as vendor-signed; its Dockerfile, wheel hash, upstream digest, exact built content ID, SBOM, package floors, and vulnerability scan are the recorded evidence. The pre-release base is a deliberate short-term security tradeoff because no current stable/non-root upstream image meets all required package floors; return to a stable signed tag as soon as one does.

The choice is based on these public, documented interfaces:

- [virtual keys](https://docs.litellm.ai/docs/proxy/virtual_keys) provide model and budget restrictions behind an administrator master key;
- [`/v1/model/info`](https://docs.litellm.ai/docs/proxy/model_management) provides a sanitized model catalog;
- the OpenAI-compatible chat-completions endpoint provides provider-neutral invocation;
- [fallback and reliability controls](https://docs.litellm.ai/docs/proxy/reliability) establish that routing failures are explicit policy concerns.

The repository owns an independently authored `ModelGateway` interface. It does not expose LiteLLM response types to the workbench domain. The checked-in registry owns routing order, task/stage restrictions, token/cost/latency limits, and the independent-review requirement. LiteLLM receives only the allowed aliases and credential budget. Internal gateway retries are disabled so the local runner, trace, and evidence retain one observable attempt for each policy decision.

The default `offline` profile uses a deterministic in-memory adapter and makes no network call. The `live` profile is available only through an explicit CLI flag/command. It accepts only an HTTP loopback URL and reads the administrator credential from `LITELLM_MASTER_KEY_FILE`; an OS-secret-manager-injected process value is supported as an alternative, and ambiguous dual configuration is rejected. Compose mounts database, administrator, salt, and provider credentials as secret files and expands them only inside the LiteLLM process. The static browser build imports only a sanitized generated status record and has no gateway client, secret form, or credential-bearing configuration.

Both credential-bearing services run with explicit non-root UID/GID, every capability dropped, `no-new-privileges`, and a read-only root filesystem. LiteLLM can write only to bounded `/tmp`; PostgreSQL can write only to bounded tmpfs paths and its database volume. The container-policy gate inventories credential-bearing services and fails if any service lacks these exact reviewed controls or gains an unreviewed writable mount.

## Scoped credential lifecycle

For each run, the trusted local runner:

1. derives a deterministic alias from project ID, agent ID, and run ID;
2. checks the gitignored lease store for the same alias and blocks that prior key before replacement;
3. requests a virtual key restricted to the policy's model aliases, cost budget, and lifetime;
4. stores the raw key only in `.workbench/model-gateway/leases/` with owner-oriented file permissions where supported;
5. passes only an opaque lease handle through the provider-neutral contract;
6. blocks the key in `finally` and deletes the local lease file; and
7. retains a failed cleanup file so the explicit cleanup command can retry.

Evidence, traces, UI, and normal logs may contain the deterministic alias but never the raw virtual key, master key, provider key, prompt, or response body.

LiteLLM spend logs retain accounting metadata but do not store prompt or response content. The maximum retention period is seven days and the cleanup interval is one day. The disabled Admin UI prevents local operators from casually overriding those repository-owned defaults through a browser.

## Catalog, accounting, and evidence

Catalog retrieval occurs only in the live local profile. The adapter retains model alias, provider identifier, available context limits, available per-token pricing, and retrieval time. It drops endpoint and credential fields. A validated live evidence pack may drive a checked-in sanitized public snapshot.

Provider-returned token usage and the LiteLLM response-cost header are labeled `ACTUAL_PROVIDER_REPORTED`. If those fields are absent, token counts and catalog-derived cost are labeled `ESTIMATED`. A deterministic no-provider path never creates a live-validation claim.

The live runner emits real OpenTelemetry spans under `delivery.run → delivery.stage → agent.invoke → model.call`, followed by `evidence.finalize` only after credential revocation. Custom safe attributes remain in the documented `delivery.*` namespace. Model-call evidence records IDs, latency, usage basis, cost basis, fallback attempt, and an output digest—not prompt or response content.

## Consequences

- Local Docker and the existing deterministic sandbox remain the default and do not require a model provider.
- The live profile requires PostgreSQL because virtual-key lifecycle is durable gateway state.
- The gateway must have outbound provider access; it does not inherit the sandbox's network-disabled guarantee. Provider transmission and retention follow the configured upstream provider's terms.
- An operating-system owner or Docker administrator can read materialized secret files or container process memory. This is a local developer control demonstration, not a hostile-host secret boundary.
- A hard crash can occur after key creation but before lease persistence. Short credential lifetime, alias reconciliation, gateway-side budget, and administrator cleanup reduce but do not eliminate that window.
- A configured review model is not evidence of independent review. It is labeled configured but not exercised unless the trace contains the distinct invocation.

## Alternatives considered

1. Build a custom OpenAI-compatible proxy and key database: rejected because it creates unnecessary authentication, routing, and administrative API risk.
2. Call provider SDKs directly from each agent: rejected because it distributes master credentials and makes provider policy difficult to reconcile.
3. Add a browser gateway client: rejected because the public site is static, anonymous, and must contain no provider credential.
4. Require LiteLLM for every sandbox run: rejected because it would remove the offline, deterministic default and couple control evidence to model quality and availability.

## Validation state

No `LITELLM_MASTER_KEY` or upstream provider credential was available for this revision. The correct public label is `gateway implemented; live provider path not validated`. Fake/contract tests exercise vending, reconciliation, fallback, budgets, evidence redaction, revocation, and interrupted cleanup. The label may become `validated local gateway integration` only after the opt-in live test and evidence validation succeed.
