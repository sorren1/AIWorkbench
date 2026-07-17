# Repository operating guide

These instructions apply to the entire repository. They are the durable working agreement for the portfolio transformation described in `docs/portfolio-upgrade-plan.md`.

## Mission

Transform the AI Delivery Workbench clean-room prototype into a polished, credible, maintainable public case study and interactive demo for staff/principal AI platform, AI developer-tools, and agentic SDLC roles.

## Non-negotiable operating rules

1. Inspect before editing. Do not assume the current structure or behavior.
2. Work autonomously. Do not ask for approval for ordinary implementation choices. Make the lowest-complexity decision that meets the requirements and record meaningful decisions in `docs/decision-log.md`.
3. Preserve the original implementation through Git tag `original-prototype-v0.9.0`. The tag was expected but absent during the baseline audit; verify or create it at the original commit before deleting legacy files. Do not keep giant generated legacy files in the production branch merely as backups.
4. Never invent professional claims, users, adoption, revenue, awards, performance numbers, or production capabilities.
5. The only approved professional-context claim is: “In professional work, I built a related governed AI-assisted delivery platform that supported approximately 50 production stories through human-reviewed pull requests. This public prototype is a separate implementation and contains none of that system’s code or data.” Keep it clearly separated from the public prototype.
6. Never imply that simulated Jira, GitHub, AI, Oracle, MCP, deployment, test, or review operations are real. Label local-only actions that actually work as functional and mocked external integrations as simulated.
7. Remove organization-, opportunity-, or audience-specific names and identifying details. Do not include non-public code, prompts, schemas, screenshots, repository names, internal terms, or confidential implementation details from another system or organization.
8. Do not add secrets, credentials, tokens, personal phone numbers, street addresses, private employment documents, or private review material to tracked files or prompts.
9. Use strict TypeScript, conventional module imports, a normal production build, a committed lockfile, and reproducible commands. Do not use browser-side Babel, React development CDN builds, window globals, or TypeScript-style JSX presented as TypeScript.
10. Prefer semantic HTML, progressive enhancement, accessibility, low runtime weight, deterministic behavior, and no unnecessary backend.
11. Keep the current visual identity unless a change materially improves clarity, accessibility, responsiveness, or credibility. Do not replace it with a generic template.
12. End every phase with all applicable checks passing and one focused Git commit. Never claim a check passed without observing a zero exit code or a clearly successful browser result.
13. Do not deploy or publish until the final release phase.
14. If an external credential or local dependency is unavailable, complete everything else, document the exact blocker, and never fabricate evidence.

## Change discipline

- Preserve user changes and unrelated work in a dirty worktree.
- Keep each phase focused on its documented acceptance criteria.
- Use semantic HTML elements before adding ARIA.
- Keep case-study content statically present in `index.html`; JavaScript may enhance it but must not be required to read it.
- Keep the interactive prototype under `/demo/`; do not turn the public case study into a client-rendered SPA.
- Keep fixtures deterministic. Reset demo state on reload unless a documented local preference, such as theme, is intentionally persisted.
- A visible disclosure must remain present in the demo at all times, with more specific labels on actions that simulate external systems.
- Record architecture or product-boundary decisions in `docs/decision-log.md`.
- Store private review notes under `private/`; everything there is ignored except `private/README.md`.

## Current project commands

Use the committed lockfile and Node.js version when installing and verifying the project:

```powershell
npm ci
npm run dev
npm run lint
npm run typecheck
npm run test
npx playwright install chromium
npm run test:a11y
npm run test:e2e
npm run build
npm run check
npm run demo:sandbox
npm run demo:sandbox:e2b
npm run sandbox:evidence:validate
npm run test:e2b:live
npm run demo:approval:start -- --scenario approval-required
npm run demo:approve -- --request <request-id> --as synthetic-code-reviewer --reason "..."
npm run demo:resume -- --run <run-id>
```

`npm run check` must be the local CI-equivalent aggregate. The lockfile is authoritative; use `npm ci` in CI and clean verification.

The Playwright commands run maintained Chromium browser coverage. `npm run test:a11y` applies axe to the public routes and principal demo surfaces; `npm run test:e2e` also covers keyboard interaction, focus management, and responsive layouts. Install the pinned browser once per environment with `npx playwright install chromium`.

## Required phase report

Every completed phase must report:

- Summary of what changed and why
- Files added, changed, moved, and deleted
- Commands and checks run, with observed results
- Browser behaviors manually verified
- Commit hash and commit message
- Remaining risks, deferred work, or blockers
