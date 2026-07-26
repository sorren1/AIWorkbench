# Same-Site Integration Plan

## Host

Existing `sorren1/AIWorkbench` Vite/Vercel repository.

## New entry point

- `caseflow/index.html`
- `src/caseflow/main.tsx`
- Vite Rollup input named `caseflow`

## New output

`dist/caseflow/index.html` plus shared immutable assets.

## Routing

Vercel rewrites every `/caseflow` and `/caseflow/*` request to `/caseflow/index.html`. The React app selects the view from the pathname; no client router dependency is required unless justified.

## Existing plugin changes

- extend page-kind/metadata support for a non-indexed CaseFlow page;
- do not alter existing metadata output;
- exclude CaseFlow from sitemap;
- add robots disallow and noindex tags;
- preserve root home substitution and Workbench emitted pages;
- ensure relative asset rewriting works under `/caseflow/`.

## Compatibility tests

- exact snapshots or assertions for old Vercel redirects/rewrites;
- home and Workbench output unchanged except intentionally regenerated shared asset hashes;
- no CaseFlow links in existing HTML;
- all pre-existing security and supply-chain gates pass.
