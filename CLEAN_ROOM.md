# Clean-room boundary

## Public disclosure

Independent portfolio prototype. All code, copy, fixtures, workflows, and visuals in this project were created from scratch using synthetic data. No employer or client code, prompts, schemas, screenshots, repositories, internal documentation, or confidential information were used. External Jira, GitHub, AI, database, and MCP-style operations are simulated; the interactive UI and local workflow state machine are functional.

## Independent-development rules

- Use only public standards and public project documentation for high-level patterns and interoperability constraints.
- Record material public influences in [docs/design-influences.md](docs/design-influences.md).
- Independently design domain types, UI, copy, fixtures, tests, schemas, and diagrams for this repository.
- Do not copy source code, components, product copy, screenshots, schemas, visual assets, prompts, internal vocabulary, customer data, or non-public identifiers.
- Keep every checked-in issue, persona, repository, branch, pull request, log, metric, and external result synthetic unless it is explicitly labeled measured repository evidence.
- Keep credentials, employment documents, agreements, publication notes, and private review materials outside the tracked tree. `private/` is ignored except for its notice.
- Review both authored and generated files before publication.

The original clean-room prototype is preserved by Git tag `original-prototype-v0.9.0`. Generated legacy exports are intentionally absent from the active branch because the tag is the historical reference; they are not maintained as backup implementations.

## Claim boundary

Public statements use exactly three categories:

- **Functional in this repository:** locally inspectable UI, state, generators, tests, CLIs, and validated evidence.
- **Synthetic demo fixture:** illustrative values and simulated external operations.
- **Professional context:** only the approved statement below, kept separate from prototype evidence.

In professional work, I built a related governed AI-assisted delivery platform that supported approximately 50 production stories through human-reviewed pull requests. This public prototype is a separate implementation and contains none of that system’s code or data.

No production result, user, adoption, revenue, award, benchmark, or external-system capability is attributed to this prototype.

## Public influences and semantic distance

Publicly documented ideas may inform a high-level problem decomposition without importing an implementation. [docs/design-influences.md](docs/design-influences.md) records the source consulted, concept considered, independent implementation, deliberate exclusions, and no-copy confirmation. [docs/semantic-distance-review.md](docs/semantic-distance-review.md) records tracked-tree search categories and outcomes without naming private organizations or materials.

Contributors must update those records when a new material influence or terminology review is needed. The decision is formalized in [ADR: public clean-room scope](docs/adr/public-clean-room-scope.md) and [ADR: public inspiration and independent implementation](docs/adr/public-inspiration-and-independent-implementation.md).

## Publication review

Before publication, the owner should complete the ignored `private/publication-review-checklist.md`, rerun the semantic-distance and secret checks, inspect generated metadata/build output, verify every metric category, and review applicable confidentiality, invention-assignment, outside-work, and publication obligations. This is an engineering provenance boundary, not legal advice.

The detailed contribution principles remain in [docs/clean-room-and-provenance.md](docs/clean-room-and-provenance.md).
