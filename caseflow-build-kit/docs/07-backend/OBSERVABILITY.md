# Observability Model

## Trace hierarchy

- investigation run
  - identity resolution
  - source query spans
  - policy retrieval
  - completeness/conflict evaluation
  - policy decision
  - optional explanation generation
  - proposal creation
- execution run
  - approval validation
  - idempotency reservation
  - finance action
  - CRM action
  - response drafting
  - handoff generation

## Span attributes safe for public evidence

- synthetic case/run ID;
- adapter/source alias;
- query template/tool name;
- row count;
- elapsed milliseconds;
- retry count;
- result category;
- schema and output digest;
- claim/evidence state.

## Metrics

- tool/query calls per case;
- evidence collection latency;
- evidence completeness;
- conflict/escalation count;
- proposal disposition;
- approval wait time in replay;
- action success/partial-failure count;
- idempotency replay count;
- unsupported-claim count;
- handoff checklist completion.

Public traces are synthetic or sanitized recorded evidence, never raw OpenTelemetry exports from private systems.
