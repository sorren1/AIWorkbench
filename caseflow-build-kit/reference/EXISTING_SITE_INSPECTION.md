# Existing AIWorkbench Site Inspection

**Repository:** `sorren1/AIWorkbench`

**Inspection basis:** public default branch observed 2026-07-26. T01 must verify current local state.

## Current architecture relevant to CaseFlow

- Vite multi-page static build.
- React 18, TypeScript strict, Node 22 LTS.
- Root portfolio at `/`.
- Workbench case study under `/workbench/` and demo under `/workbench/demo/`.
- `vite.config.ts` uses explicit Rollup HTML inputs and `base: "./"`.
- `src/site/vitePlugin.ts` recognizes a fixed page-kind union and emits mapped Workbench HTML into `dist/workbench/**`.
- `vercel.json` rewrites the Workbench namespace and applies a restrictive CSP with `connect-src 'self'`.
- Existing public browser is intentionally static and contains no backend credentials or live integrations.
- Release evidence and deployment binding are commit-specific.

## Required CaseFlow integration changes

1. Add `caseflow/index.html` as a Vite input.
2. Add `src/caseflow/**` as an isolated application namespace.
3. Extend metadata/page-kind handling without changing existing page metadata.
4. Emit or preserve `caseflow/index.html` in the production bundle.
5. Rewrite `/caseflow`, `/caseflow/`, and `/caseflow/:path*` to that entry.
6. Keep static assets compatible with relative base paths and existing immutable asset handling.
7. Add noindex/noarchive metadata and preferably `X-Robots-Tag` for CaseFlow routes.
8. Exclude CaseFlow from sitemap and existing navigation.
9. Add tests asserting no `/caseflow` links are present in the homepage, Workbench case study, article, or demo.
10. Preserve every existing route, CSP, source gate, release evidence rule, and hosted verification.

## Public-runtime boundary

The existing CSP is compatible with CaseFlow replay mode. Do not broaden `connect-src` simply to make a live browser demo easier. Live calls stay in the local Python service and recorded evidence is copied into static public assets after sanitization.
