# Clean-room and provenance

## Purpose

AI Delivery Workbench is an independent portfolio prototype. This document defines the public clean-room boundary, how provenance is recorded, and which claims the repository may make.

## Independent-development boundary

The project’s application code, public copy, domain types, fixtures, workflows, visual system, icons, tests, and documentation were authored specifically for this repository. Synthetic records were invented to exercise delivery-governance concepts without importing an existing backlog, repository model, prompt library, schema, screenshot, workflow definition, or internal vocabulary.

The boundary applies to every contribution:

- use public standards and public project documentation only for high-level concepts and interoperability constraints;
- record a material public influence in `docs/design-influences.md` before implementing it;
- design project domain types, copy, UI, fixtures, and tests independently;
- do not copy third-party source, project-specific schemas, components, screenshots, visual assets, or product copy;
- do not introduce non-public identifiers, private files, confidential material, or credentials;
- keep private publication review notes under the ignored `private/` directory and out of commits.

The original clean-room prototype is preserved by the Git tag `original-prototype-v0.9.0`. Superseded generated exports are intentionally absent from the active branch because the tag provides the historical reference.

## Claims and evidence taxonomy

Every visible claim belongs to exactly one category.

### Functional in this repository

These statements may describe behavior that can be run and inspected locally: the static Vite build, navigation, filters, theme preference, reducer transitions, stale-state propagation, local approval/review state, validation state, and deterministic rendering of artifacts and evidence.

Functional does not mean production-ready. Browser-local state is not shared identity, durable audit storage, authenticated approval, or external execution.

### Synthetic demo fixture

Every persona, issue, repository, branch, pull request, commit, changed file, check, log, duration, test result, cost, count, approval record, and external-system response shown in the workbench is synthetic. Fixture values demonstrate information shape and interaction behavior; they are not measurements of this repository or observations from another system.

Jira, GitHub, AI/model, database, external enterprise MCP, deployment, hosted test-execution, notification, authentication, and external review operations are simulated. UI controls representing those operations change local demo state only. The independently authored repository-owned MCP server is functional only over stdio against a disposable synthetic toy repository; it is never contacted by the public browser and does not imply production MCP-platform readiness.

### Professional context

The approved professional-context statement is kept in a separately labeled section on the public case study and in the README. It is not combined with prototype metrics, feature evidence, or fixture data. No other professional outcome claim is permitted.

## Illustrative reference stack

Jira, GitHub, Angular, .NET, and Oracle are used as one illustrative adapter set because they make cross-stack delivery concerns concrete. The workbench treats them as examples behind vendor-neutral issue, repository, UI, service, and database boundaries. The selection does not describe a required environment or an organization-specific architecture.

## Review and traceability

Before publication, maintainers should:

1. run the tracked-file semantic-distance searches documented in `docs/semantic-distance-review.md`;
2. inspect generated build metadata and dependency metadata for unintended identifiers;
3. confirm every metric has an explicit functional, synthetic, or professional-context basis;
4. verify the concise disclosure remains visible on the public case study and in the demo shell;
5. complete the ignored `private/publication-review-checklist.md` without committing private agreements or review notes.

This document records an engineering boundary, not a legal conclusion. Publication obligations remain the repository owner’s responsibility.
