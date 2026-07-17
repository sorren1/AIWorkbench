# Contributor commands

The supported runtime is Node.js 22 LTS; `.nvmrc` pins the verified local version. Use the committed npm lockfile for reproducible installs.

| Command                                   | Purpose                                                              |
| ----------------------------------------- | -------------------------------------------------------------------- |
| `npm ci`                                  | Install the exact dependency graph from `package-lock.json`.         |
| `npm run dev`                             | Start the Vite development server for `/` and `/demo/`.              |
| `npm run build`                           | Create the static multi-page production build in `dist/`.            |
| `npm run preview`                         | Serve the production build locally.                                  |
| `npm run typecheck`                       | Run strict TypeScript without emitting files.                        |
| `npm run lint`                            | Run ESLint with typed TypeScript rules and zero warnings.            |
| `npm run format:check`                    | Verify Prettier formatting without changing files.                   |
| `npm run registry:generate`               | Generate validated registry TypeScript and public capability cards.  |
| `npm run registry:check`                  | Fail if generated registry files differ from typed sources.          |
| `npm run mcp:evidence:generate`           | Run the disposable local MCP slice and write sanitized evidence.     |
| `npm run mcp:evidence:check`              | Re-run the local MCP slice and fail if evidence has drifted.         |
| `npm run demo:sandbox`                    | Run the fixed Docker slice and emit successful validation evidence.  |
| `npm run demo:sandbox:e2b`                | Explicitly run the optional E2B provider; requires `E2B_API_KEY`.    |
| `npm run demo:sandbox:failure`            | Emit honest fixed failed-test evidence and exit non-zero.            |
| `npm run sandbox:evidence:validate`       | Validate all evidence schemas, hashes, and latest-pointer bindings.  |
| `npm run trace:generate`                  | Regenerate the typed browser module from validated trace evidence.   |
| `npm run trace:check`                     | Fail when the generated browser trace module has drifted.            |
| `npm run test:e2b:live`                   | Run the credential-gated E2B integration test; otherwise it skips.   |
| `npm run demo:model-gateway`              | Run the deterministic offline gateway contract; no provider needed.  |
| `npm run model-gateway:up`                | Start the digest-pinned loopback LiteLLM/PostgreSQL profile.         |
| `npm run demo:model-gateway:live`         | Explicitly invoke the local gateway and emit evidence after cleanup. |
| `npm run demo:model-gateway:cleanup`      | Retry blocking credentials retained after interrupted local runs.    |
| `npm run model-gateway:evidence:validate` | Validate checked-in gateway evidence and trace-hash bindings.        |
| `npm run model-gateway:generate`          | Generate sanitized public gateway status from validated evidence.    |
| `npm run model-gateway:check`             | Fail when the generated gateway status has drifted.                  |
| `npm run test:model-gateway:live`         | Run the explicitly enabled credential-gated live gateway test.       |
| `npm run security:check`                  | Scan tracked files and public output without logging matched values. |
| `npm run dependency:audit`                | Fail on high/critical advisories in the resolved dependency graph.   |
| `npm run links:check`                     | Validate production HTML links, assets, and fragments.               |
| `npm run performance:budgets`             | Verify measured production output against recorded gzip budgets.     |
| `npm run performance:audit`               | Run local desktop/mobile Lighthouse assertions on production output. |
| `npm run demo:approval:start`             | Start a gitignored local run that pauses for bounded-write approval. |
| `npm run demo:approve`                    | Approve a bound request as an authorized synthetic reviewer.         |
| `npm run demo:reject`                     | Reject a bound request as an authorized synthetic reviewer.          |
| `npm run demo:resume`                     | Revalidate hashes and resume the exact approved local action.        |
| `npm run test`                            | Run deterministic unit, MCP, and application tests once.             |
| `npm run test:coverage`                   | Run domain tests with enforced coverage thresholds.                  |
| `npm run test:e2e`                        | Run browser, axe, security, and responsive checks in three engines.  |
| `npm run test:a11y`                       | Run the focused axe suite on public and principal demo surfaces.     |
| `npm run test:visual`                     | Capture controlled principal-screen screenshots for human review.    |
| `npm run check`                           | Run deterministic source, evidence, build, and supply-chain checks.  |
| `npm run check:all`                       | Run the complete release gate, including browsers and Lighthouse.    |

Install the pinned Playwright engines once per environment with `npx playwright install chromium firefox webkit`. Browser binaries are local tool-cache content and are not tracked. Browser tests build and serve the production output with the real preview security headers; they do not require a separately running development server.

Registry generation validates the authored fixtures with JSON Schema and computes canonical SHA-256 hashes. MCP evidence generation requires local Git and uses the pinned official TypeScript SDK over stdio. It creates a temporary toy-repository copy, invokes only approved fixture tools, closes the child process, and removes the copy. Neither command contacts an external provider.

The sandbox command accepts no repository, patch, or command input. Docker remains the default: it copies only `examples/toy-repo`, automatically prepares the exact Node image when needed, disables container networking, applies resource limits, and emits checked-in synthetic/public evidence plus a normalized OpenTelemetry-compatible trace. E2B requires an explicit provider flag and `E2B_API_KEY`; it is implemented but not live-validated in this revision. See `docs/vertical-slice-walkthrough.md`, `docs/sandbox-security-model.md`, and `docs/observability-and-budgeting.md`.

The approval commands use `.workbench/runs/`, which is gitignored. See `docs/human-approval-protocol.md` for exact arguments and trust boundaries. They never operate on an external repository or make a network call.

The model-gateway command is offline by default. The live profile requires an explicit command, a loopback LiteLLM/PostgreSQL Compose stack, and locally supplied environment credentials. Its virtual-key recovery files stay under gitignored `.workbench/model-gateway/`; the public browser never imports the adapter. See `docs/local-model-gateway-runbook.md`.
