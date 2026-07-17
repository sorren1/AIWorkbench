# ADR: Separate control, execution, context, and validation planes

- Status: Accepted
- Date: 2026-07-17
- Decision owners: repository maintainers

## Context

A coding-agent demonstration becomes difficult to audit when capability selection, context retrieval, side effects, and acceptance decisions are one opaque invocation. The repository needs enough separation to make responsibility and evidence inspectable without introducing distributed services into a static portfolio project.

## Decision

Use four logical planes:

- the **Control Plane** owns workflow, registry, authorization, approval, lifecycle, and budgets;
- the **Context Plane** owns deterministic record selection, provenance, freshness, exclusions, and pack digests;
- the **Execution Plane** owns bounded tool/provider adapters and disposable workspaces;
- the **Validation Plane** owns command/diff evidence, trace normalization, human review state, and readiness guards.

Pass versioned, hash-bound manifests between planes. Discovery and model output are inputs, never authorization. Execution cannot mark its own result approved. Validation evidence must identify the tested tree and the capability/context/policy versions used.

These are module and contract boundaries in the current repository, not separately deployed services.

## Consequences

- Tests can target policy and transition logic without invoking providers.
- The browser can explain architecture truthfully while the website remains static.
- Some records repeat identifiers/hashes across boundaries; this deliberate denormalization makes evidence self-describing.
- A production implementation may deploy planes separately, but network protocols, consistency, and availability are outside this release.

## Alternatives considered

- **Single orchestration service/object:** lower code ceremony but obscures who authorized, selected, executed, and approved an effect.
- **Microservice per agent/stage:** rejected as operational theater for a portfolio prototype and contrary to the static/offline default.
