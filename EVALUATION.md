# Evaluation model

## What can be evaluated

AI Delivery Workbench separates three evidence bases:

1. **Measured in this repository** — values derived from local commands, tests, built assets, the checked-in sandbox evidence, or its bound trace.
2. **Synthetic demo fixture** — illustrative UI data that must never be aggregated into an engineering result.
3. **Proposed production metric** — a defined signal that requires repeated real workloads and operational data not present here.

The latest checked-in sandbox record is one deterministic toy-repository run. It proves that the controller can enforce and record a narrow path; it is not a reliability, productivity, adoption, or model-quality benchmark.

## Signals and evidence status

| Signal                           | Definition                                                                                                                                 | Status in this repository                                                                                                                                       | Evidence / production use                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **First-pass success**           | Runs completing Verify without a repair divided by eligible runs                                                                           | **Proposed production metric.** The toy scenario intentionally starts with a failing test and one deterministic repair, so it is not a first-pass agent sample. | Aggregate by issue class, agent/model/policy version, and environment; publish sample size and confidence interval.       |
| **Tool-call success**            | Successful completed tool calls divided by completed tool calls, excluding intentional domain failures such as the expected pre-patch test | **Measured for the recorded slice** as exact trace counts.                                                                                                      | `tool.call` spans and budget counters; distinguish transport/policy/tool/domain failures.                                 |
| **Repair iterations**            | Count of change/verify repair attempts before terminal outcome                                                                             | **Measured for the recorded slice** as an exact count; the patch is deterministic, not autonomous repair.                                                       | Trace attempt attribute plus execution-budget result.                                                                     |
| **Regression rate**              | Previously passing required checks that fail after an accepted change divided by accepted changes                                          | **Proposed production metric.** One fixed toy change cannot estimate a rate.                                                                                    | Compare immutable pre/post validation suites on the same target revision.                                                 |
| **Human intervention rate**      | Runs requiring at least one human decision divided by eligible runs; track decision type separately                                        | **Proposed production metric.** Demo approvals are synthetic and the recorded preapproval is not organizational response data.                                  | Authenticated approval records, with policy-trigger and disposition dimensions.                                           |
| **Human wait time**              | Wall time between a valid approval request and terminal decision                                                                           | **Measured only as controller time in the recorded slice**, not human responsiveness.                                                                           | `approval.wait` span; production reporting must exclude queue/system delay or report it separately.                       |
| **Changed-file precision**       | Approved changed paths divided by all changed paths, with unexpected changed paths counted as false positives                              | **Measured for the recorded slice** by before/after tree and approved targets.                                                                                  | A value of 1 for one controlled file proves boundary enforcement for this fixture, not model targeting quality.           |
| **Changed-file recall**          | Required changed paths actually changed divided by required changed paths                                                                  | **Proposed production metric.** The fixed patch has one known target and is not a representative requirement set.                                               | Human-labeled expected target set; ambiguous labels need adjudication.                                                    |
| **Validation completeness**      | Required evidence items present, schema-valid, hash-valid, and bound to the tested tree divided by required items                          | **Measured for the recorded pack** by the evidence validator.                                                                                                   | Treat a missing required item as incomplete even if commands passed.                                                      |
| **End-to-end and stage latency** | Wall-clock `delivery.run` and `delivery.stage` duration; validation latency by command category                                            | **Measured for the recorded slice** on one local environment.                                                                                                   | Trace durations with runtime/image/resource versions; not a service SLO.                                                  |
| **Token usage**                  | Provider-returned input/output tokens when available, otherwise a labeled estimate                                                         | **Exact zero for the deterministic recorded run** because no model was invoked.                                                                                 | Never combine `ACTUAL_PROVIDER` and `ESTIMATED` without preserving basis.                                                 |
| **Cost**                         | Provider-returned or calculated cost with pricing source/version                                                                           | **Exact zero model cost for the deterministic run.** Optional live gateway was not exercised.                                                                   | Record currency, pricing version, usage basis, and fallback attempts.                                                     |
| **Budget pressure**              | Observed value divided by limit, with within/approaching/exceeded outcome and configured action                                            | **Measured/exact by dimension** in the recorded budget result.                                                                                                  | Duration is measured; calls/repairs are exact; token/cost basis remains explicit.                                         |
| **Guard false positive**         | Safe, policy-compliant operation incorrectly blocked divided by reviewed safe operations                                                   | **Proposed production metric.** Unit fixtures test known permits but do not estimate field prevalence.                                                          | Maintain adjudicated allow/deny corpus and review policy/model/version changes.                                           |
| **Guard false negative**         | Unsafe or non-compliant operation incorrectly allowed divided by reviewed unsafe operations                                                | **Proposed production metric.** Unit fixtures exercise known denies only.                                                                                       | Include traversal, scope, stale, tampered, approval, and budget adversarial corpora; prioritize severity as well as rate. |
| **Evidence integrity**           | Schema, canonical digest, file/output/tree/context/trace binding validations completed successfully                                        | **Measured for checked-in evidence** by `sandbox:evidence:validate`.                                                                                            | Hash integrity is not identity, signature, or trusted time.                                                               |

## Reproducible repository evaluation

Run:

```bash
npm run sandbox:evidence:validate
npm run test:coverage
npm run test:e2e
npm run performance:budgets
npm run performance:audit
```

For a new real local slice, first run `npm run demo:sandbox`, then validate the emitted pack. Record the source commit and working-tree state, image/tool versions, resource limits, fixture revision, run count, and failure criteria before comparing runs.

Evaluation review should confirm:

1. trace hierarchy and statuses agree with command receipts;
2. tool/repair counts reproduce the budget result;
3. approval wait/outcome agrees with approval evidence;
4. changed files match approved targets and the unified diff;
5. context, agent, policy, trace, tested-tree, and evidence hashes validate;
6. token/cost records retain their exact-versus-estimated basis;
7. browser fixture metrics were not mixed into measured results.

## Production evaluation design

Repeated production evaluation would stratify by task type, repository, risk, agent/model/policy version, and change size. It would publish denominators, distributions rather than only averages, confidence intervals where meaningful, terminal failure categories, and human adjudication guidance. Comparisons require the same workload definition and validation policy; otherwise a lower intervention rate may simply reflect weaker gates.

Optimization must remain multi-objective. Improving first-pass success while increasing changed-file false negatives or reducing validation completeness is not an improvement. Budget compliance is also not quality: a cheap stopped run and a cheap unsafe approval are both failures under different controls.

The detailed trace-derived measurement contract is in [docs/evaluation-framework.md](docs/evaluation-framework.md). Performance baselines and thresholds are in [docs/performance-and-static-hosting.md](docs/performance-and-static-hosting.md).
