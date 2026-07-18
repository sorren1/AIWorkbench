# Performance, privacy, and static-host controls

## Measured budgets

`quality/performance-budgets.json` is the policy and `quality/measurements/bundle.json` is the deterministic measurement of the audited source commit's Vite production output using gzip level 9. Before measuring case-study HTML, the script replaces only fixed-width generated timestamps, run IDs, and cryptographic identifiers with same-length placeholders. This keeps a fresh evidence run from changing compression noise while preserving the measured structure and byte lengths. `npm run performance:budgets` fails if the normalized source output exceeds policy or differs from the recorded measurement.

The direct evidence child deliberately renders the generated release summary that is absent from its audited parent, so its case-study HTML cannot equal the parent's recorded byte measurement. That one case still enforces every byte/request budget and is accepted only after `security:release-evidence:require` proves that the current commit is annotated-tagged, changes only `public/security/release-summary.json`, and binds the hosted CodeQL result to its direct parent. Any executable, CSS, source, or untagged summary change continues to fail closed.

| Production asset boundary          |        Budget |
| ---------------------------------- | ------------: |
| Case-study HTML, gzip              |  20,000 bytes |
| Case-study executable scripts      |             0 |
| Demo entry JavaScript, gzip        | 115,000 bytes |
| Total JavaScript, gzip             | 140,000 bytes |
| Total CSS, gzip                    |  22,000 bytes |
| External runtime resource requests |             0 |

The case study, article, and 404 remain authored static HTML. React is emitted only for `/demo/`, so opening the case study does not download the workbench bundle. No syntax-highlighting dependency exists; code excerpts use static HTML and CSS, leaving no heavy highlighting code to defer.

The current recorded output is 11,489 bytes gzip for normalized case-study HTML, zero case-study executable scripts, 110,306 bytes gzip for the initial demo entry, 125,288 bytes gzip across all JavaScript chunks, and 14,400 bytes gzip across CSS. Architecture, Settings, Control Plane, and Run Trace are separate lazy chunks.

`npm run performance:audit` runs local-only Lighthouse CI against production output in desktop and mobile profiles. The case-study gate requires at least 90 Performance and 95 Accessibility, Best Practices, and SEO. The deliberately richer demo requires 85 Performance, 95 Accessibility and Best Practices, and 90 SEO. Reports remain under gitignored `.lighthouseci/`; CI retains them as short-lived build artifacts and does not upload them to a hosted Lighthouse service.

The recorded 2026-07-17 local baseline used Node 22.18.0, Chromium 149.0.7827.55, Lighthouse CI 0.15.1, and one run per page. The case study scored 100/100/100/100 on desktop and mobile for Performance/Accessibility/Best Practices/SEO. The demo scored 100/100/100/100 on desktop and 99/100/100/100 on mobile. An initial mobile audit identified sub-12-pixel code text; the final baseline reflects the corrected inherited code size. `quality/measurements/lighthouse-baseline.json` records the result. Category scores can vary with host and hardware; the checked-in thresholds, not a perfect-score claim, are the durable release policy.

## Security headers

The Vite production preview, emitted `_headers` file, and committed Vercel edge configuration use the same policy from `src/site/securityHeaders.ts`; a unit test prevents the Vercel values from drifting. The policy denies framing, objects, workers, media, external connections, and non-local scripts; it includes Referrer-Policy, nosniff, Permissions-Policy, and cross-origin opener isolation. It does not permit `unsafe-eval`.

Inline styles remain allowed because the established React workbench uses typed React style properties extensively. Scripts remain local-only. Vite-generated hashed code is emitted below `/assets/immutable/` for an explicit immutable cache rule; unhashed images and HTML remain revalidation-safe. Hosts that ignore `_headers`, including a bare GitHub Pages origin, require an equivalent CDN/edge header configuration before release; a file in the build cannot create HTTP response headers by itself.

## Privacy switch

`siteConfig.analyticsOptIn` is the single typed analytics switch and defaults to `false`. No analytics provider, client script, cookie, local identifier, fingerprint, beacon, or consent banner is included. Enabling the boolean alone sends nothing: a future adapter would require its own privacy review, documentation, tests, and explicit implementation change.
