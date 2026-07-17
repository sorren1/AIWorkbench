# ADR: Use public inspiration through independent clean-room implementation

- Status: Accepted
- Date: 2026-07-16
- Decision owners: repository maintainers

## Context

Public documentation for AWS Labs Loom discusses enterprise-agent concerns that overlap with this portfolio thesis: registry lifecycle, scoped authorization, persona-based tool access, human approval, model routing, usage tracking, and traces. Open standards such as OpenTelemetry, Model Context Protocol, and CycloneDX define useful interoperability concepts.

The repository must remain an original clean-room public project. Loom source code, components, copy, project schemas, screenshots, and AWS-specific product UI must not be copied. Non-public code, prompts, schemas, screenshots, names, repository identifiers, internal terms, and confidential implementation details from another system or organization remain prohibited regardless of whether a public reference is also consulted.

## Decision

Use public documentation only to identify high-level problems and use open standards only at explicit interoperability boundaries. Independently design the workbench domain model, information architecture, UI, copy, fixtures, policy rules, and tests.

Maintain `docs/design-influences.md` as a provenance register. Every material influence records:

1. the public project or standard consulted;
2. the high-level concept considered;
3. what was independently implemented here;
4. what was deliberately not adopted; and
5. confirmation that no source code or UI assets were copied.

### Permitted

- Reading public project README files, public product/engineering blog posts, and official standards documentation.
- Naming a public project as design inspiration with a direct source link and precise boundary statement.
- Reusing standard-defined protocol field names, media types, or wire formats only where required for claimed interoperability.
- Using independently selected, pinned open-source tooling to emit or validate a standard artifact under its license.
- Comparing high-level alternatives such as lifecycle review, least privilege, approval gates, trace spans, and SBOMs.

### Prohibited

- Copying or translating Loom implementation source, components, tests, prompts, copy, schemas, screenshots, icons, layouts, information architecture, or AWS-specific UI.
- Recreating Loom's catalog or cloud deployment topology under different names.
- Importing third-party project schemas into the workbench domain model when no wire-compatibility requirement exists.
- Presenting a public reference as an endorsement, partnership, dependency, or evidence of this prototype's production capability.
- Using confidential or otherwise non-public third-party material as a shortcut, even if similar concepts appear publicly.

### Implementation controls

- Define domain types and UI from the workbench's fixed coding-stage use cases before writing adapters.
- Isolate standards mappings at export/import boundaries so evolving conventions do not own the product model.
- Pin the OpenTelemetry semantic-convention and CycloneDX versions used at implementation time and test deterministic fixtures.
- Prefer links to official specifications over copied explanatory text or schemas.
- Keep external provider and cloud names out of the core runtime policy model; use provider-neutral aliases and adapter identifiers.
- Review diffs for borrowed phrases, identifiers, schema shapes, and visual resemblance before each control-plane implementation commit.
- Update the influence register before merging any materially new public inspiration.

## Consequences

Positive:

- The repository has an auditable provenance story and a clear clean-room boundary.
- Standards compatibility can be upgraded without coupling the workbench domain to one vendor or public project.
- The control-plane design remains visibly anchored in the coding workflow and existing visual identity.

Costs and constraints:

- Some standard mappings require adapter code and versioned tests rather than direct reuse in domain objects.
- Public-reference research and attribution become a maintained project artifact.
- Similar high-level features must still be expressed with original copy, interaction design, and data structures.

## Alternatives considered

1. **Do not consult public work at all** — rejected because official standards and public architecture discussions improve interoperability and make tradeoffs reviewable without compromising originality.
2. **Fork or adapt Loom implementation code** — rejected because it violates the requested clean-room/source boundary and would pull the project toward AWS-specific product scope.
3. **Copy public schemas as the internal model** — rejected because public project schemas are prohibited and standards schemas should remain at narrow wire boundaries.
4. **Mention no influences** — rejected because explicit provenance is more credible and auditable than leaving design inputs implicit.

## Review checklist

Before a control-plane phase commit:

- Does every new feature map to the AI Delivery Workbench coding workflow?
- Is the implementation original in domain structure, copy, UI, and tests?
- Are standard-defined names confined to documented compatibility boundaries?
- Are simulated identity, model, tool, credential, and external-system behaviors labeled adjacent to the interaction?
- Does `docs/design-influences.md` cover every material public influence?
- Does the diff contain any third-party screenshot, icon, copied schema, project copy, or AWS-specific product UI?
- Does the diff contain an organization-specific identifier or confidential material?

If either of the final two checks finds material, stop the phase and remove it before continuing.
