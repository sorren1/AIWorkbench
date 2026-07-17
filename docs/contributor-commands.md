# Contributor commands

The supported runtime is Node.js 22 LTS; `.nvmrc` pins the verified local version. Use the committed npm lockfile for reproducible installs.

| Command                | Purpose                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `npm ci`               | Install the exact dependency graph from `package-lock.json`.       |
| `npm run dev`          | Start the Vite development server for `/` and `/demo/`.            |
| `npm run build`        | Create the static multi-page production build in `dist/`.          |
| `npm run preview`      | Serve the production build locally.                                |
| `npm run typecheck`    | Run strict TypeScript without emitting files.                      |
| `npm run lint`         | Run ESLint with typed TypeScript rules and zero warnings.          |
| `npm run format:check` | Verify Prettier formatting without changing files.                 |
| `npm run test`         | Run deterministic unit and application smoke tests once.           |
| `npm run test:e2e`     | Run axe, keyboard, overlay, and responsive checks in Chromium.     |
| `npm run test:a11y`    | Run the focused axe suite on public and principal demo surfaces.   |
| `npm run check`        | Run every required local check, including browser tests, in order. |

Install the pinned Playwright browser once per environment with `npx playwright install chromium`. The browser binary is a local tool cache and is not tracked. `npm run check` starts its own Vite server for the browser suite; it does not require a separately running development server.
