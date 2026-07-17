# Contributing

AI Delivery Workbench favors small, reviewable changes that preserve the static public boundary, synthetic-data boundary, and explicit control/evidence model.

## Set up

Use the Node.js 22 LTS version recorded in `.nvmrc`.

```bash
npm ci
npx playwright install chromium firefox webkit
npm run dev
```

Routes:

- `/` — statically authored case study
- `/writing/governing-ai-assisted-delivery/` — statically authored technical article
- `/demo/` — React workbench
- `/404.html` — custom static-host fallback

## Change workflow

1. Read [AGENTS.md](AGENTS.md), [CLEAN_ROOM.md](CLEAN_ROOM.md), and the relevant ADR before editing.
2. Keep external operations simulated unless the change is an explicitly invoked, fixture-only local developer tool.
3. Add or update tests for state guards, policy decisions, evidence contracts, accessibility behavior, or generated artifacts affected by the change.
4. Regenerate committed derived files with their documented generator; do not hand-edit generated capability/evidence output.
5. Run the focused checks while iterating and `npm run check:all` before a release candidate.
6. Update architecture, threat, evaluation, notices, and decision records when a boundary changes.

## Commands

| Command                              | Purpose                                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------------------- |
| `npm run dev`                        | Vite development server                                                                      |
| `npm run build` / `npm run preview`  | Production static build and local preview                                                    |
| `npm run format:check`               | Prettier conformance                                                                         |
| `npm run lint`                       | Strict TypeScript/JavaScript lint rules                                                      |
| `npm run typecheck`                  | TypeScript compiler without emission                                                         |
| `npm test` / `npm run test:coverage` | Unit and component tests, with enforced coverage in the latter                               |
| `npm run test:e2e`                   | Chromium, Firefox, WebKit, accessibility, keyboard, responsive, action, and visual workflows |
| `npm run registry:generate`          | Regenerate schemas, registry, capability cards, context fixtures, and policy output          |
| `npm run demo:sandbox`               | Explicit fixed Docker run against the disposable toy repository                              |
| `npm run sandbox:evidence:validate`  | Validate recorded evidence schemas and hashes without executing code                         |
| `npm run screenshots:generate`       | Build and capture the committed representative screenshot deterministically                  |
| `npm run links:check`                | Validate built-site and tracked Markdown links/fragments                                     |
| `npm run security:supply-chain`      | Run fail-closed secret/SAST/dependency/container/SBOM/license evidence gate                  |
| `npm run check`                      | Complete source/build/security gate currently available                                      |
| `npm run check:all`                  | `check` plus cross-browser E2E and Lighthouse                                                |

Optional E2B and LiteLLM live profiles require explicit flags and owner-supplied local environment variables. They are never part of default development, CI, the browser bundle, or a public endpoint. See [docs/contributor-commands.md](docs/contributor-commands.md) for exact optional commands.

## Code and data expectations

- Keep TypeScript strict. Do not add `any`, `@ts-ignore`, implicit globals, unsafe browser globals, or broad assertions.
- Prefer pure domain functions and explicit imports. Keep effects at adapters and UI action boundaries.
- Use semantic HTML, native controls, visible focus, reduced-motion support, and tested keyboard behavior.
- Preserve semantic tokens and the local SVG icon system; do not add runtime fonts, CDNs, stock art, or copied components.
- Fixtures must be original, synthetic, public, deterministic, and free of secrets or arbitrary prompt history.
- A displayed number must say whether it is measured repository evidence, a synthetic fixture, an estimate, or proposed production telemetry.
- Never put prompts, source bodies, credentials, personal data, or raw exception details in traces.

## Generated and private files

Committed generated files are limited to public assets whose consumers validate freshness: capability cards/schemas/context records, the latest public sandbox evidence and trace, security release summary, performance baselines, metadata output, and the representative screenshot. Their source generators remain under `scripts/` or `tools/`.

Do not commit `dist/`, coverage, Playwright/Lighthouse reports, detailed scanner output, `.workbench/`, `.env*` other than `.env.example`, or anything under `private/` except `private/README.md`.

## Dependency and security review

Follow [docs/dependency-review.md](docs/dependency-review.md). Direct dependencies use exact versions; GitHub Actions and scanner/container images use reviewed immutable references. A high/critical finding cannot be waived by changing prose: use `security/suppressions.json` with rule, exact target, reason, reviewer, review date, and expiry, then obtain review.

Report vulnerabilities according to [SECURITY.md](SECURITY.md) without placing secrets or exploit details in a public issue.

## License boundary

Contributions do not receive or imply a reuse license for first-party project code. Do not add a source license or change this boundary without an explicit owner decision and an updated [license ADR](docs/adr/source-license-decision.md). Third-party material must be compatible with [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md) and the generated license policy.
