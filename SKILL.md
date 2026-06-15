---
name: cleanroom-design
description: Use this skill to generate well-branded interfaces and assets for the Cleanroom design system and the AI Delivery Workbench (a governed AI-assisted SDLC prototype), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and reusable UI patterns for prototyping.
user-invocable: true
---

Read the `readme.md` file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create
static HTML files for the user to view. If working on production code, you can copy assets and read
the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or
design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production
code, depending on the need.

## Quick reference

- **Global CSS:** link `styles.css` (it `@import`s every token file). Tokens cover color (light +
  dark via `[data-theme="dark"]`), type, spacing, radius, motion.
- **Color:** cool slate neutrals + one azure accent (`--accent`). Status color is meaningful only
  (`--safe` verified, `--warn` caution, `--danger` denied, `--secure` encrypted). No gradients.
- **Type:** Hanken Grotesk (UI/body) + JetBrains Mono (data, labels, code). Tabular numerals.
- **Shape:** restrained radii (7px controls, 10px cards), crisp hairlines, low-spread cool shadows.
- **Voice:** calm, precise, system-voice; sentence case; uppercase mono eyebrows; no emoji.
- **Icons:** in-house stroke set in `workbench/icons.jsx` (24-grid, 1.75 stroke, round caps).
- **Reference implementation:** `workbench/` is a full, component-structured, clickable prototype
  (sidebar shell, tables, badges, timeline, split-pane artifact viewer, drawers, modals, toasts)
  built entirely on these tokens — read it to see the patterns in use.

## Clean-room rule

All example content is synthetic and inspired only by public-domain enterprise finance-software
themes. Do not introduce real company branding, code, data, schemas, repository names, or customer
names.
