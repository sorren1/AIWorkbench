# Vercel Route Contract

## Required direct routes

- `/caseflow`
- `/caseflow/`
- `/caseflow/strategy`
- `/caseflow/technical`
- `/caseflow/operations`
- `/caseflow/product`

All resolve to the CaseFlow HTML entry while preserving the browser pathname.

## Required headers

- existing global CSP and security headers;
- `X-Robots-Tag: noindex, nofollow, noarchive` for `/caseflow/:path*` where Vercel header matching permits;
- immutable caching only for fingerprinted assets;
- HTML/evidence manifests should not be permanently cached during active interview iteration.

## Discoverability

- add `/caseflow/` to robots `Disallow`;
- do not add it to sitemap;
- no existing navigation link;
- `meta name="robots" content="noindex,nofollow,noarchive"` in HTML.

## Security clarification

Noindex and lack of links are presentation choices, not access control. All content remains safe for public access.
