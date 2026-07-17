# Contributor commands

The supported runtime is Node.js 22 LTS; `.nvmrc` pins the verified local version. Use the committed npm lockfile for reproducible installs.

| Command                | Purpose                                                               |
| ---------------------- | --------------------------------------------------------------------- |
| `npm ci`               | Install the exact dependency graph from `package-lock.json`.          |
| `npm run dev`          | Start the Vite development server for `/` and `/demo/`.               |
| `npm run build`        | Create the static multi-page production build in `dist/`.             |
| `npm run preview`      | Serve the production build locally.                                   |
| `npm run typecheck`    | Run strict TypeScript without emitting files.                         |
| `npm run lint`         | Run ESLint with typed TypeScript rules and zero warnings.             |
| `npm run format:check` | Verify Prettier formatting without changing files.                    |
| `npm run test`         | Run deterministic unit and application smoke tests once.              |
| `npm run check`        | Run every currently required local check in CI-equivalent order.      |
| `npm run test:e2e`     | Placeholder until the browser E2E harness is added in a later phase.  |
| `npm run test:a11y`    | Placeholder until the dedicated accessibility harness is added later. |

The two placeholder commands are deliberately excluded from `npm run check`; they do not represent test coverage. Browser verification for the current phase is recorded separately in the phase completion report.
