# 08 — Claude Design Visual System

**Executor:** Claude Design
**Task ID:** `T08`
**Execution rule:** Run only after all prerequisites are marked `COMPLETE` or `COMPLETE_WITH_LIMITATION` in `caseflow-build-kit/project/status.json`.

## Prerequisites
- T02 COMPLETE.

## Read first
- `caseflow-build-kit/CLAUDE.md`
- `caseflow-build-kit/docs/06-frontend/UX_BRIEF.md`
- `caseflow-build-kit/docs/06-frontend/INFORMATION_ARCHITECTURE.md`
- `caseflow-build-kit/docs/06-frontend/DESIGN_SYSTEM.md`
- `caseflow-build-kit/docs/06-frontend/ACCESSIBILITY.md`
- `caseflow-build-kit/reference/COPYRIGHT_AND_TRADEMARKS.md`
- `caseflow-build-kit/deliverables/architecture-reconciliation.md`

## Objective
Produce an original, implementation-ready visual language for CaseFlow that communicates evidence and authority under interview time constraints.

## Instructions
1. Define design principles, information density, typography, spacing, status semantics, surfaces, borders, and local SVG icon approach.
2. Create a complete token file in JSON using `cf` names and no hard dependency on CData branding.
3. Specify every required component from `DESIGN_SYSTEM.md`, including all states, keyboard behavior, responsive behavior, and acceptance criteria.
4. Design the persistent shell, case reset, claim/mode badges, tour controller, evidence rows, policy decision, approval, action receipts, failure classification, handoff, and reuse matrix.
5. Provide desktop, tablet, mobile, high-zoom, reduced-motion, loading, error, empty, conflict, and focus-state guidance.
6. Where static mockups are produced, place them under the designated prototypes path and ensure no external asset dependency.

## Non-negotiable constraints
- Follow `caseflow-build-kit/CLAUDE.md`.
- Do not change architecture, case facts, route names, claim taxonomy, or security boundaries.
- Do not use CData logos, copied product screenshots, stock images, remote fonts, or decorative AI clichés.
- Do not write production code in this task.

## Required outputs
- `caseflow-build-kit/deliverables/design/design-principles.md`
- `caseflow-build-kit/deliverables/design/tokens.json`
- `caseflow-build-kit/deliverables/design/component-specs.md`
- `caseflow-build-kit/deliverables/design/responsive-and-accessibility.md`
- Optional prototypes under `caseflow-build-kit/deliverables/design/prototypes/`

## Acceptance gate
- [ ] Token JSON is complete and implementable.
- [ ] Every component has state/interaction/accessibility guidance.
- [ ] Visual direction is original and not a CData imitation.
- [ ] The result supports Teams screen sharing and direct deep links.

## Completion protocol
1. Run the task-specific checks and the broadest affordable existing repository gate.
2. Update `caseflow-build-kit/project/status.json` for this task, including evidence paths, limitations, and the exact commands run.
3. Run `python caseflow-build-kit/tools/render_status.py`.
4. Append any architectural decision to `caseflow-build-kit/project/DECISION_LOG.md` and any new risk to `caseflow-build-kit/project/RISK_REGISTER.md`.
5. Write `caseflow-build-kit/deliverables/completion-reports/T08.md` using `caseflow-build-kit/templates/CODEX_COMPLETION_REPORT.md` or the appropriate design/human template.
6. Stop. Do not begin the next numbered prompt in the same session unless the user explicitly requests it.
