# ADR: Public clean-room scope

- Status: Accepted
- Date: 2026-07-17
- Decision owners: repository maintainers

## Context

The project is informed by general software-delivery, agent-governance, observability, and security ideas, while its public value depends on being independently inspectable and free of employer/client material. A disclosure alone is insufficient unless fixtures, language, claims, generated output, and contribution practice share the same boundary.

## Decision

Treat every first-party source file, schema, fixture, workflow, UI element, prompt-like string, diagram, test, and document as an independent implementation for this repository. Permit public standards and public project documentation only as high-level influences, recorded in `docs/design-influences.md`. Do not copy project-specific code, components, copy, schemas, screenshots, visual assets, or internal-looking terminology.

Classify public claims as functional repository behavior, synthetic demo fixture, measured/estimated repository evidence, or the single approved professional-context statement. Never use prototype fixtures as professional outcomes. Keep private publication/employment review under the ignored `private/` boundary.

Preserve the original prototype through Git tag `original-prototype-v0.9.0`; do not retain generated legacy exports as backup implementations on the active branch.

## Consequences

- Contributors must update provenance and semantic-distance records when introducing material terminology or public inspiration.
- Generated build/evidence metadata receives the same disclosure and secret review as authored source.
- The repository cannot claim compatibility, adoption, production use, or derivation that its evidence does not prove.
- Publication still requires the owner’s legal/contractual review; this ADR is an engineering boundary, not legal advice.

## Alternatives considered

- **Retain internal-looking realism with a disclaimer:** rejected because semantic similarity and ambiguous provenance undermine a public clean-room claim.
- **Remove all technical specificity:** rejected because independently authored vendor-neutral adapter examples can remain credible without exposing non-public design.
- **Keep generated originals as hidden backups:** rejected because the preservation tag is sufficient and duplicate implementations create maintenance and review risk.
