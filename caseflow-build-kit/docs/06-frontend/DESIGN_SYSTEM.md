# CaseFlow Design System Requirements

Claude Design will produce the final system in T08. The following constraints are fixed.

## Visual semantics

- Neutral high-contrast background and restrained accent colors.
- A distinct accent for evidence, authority, success, warning, failure, and recorded/simulated claims.
- Status always uses icon + text + shape, not color alone.
- Original local SVG icon set; no icon CDN.
- System/local fonts only unless a font is already safely bundled in the host repo.
- All CSS variables use the `--cf-` prefix.
- All component class names begin `cf-` or are CSS-module scoped.

## Density

- Base reading width: 72–90 characters.
- Desktop reference: 1440 × 900 and 1280 × 720.
- Technical tables may be dense but must preserve row/column headers and responsive access.
- Presenter view emphasizes one decision at a time.

## Required components

- `ClaimBadge`
- `ModeBadge`
- `SourceHealthCard`
- `EvidenceFactRow`
- `ConflictBanner`
- `PolicyDecisionCard`
- `ApprovalRecordCard`
- `ActionReceiptCard`
- `WorkflowTimeline`
- `FailureClassificationPanel`
- `HandoffChecklist`
- `ReuseMatrix`
- `TourController`
- `DisclosurePanel`

## Motion

- Optional 120–180ms transitions for focus and panel reveal.
- No auto-playing animation.
- Reduced-motion mode removes transitions and scrolling effects.
