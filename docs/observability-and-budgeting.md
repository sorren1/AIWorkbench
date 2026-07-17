# Observability and execution budgeting

## Scope and claim boundary

The explicitly invoked local sandbox runner now emits one OpenTelemetry-compatible trace for each complete run. The trace is created with the official OpenTelemetry JavaScript API and tracing SDK, normalized into local JSON, and written beside sandbox evidence. No hosted collector, telemetry account, browser beacon, or live observability backend is required.

The checked-in public trace is recorded evidence from the repository-owned synthetic toy repository. The website validates and bundles that file at build time. Opening `/demo/?screen=trace` never starts a sandbox or connects to telemetry infrastructure.

## Trace hierarchy

The real controller produces this hierarchy:

```text
delivery.run
  delivery.stage
    agent.invoke
    tool.call
      sandbox.execute
        validation.command
    approval.wait
    tool.call
    tool.call
      sandbox.execute
        validation.command
    evidence.finalize
```

`model.call` is part of the versioned trace contract but is absent from the deterministic vertical slice because no model is used. The accounting receipt therefore reports exactly zero model calls, tokens, and cost with the `EXACT_ZERO_NO_MODEL` basis.

Every run and stage span identifies the synthetic issue, stage, approved agent version/hash, context-pack digest, approval policy, budget policy, and sandbox provider. Tool spans identify the approved tool version/hash. Validation spans use a safe command category such as `build` or `test`; raw arguments, source, output, and environment values are excluded.

## Local exporter and evidence binding

The implementation uses `@opentelemetry/api` 1.9.1, `@opentelemetry/sdk-trace-base` 2.9.0, `@opentelemetry/resources` 2.9.0, and semantic conventions 1.43.0. `InMemorySpanExporter` and `SimpleSpanProcessor` collect the manually instrumented spans in-process. The controller then writes a deterministic-order, versioned JSON representation containing standard trace/span IDs, parent IDs, timestamps, durations, status, attributes, and events.

Evidence schema v3 binds:

- trace ID;
- trace artifact filename and SHA-256;
- evidence SHA-256;
- source commit and source-tree digest;
- tested synthetic repository-tree digest;
- context-pack digest;
- agent-card, approval-policy, and budget-policy hashes; and
- provider-specific sandbox evidence.

The validator recomputes the trace file hash, validates its hierarchy and schema, and checks every governance/source binding before the `latest` pointer or static site can consume it. The trace does not contain the evidence digest because doing so would create a circular file-hash dependency; the evidence manifest is the authoritative trace-to-evidence binding.

## ExecutionBudget v1

`ExecutionBudget` is a content-hashed, versioned public policy with limits for:

- run wall-clock duration;
- stage duration;
- tool calls;
- repair attempts;
- optional input and output tokens; and
- optional cost.

The policy selects `WARN`, `STOP_STAGE`, or `STOP_RUN`. The tracker evaluates elapsed time before and after bounded operations, checks the next exact tool/repair count before allowing it, and evaluates token/cost receipts at finalization. Reaching the configured maximum is labeled `APPROACHING`; attempting to go beyond it is `EXCEEDED`. The default approaching threshold is 80 percent.

A warning continues and emits `budget.approaching` or `budget.exceeded`. A stop prevents the next operation. If a stop occurs before the full sandbox manifest can be assembled, the controller still finalizes a smaller immutable-style budget-stop evidence file and trace, cleans up in `finally`, and exits non-zero. A late duration stop marks the complete evidence pack failed. Neither kind of failed evidence can replace the latest successful public pointer.

## Provider-neutral accounting

The accounting contract accepts records labeled:

- `ACTUAL_PROVIDER_REPORTED` when a future provider returns exact usage;
- `ESTIMATED` when a named estimation/calculation path is used; or
- `EXACT_ZERO_NO_MODEL` when no model call occurred.

Every nonzero cost record includes a pricing-source ID, version, and optional effective timestamp. Aggregation is conservative: if any record is estimated, the stage and run total remain estimated. This phase adds no model provider or pricing fixture, so the real recorded run contains no calculated or billed-cost claim.

## Data shown in the public waterfall

The Run Trace screen provides a tabular accessible alternative and a decorative duration bar for each span. It exposes hierarchy, status, measured duration, safe attributes, budget use, tool/repair counts, approval wait, exact-zero model accounting, and trace/evidence/tested-tree hashes. Related controls open the equivalent synthetic demo artifacts or Context Manifest.

## References

- [OpenTelemetry JavaScript](https://opentelemetry.io/docs/languages/js/)
- [OpenTelemetry exporters and custom exporters](https://opentelemetry.io/docs/languages/js/exporters/)
- [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/)
- [OpenTelemetry error recording](https://opentelemetry.io/docs/specs/semconv/general/recording-errors/)
