# ADR: OpenTelemetry-compatible local trace contract

- Status: Accepted
- Date: 2026-07-17
- Decision owners: public prototype maintainers

## Context

The sandbox evidence recorded command receipts and durations but did not expose causal hierarchy, approval wait, repair/tool counts, budget state, or a single trace/evidence binding. A hosted telemetry product would add credentials and infrastructure that are unnecessary for a static public demonstration.

## Decision

Use the pinned official OpenTelemetry JavaScript API and trace SDK for real span creation. Export a repository-owned normalized JSON artifact rather than configuring a network exporter. Preserve OpenTelemetry trace/span IDs, parentage, timestamps, duration, status, attributes, and events so the artifact can be mapped into a collector later without making OTLP-wire-format claims now.

Use stable semantic conventions for `service.name`, `service.version`, and `error.type`. The VCS revision convention is currently experimental, so the prototype retains source revision under the documented custom namespace instead of claiming stable conformance.

The following custom attributes are version 1 of the `delivery.*` namespace:

| Group         | Attributes                                                                                                                 | Meaning                                                   |
| ------------- | -------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Identity      | `delivery.run.id`, `delivery.issue.id`, `delivery.stage`                                                                   | Synthetic workflow identity.                              |
| Agent         | `delivery.agent.id`, `.version`, `.hash`                                                                                   | Exact approved AgentCard reference.                       |
| Tool          | `delivery.tool.id`, `.version`, `.hash`, `.call_number`, `.call_count`                                                     | Exact approved tool and invocation counts.                |
| Model         | `delivery.model.policy.id`, `.used`, `.call_count`, `.input_tokens`, `.output_tokens`, `.cost_usd`, `.accounting_basis`    | Aggregate model policy and usage; bodies are forbidden.   |
| Context       | `delivery.context.pack_digest`                                                                                             | Canonical governed context binding.                       |
| Approval      | `delivery.approval.request_id`, `.outcome`, `.policy.id`, `.policy.hash`                                                   | Checked-in approval-fixture binding and result.           |
| Budget        | `delivery.budget.policy.id`, `.policy.version`, `.policy.hash`, `.dimension`, `.observed`, `.limit`, `.action`, `.outcome` | Policy identity, safe threshold events, and final result. |
| Sandbox       | `delivery.sandbox.provider`, `.phase`                                                                                      | Runtime provider and before/after phase.                  |
| Validation    | `delivery.command.category`, `delivery.validation.status`, `.command_count`, `delivery.test.count`                         | Safe command category and result counts.                  |
| Change/repair | `delivery.changed_file_count`, `delivery.repair.attempt`, `.attempt_count`, `delivery.artifact.count`                      | Exact bounded activity counts.                            |
| Timing/result | `delivery.duration_ms`, `delivery.outcome`                                                                                 | Measured duration and public outcome category.            |
| Source        | `delivery.source.commit`, `.tree_digest`                                                                                   | Git revision and exact inspected source-tree digest.      |

Custom event names are `budget.approaching`, `budget.exceeded`, and `operation.failed`. Span names are `delivery.run`, `delivery.stage`, `agent.invoke`, `model.call`, `tool.call`, `approval.wait`, `sandbox.execute`, `validation.command`, and `evidence.finalize`. `model.call` is emitted only when a real model is invoked.

## Consequences

- Local development and the static website require no telemetry service.
- Evidence schema v3 validates and binds the separate trace artifact.
- The public waterfall is an accessible view over the same checked-in JSON.
- The trace contract intentionally excludes prompt/source/output capture and automatic broad instrumentation.
- A future OTLP exporter can translate the in-memory spans, but this release does not claim collector interoperability testing or hosted observability operations.
