# Evaluation framework

This document defines measurements that can be derived from governed execution evidence. Current checked-in values describe one repository-owned synthetic toy run; they are not production benchmarks, adoption metrics, or professional outcomes.

| Measure            | Definition                                                               | Basis                             | Current evidence source            | Interpretation guardrail                                                                        |
| ------------------ | ------------------------------------------------------------------------ | --------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| End-to-end latency | Duration of `delivery.run`.                                              | Measured wall clock               | Trace root                         | Host- and fixture-specific; not a service SLO.                                                  |
| Stage latency      | Duration of each `delivery.stage`.                                       | Measured wall clock               | Stage span                         | One implement-stage slice only.                                                                 |
| Validation latency | Sum and distribution of `validation.command` durations by safe category. | Measured wall clock               | Command spans and sandbox receipts | Includes runtime startup effects; do not generalize from one run.                               |
| Tool-call success  | Successful `tool.call` spans divided by completed tool-call spans.       | Exact count                       | Trace status                       | Expected pre-patch test failure is not a tool failure.                                          |
| Repair iterations  | Highest `delivery.repair.attempt` and exact budget count.                | Exact count                       | Trace plus budget result           | The deterministic patch is one repair attempt, not autonomous model repair.                     |
| Human wait time    | Sum of `approval.wait` duration.                                         | Measured controller duration      | Approval span/evidence             | Checked-in preapproval produces near-zero wait; it is not a human-response benchmark.           |
| Model tokens       | Provider-returned or estimated input/output usage.                       | Explicit per-record label         | Accounting receipt                 | Zero is exact for no-model runs. Estimates must remain estimated.                               |
| Model cost         | Provider-returned or estimated/calculated cost with pricing metadata.    | Explicit per-record label         | Accounting receipt                 | The deterministic run is exactly $0 because no model runs.                                      |
| Model routing      | Preferred/fallback attempt status and latency by allowed alias.          | Measured duration and exact count | Local gateway trace                | Publish only for an explicitly invoked validated live run; configuration alone is not evidence. |
| Budget pressure    | Observed/limit and `WITHIN`, `APPROACHING`, or `EXCEEDED`.               | Measured/exact by dimension       | Budget result and events           | Maximum is allowed; an attempted value above maximum is exceeded.                               |
| Evidence integrity | Trace/evidence/context/source/tested-tree hash validation result.        | Cryptographic digest verification | Evidence validator                 | Hashes are integrity checks, not signatures or trusted timestamps.                              |

## Evaluation procedure

1. Validate all schemas and hashes with `npm run sandbox:evidence:validate`.
2. Inspect the trace hierarchy for missing parents, error status, budget events, and unexpected model spans.
3. Compare command receipts with validation spans by category, duration, and status.
4. Confirm tool/repair counts match the budget result.
5. Confirm approval wait and outcome match the approval evidence.
6. Confirm token/cost totals reproduce from their records and retain the most conservative measurement label.
7. Record environment and fixture changes before comparing runs.

Future evaluation may aggregate repeated runs by provider and environment, but publication must report sample count, distribution, runtime version, resource settings, and failure criteria. A single successful portfolio run must never be presented as throughput, reliability, or cost-performance evidence.
