# Contributor commands

The supported runtime is Node.js 22 LTS; `.nvmrc` pins the verified local version. Use the committed npm lockfile for reproducible installs.

| Command                         | Purpose                                                             |
| ------------------------------- | ------------------------------------------------------------------- |
| `npm ci`                        | Install the exact dependency graph from `package-lock.json`.        |
| `npm run dev`                   | Start the Vite development server for `/` and `/demo/`.             |
| `npm run build`                 | Create the static multi-page production build in `dist/`.           |
| `npm run preview`               | Serve the production build locally.                                 |
| `npm run typecheck`             | Run strict TypeScript without emitting files.                       |
| `npm run lint`                  | Run ESLint with typed TypeScript rules and zero warnings.           |
| `npm run format:check`          | Verify Prettier formatting without changing files.                  |
| `npm run registry:generate`     | Generate validated registry TypeScript and public capability cards. |
| `npm run registry:check`        | Fail if generated registry files differ from typed sources.         |
| `npm run mcp:evidence:generate` | Run the disposable local MCP slice and write sanitized evidence.    |
| `npm run mcp:evidence:check`    | Re-run the local MCP slice and fail if evidence has drifted.        |
| `npm run test`                  | Run deterministic unit, MCP, and application tests once.            |
| `npm run test:e2e`              | Run axe, keyboard, overlay, and responsive checks in Chromium.      |
| `npm run test:a11y`             | Run the focused axe suite on public and principal demo surfaces.    |
| `npm run check`                 | Run every required local check, including browser tests, in order.  |

Install the pinned Playwright browser once per environment with `npx playwright install chromium`. The browser binary is a local tool cache and is not tracked. `npm run check` starts its own Vite server for the browser suite; it does not require a separately running development server.

Registry generation validates the authored fixtures with JSON Schema and computes canonical SHA-256 hashes. MCP evidence generation requires local Git and uses the pinned official TypeScript SDK over stdio. It creates a temporary toy-repository copy, invokes only approved fixture tools, closes the child process, and removes the copy. Neither command contacts an external provider.
