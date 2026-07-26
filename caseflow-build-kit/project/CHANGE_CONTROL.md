# Change Control

## Change classes

- **Class A — Contract change:** domain rules, source authority, state transitions, public claims, security boundary, route contract. Requires a decision-log entry and affected tests before merge.
- **Class B — Presentation change:** layout, copy hierarchy, tour order, non-semantic styling. Requires design review and visual/accessibility checks.
- **Class C — Implementation refinement:** internal refactor with unchanged contracts. Requires normal tests and completion report.
- **Class D — Interview feedback:** new observation from an interviewer. Record first in the feedback log; classify before implementation. Do not edit the product live between rounds without regression gates.

## Freeze points

- After T16: domain and evidence contracts freeze unless a defect is found.
- After T21: presentation narrative freezes except rehearsal-driven clarity fixes.
- After T27: deployment freeze; only critical fixes with a new release binding.
