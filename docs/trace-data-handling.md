# Trace data handling

## Classification

Checked-in traces are `RECORDED_SYNTHETIC_PUBLIC_TRACE_EVIDENCE`. They describe only developer-invoked execution of repository-owned public synthetic fixtures. They are suitable for source control and the public static site after schema/hash validation.

## Allowed data

Trace attributes may contain only bounded operational metadata:

- synthetic run and issue IDs;
- stage and operation category;
- approved agent, tool, model-policy, approval-policy, and budget-policy IDs, versions, and SHA-256 hashes;
- context-pack and source-tree digests;
- sandbox provider and phase;
- safe command category, never raw command arguments;
- changed-file, test, model-call, tool-call, and repair counts;
- measured durations and outcomes;
- aggregate token/cost values with an explicit measurement basis; and
- approval request ID and outcome for the checked-in synthetic fixture.

## Prohibited data

Do not place any of the following in spans, events, trace resources, status descriptions, or exporter diagnostics:

- prompts, arbitrary user history, or model response bodies;
- LiteLLM master keys, upstream provider credentials, scoped virtual-key values, authorization headers, or raw gateway response headers;
- source code, unified diffs, file bodies, tool arguments, stdout, or stderr;
- API keys, access tokens, cookies, authorization headers, credentials, environment values, or private endpoints;
- personal data or private organization content; or
- exception stacks or unreviewed exception messages.

The trace wrapper accepts only `delivery.*` and stable `error.type` attributes. It drops unknown namespaces, bounds string/array size, and replaces multiline or credential-shaped values with `[REDACTED]`. Error status descriptions are fixed public text and `error.type` uses repository-defined categories.

## Storage and transport

The local runner holds finished spans in memory only long enough to normalize them. It writes JSON under `evidence/generated/` and does not configure OTLP, HTTP, gRPC, a collector, browser telemetry, or a hosted service. Vite reads the latest validated file during build and embeds the public screen data into static assets.

The trace artifact is immutable-style: a run-specific filename is created exclusively. The successful evidence index contains the trace filename, trace ID, and trace file SHA-256. Failed and budget-stopped traces never update the successful pointer.

## Integrity and review

Before publication:

1. validate the trace schema and single-root parent hierarchy;
2. recompute the trace artifact SHA-256;
3. verify trace/evidence run, source, context, agent, approval, and budget bindings;
4. scan the trace for prohibited key/value shapes;
5. confirm model usage and cost labels match the actual execution path; and
6. confirm the public UI describes recorded evidence rather than live telemetry.

Hash binding detects accidental or deliberate file mutation; it is not a signature, trusted timestamp, tamper-resistant store, or non-repudiation mechanism. Production traces would additionally require access control, encryption, regional/retention policy, tenant isolation, sampling governance, secret scanning, and incident-response ownership.
