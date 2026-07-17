# ADR: use a local LiteLLM gateway for the optional provider path

- Status: Accepted
- Date: 2026-07-17
- Scope: developer-invoked local model routing only

## Context

The workbench already has a versioned model-policy contract, explicit execution budgets, and OpenTelemetry-compatible local evidence. It needs one optional path that can exercise real provider-neutral routing without adding a backend to the public site, placing a provider master key in an agent process, or making the deterministic sandbox depend on model availability.

The required control is broader than an OpenAI-compatible completion endpoint. A run needs an allow-listed model catalog, a short-lived per-agent/per-run credential, a cost ceiling, explicit fallback order, revocation, cleanup after interruption, and sanitized evidence. Building those administrator functions as an original proxy would add security-sensitive surface unrelated to the case study's delivery-governance thesis.

## Decision

Use [LiteLLM Proxy](https://docs.litellm.ai/docs/simple_proxy) as an optional loopback-only local gateway. The implementation is pinned to LiteLLM `1.92.0` and the multi-platform image digest `sha256:64d3547e0b131bf4638342e52c12bc46d6f1d9b8498e4b731ff31be5ab316ea9`. A digest-pinned PostgreSQL 17.6 container provides the database required by LiteLLM virtual keys.

The choice is based on these public, documented interfaces:

- [virtual keys](https://docs.litellm.ai/docs/proxy/virtual_keys) provide model and budget restrictions behind an administrator master key;
- [`/v1/model/info`](https://docs.litellm.ai/docs/proxy/model_management) provides a sanitized model catalog;
- the OpenAI-compatible chat-completions endpoint provides provider-neutral invocation;
- [fallback and reliability controls](https://docs.litellm.ai/docs/proxy/reliability) establish that routing failures are explicit policy concerns.

The repository owns an independently authored `ModelGateway` interface. It does not expose LiteLLM response types to the workbench domain. The checked-in registry owns routing order, task/stage restrictions, token/cost/latency limits, and the independent-review requirement. LiteLLM receives only the allowed aliases and credential budget. Internal gateway retries are disabled so the local runner, trace, and evidence retain one observable attempt for each policy decision.

The default `offline` profile uses a deterministic in-memory adapter and makes no network call. The `live` profile is available only through an explicit CLI flag/command. It accepts only an HTTP loopback URL and reads `LITELLM_MASTER_KEY` from the local process environment. The static browser build imports only a sanitized generated status record and has no gateway client, secret form, or credential-bearing configuration.

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

## Catalog, accounting, and evidence

Catalog retrieval occurs only in the live local profile. The adapter retains model alias, provider identifier, available context limits, available per-token pricing, and retrieval time. It drops endpoint and credential fields. A validated live evidence pack may drive a checked-in sanitized public snapshot.

Provider-returned token usage and the LiteLLM response-cost header are labeled `ACTUAL_PROVIDER_REPORTED`. If those fields are absent, token counts and catalog-derived cost are labeled `ESTIMATED`. A deterministic no-provider path never creates a live-validation claim.

The live runner emits real OpenTelemetry spans under `delivery.run → delivery.stage → agent.invoke → model.call`, followed by `evidence.finalize` only after credential revocation. Custom safe attributes remain in the documented `delivery.*` namespace. Model-call evidence records IDs, latency, usage basis, cost basis, fallback attempt, and an output digest—not prompt or response content.

## Consequences

- Local Docker and the existing deterministic sandbox remain the default and do not require a model provider.
- The live profile requires PostgreSQL because virtual-key lifecycle is durable gateway state.
- The gateway must have outbound provider access; it does not inherit the sandbox's network-disabled guarantee. Provider transmission and retention follow the configured upstream provider's terms.
- An operating-system owner can read process environment or gitignored state. This is a local developer control demonstration, not a hostile-host secret boundary.
- A hard crash can occur after key creation but before lease persistence. Short credential lifetime, alias reconciliation, gateway-side budget, and administrator cleanup reduce but do not eliminate that window.
- A configured review model is not evidence of independent review. It is labeled configured but not exercised unless the trace contains the distinct invocation.

## Alternatives considered

1. Build a custom OpenAI-compatible proxy and key database: rejected because it creates unnecessary authentication, routing, and administrative API risk.
2. Call provider SDKs directly from each agent: rejected because it distributes master credentials and makes provider policy difficult to reconcile.
3. Add a browser gateway client: rejected because the public site is static, anonymous, and must contain no provider credential.
4. Require LiteLLM for every sandbox run: rejected because it would remove the offline, deterministic default and couple control evidence to model quality and availability.

## Validation state

No `LITELLM_MASTER_KEY` or upstream provider credential was available for this revision. The correct public label is `gateway implemented; live provider path not validated`. Fake/contract tests exercise vending, reconciliation, fallback, budgets, evidence redaction, revocation, and interrupted cleanup. The label may become `validated local gateway integration` only after the opt-in live test and evidence validation succeed.
