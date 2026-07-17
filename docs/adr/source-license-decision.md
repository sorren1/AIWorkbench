# ADR: Withhold a first-party reuse license until owner intent is explicit

- Status: Accepted for this revision
- Date: 2026-07-17
- Decision owners: repository maintainers

## Context

A public repository does not automatically grant permission to copy, modify, or redistribute first-party source. Selecting MIT, Apache-2.0, or another permissive license is an owner policy decision with legal and contribution consequences. The current task authorizes documenting a decision but does not state the owner’s intended reuse terms.

## Decision

Do not add a permissive source-code license in this revision. State clearly in the README and third-party notices that no reuse license has been granted for first-party project code. Third-party packages, images, and tools remain under their respective upstream licenses and are inventoried separately.

Revisit only after the owner explicitly chooses a license and confirms contributor, invention-assignment, outside-work, and publication implications. That future change must update this ADR, add the exact license text, define contribution terms, re-run license/security checks, and appear in the changelog.

## Consequences

- Source is publicly inspectable but reuse rights are not granted by this repository.
- Contributors must not assume their patches make the project permissively licensed.
- Package metadata remains `private: true` and no npm publication is intended.
- The decision is conservative and may reduce reuse until the owner acts deliberately.

## Alternatives considered

- **MIT:** simple and conventional, but not selected without explicit owner intent.
- **Apache-2.0:** includes an express patent grant, which makes owner intent even more important.
- **All-rights-reserved license file:** unnecessary; the explicit ADR/README notice communicates the current no-grant decision without inventing owner identity or terms.
