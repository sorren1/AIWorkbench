# Cleanroom Design System

A clinical, precise, enterprise design system — and the home of the **AI Delivery Workbench**
clean-room interview prototype.

> **Context.** This project was created to deliver the **AI Delivery Workbench** prototype (see
> `workbench/`). Along the way it establishes a small, reusable visual foundation ("Cleanroom") —
> cool slate neutrals, a single precise azure accent, grotesque sans + monospace — that the
> prototype is built on and that other finance-software surfaces can reuse.

There is **no attached source codebase, Figma, or brand guide** — the brief provided only a written
product specification. All visual decisions are original and made to fit the product's clinical,
data-collaboration theme. No real company branding, code, data, or schemas are used.

---

## What's here

| Path | What it is |
|---|---|
| `styles.css` | Global entry point — `@import`s every token + base file. Consumers link this. |
| `tokens/` | CSS custom properties: `colors`, `semantic` (light + dark), `typography`, `spacing`, `radius`, `motion`, `fonts`, `base`. |
| `assets/` | Logo mark (color + mono). |
| `workbench/` | **AI Delivery Workbench** — the primary deliverable. See `workbench/README.md`. |
| `SKILL.md` | Agent-Skill manifest so this can be used as a downloadable skill. |

---

## VISUAL FOUNDATIONS

- **Color.** Cool slate neutrals (slightly blue-tinted ink) carry the UI; a single **clinical azure**
  (`--accent`, `#0E6FE6` light / `#2684FF` dark) is the only brand accent. Status color is used
  *intentionally, never decoratively*: verified-green `--safe`, caution amber `--warn`, denied red
  `--danger`, and a reserved violet `--secure` for "encrypted/secure" accents. Full light + dark
  themes via `[data-theme="dark"]`.
- **Type.** **Hanken Grotesk** for UI/body/display (by size + weight), **JetBrains Mono** for data,
  metrics, IDs, code, eyebrows, and badges. Tabular numerals wherever numbers matter. Eyebrow labels
  are uppercase mono with wide tracking.
- **Spacing.** 4px base grid; layout primitives for sidebar width, topbar height, container max.
- **Shape.** Restrained, technical radii (`--radius-md` 7px for controls, `--radius-lg` 10px for
  cards). Crisp 1px hairlines (`--border-subtle/default/strong`).
- **Elevation.** Cool-tinted, low-spread shadows (`--shadow-xs … xl`). No glow, no heavy drops.
  Cards = surface + hairline border + `--shadow-sm`.
- **Backgrounds.** Flat surfaces only — `--bg-canvas` page, `--bg-surface` cards, `--bg-inset`
  wells/code. No gradients, no imagery, no texture. The aesthetic is "clean room": lots of
  whitespace, precise alignment, mono accents.
- **Motion.** Quick and functional (140–320ms), controlled easing (`--ease-standard`,
  `--ease-out`), no bounce. A subtle pulse marks "running"; a spin marks loaders. Drawers slide,
  modals fade-scale, toasts slide in from the right.
- **States.** Hover = subtle surface tint / border darken; press = 0.5px nudge; focus = 3px azure
  ring. Disabled = 50% opacity.

## CONTENT FUNDAMENTALS

- **Voice:** calm, precise, technically credible — written for engineers, not consumers. Short,
  declarative. Favors nouns and verbs over adjectives.
- **Person:** mostly impersonal / system-voice ("This change is waiting on the human review gate").
  Second person for guidance ("Review the diff before approving"). Avoids "I".
- **Casing:** sentence case for UI copy; UPPERCASE mono for eyebrows and metric labels; PascalCase
  for stage names; mono for issue keys, branches, file paths, SHAs, JQL.
- **Tone of governance:** make risk and control **visible without feeling punitive** — "Blocked —
  gates open" not "ERROR". Banners explain *why* a gate exists.
- **No emoji.** Status is carried by icons + color, never emoji or unicode glyph art.
- **Numbers/data:** monospace + tabular figures; `+142 / −6` diff style; `5% / $50k`.

## ICONOGRAPHY

- A single **in-house stroke icon set** (`workbench/icons.jsx`): 24-grid, 1.75 stroke, round caps —
  consistent with the clean/technical aesthetic and **fully offline** (no icon CDN), so the
  prototype is screen-shareable with zero network dependency.
- ~70 glyphs cover workflow (timeline nodes, run/retry/redo), source control (branch, commit, PR,
  merge), data (database, server, cpu), governance (shield, lock, fingerprint), and standard UI.
- **No emoji, no hand-drawn illustrations.** The logo mark (`assets/logo-mark.svg`, plus a
  `currentColor` mono variant) is two overlapping rounded squares whose highlighted **intersection**
  reads as "two datasets meeting only in a protected zone."

---

## Index / manifest

- **Primary deliverable:** `workbench/AI Delivery Workbench.html` — see `workbench/README.md` for the
  demo walkthrough and run instructions.
- **Tokens:** `styles.css` → `tokens/*.css`.
- **Assets:** `assets/logo-mark.svg`, `assets/logo-mark-mono.svg`.
- **Skill:** `SKILL.md`.

### Substitution flags

- **Fonts** (Hanken Grotesk, JetBrains Mono) are loaded from **Google Fonts** as a substitution —
  there were no supplied font binaries. To ship licensed binaries, drop them in `assets/fonts/` and
  replace the `@import` in `tokens/fonts.css` with local `@font-face` rules.
