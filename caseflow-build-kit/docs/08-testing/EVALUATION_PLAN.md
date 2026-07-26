# Evaluation Plan

## Deterministic evaluations

For every gold case:

- expected workflow state;
- expected disposition and amount;
- expected approval class;
- required and prohibited actions;
- required evidence IDs;
- expected failure/escalation category;
- customer-response claims.

## Explanation evaluation

The draft explanation is decomposed into atomic claims. Every claim must map to an evidence fact or policy rule. Unmapped claims fail the evaluation.

## Optional LLM evaluation

A model may propose wording, but the release gate does not rely solely on “LLM as judge.” Deterministic claim-to-evidence mapping is authoritative. If an LLM evaluator is used, record provider/model, prompt digest, output, and disagreement with deterministic checks.

## Reusability evaluation

Track:

- percentage of implementation that is customer-specific mapping/policy versus reusable workflow;
- time/steps required to add a new source alias;
- number of source-specific branches outside adapters;
- number of runbook items requiring the original author.
