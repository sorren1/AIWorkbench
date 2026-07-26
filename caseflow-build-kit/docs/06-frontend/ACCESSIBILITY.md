# Accessibility Requirements

- Semantic landmarks: header, nav, main, complementary, footer.
- One H1 per route and ordered headings.
- Skip link to main content.
- Visible keyboard focus at 3:1 contrast against adjacent colors.
- All tour controls reachable and operable without pointer.
- Escape closes transient dialogs/panels and returns focus.
- Status changes use `aria-live` only when necessary; replay should not create excessive announcements.
- Diagrams have text summaries and data tables where relevant.
- Tables use scope headers; complex tables include captions.
- Code/query blocks have accessible copy controls and horizontal scroll.
- Minimum target size 24×24 CSS pixels; prefer 44×44 for primary controls.
- Zoom to 200% without loss of function.
- 320px reflow without two-dimensional scrolling except data tables/code.
- Reduced-motion behavior tested.
- Automated axe plus manual keyboard and screen-reader spot checks.
