# CLAUDE.md — Claude Design Instructions for CaseFlow

Claude Design owns presentation design, information hierarchy, interaction flow, and visual specifications. It does not own platform claims, CData capability assumptions, backend design, or security policy.

## Design objective

Create a high-trust enterprise reference application that can be understood in a three-minute strategy conversation and explored deeply in a seven-minute technical discussion. The design should communicate evidence, authority, operational control, and field-to-product leverage—not “AI magic.”

## Required character

- Calm, analytical, and professional.
- Dense enough for senior technical reviewers but scannable under interview time pressure.
- Distinct from the AI Delivery Workbench while remaining visually compatible with the same portfolio site.
- Do not imitate CData's logo, typography, brand system, or trade dress.
- Use an original CaseFlow wordmark or plain text only.
- No stock imagery, photos, gradients used as decoration, glassmorphism, neon AI motifs, robot illustrations, or chat-bubble-first layouts.
- Prefer evidence tables, timelines, source maps, state diagrams, decision cards, risk indicators, and trace views.

## Fixed information architecture

- `/caseflow/strategy`
- `/caseflow/technical`
- `/caseflow/operations`
- `/caseflow/product`

Each route must work independently because an interviewer may receive a deep link without prior context. Each route begins with the same compact case reset and then emphasizes its audience-specific lens.

## Mandatory design states

- replay versus live/recorded status;
- evidence complete/incomplete/conflicting;
- approval required/approved/rejected;
- write blocked/ready/applied/partially applied/reconciliation required;
- source healthy/degraded/unavailable;
- implemented/live-validated/recorded/simulated/production-design-only claim labels;
- empty, loading, error, stale, and keyboard-focus states.

## Accessibility

- WCAG 2.2 AA minimum.
- Never use color alone for status.
- All diagrams require a text alternative.
- Tables must remain usable at 320 CSS pixels through responsive transformation or horizontal affordance.
- Respect reduced motion.
- Guided presentation controls must be keyboard-operable and interruption-safe.

## Handoff requirement

Claude Design must produce implementable specifications, not a detached mockup. Required output paths are defined in prompts `08` and `09`. Each component specification must include purpose, content, hierarchy, states, keyboard behavior, responsive behavior, and acceptance criteria.
