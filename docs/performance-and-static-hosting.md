# Performance, privacy, and static-host controls

## Measured budgets

`quality/performance-budgets.json` is the policy and `quality/measurements/bundle.json` is the deterministic measurement of the current Vite production output using gzip level 9. `npm run performance:budgets` fails if the output exceeds policy or differs from the recorded measurement.

| Production asset boundary          |        Budget |
| ---------------------------------- | ------------: |
| Case-study HTML, gzip              |  20,000 bytes |
| Case-study executable scripts      |             0 |
| Demo entry JavaScript, gzip        | 115,000 bytes |
| Total JavaScript, gzip             | 140,000 bytes |
| Total CSS, gzip                    |  22,000 bytes |
| External runtime resource requests |             0 |

The case study, article, and 404 remain authored static HTML. React is emitted only for `/demo/`, so opening the case study does not download the workbench bundle. No syntax-highlighting dependency exists; code excerpts use static HTML and CSS, leaving no heavy highlighting code to defer.

The current recorded output is 11,037 bytes gzip for case-study HTML, zero case-study executable scripts, 110,306 bytes gzip for the initial demo entry, 125,303 bytes gzip across all JavaScript chunks, and 14,271 bytes gzip across CSS. Architecture, Settings, Control Plane, and Run Trace are separate lazy chunks.

`npm run performance:audit` runs local-only Lighthouse CI against production output in desktop and mobile profiles. The case-study gate requires at least 90 Performance and 95 Accessibility, Best Practices, and SEO. The deliberately richer demo requires 85 Performance, 95 Accessibility and Best Practices, and 90 SEO. Reports remain under gitignored `.lighthouseci/`; CI retains them as short-lived build artifacts and does not upload them to a hosted Lighthouse service.

The recorded 2026-07-17 local baseline used Node 22.18.0, Chromium 149.0.7827.55, Lighthouse CI 0.15.1, and one run per page. The case study scored 100/100/100/100 on desktop and mobile for Performance/Accessibility/Best Practices/SEO. The demo scored 100/100/100/100 on desktop and 99/100/100/100 on mobile. An initial mobile audit identified sub-12-pixel code text; the final baseline reflects the corrected inherited code size. `quality/measurements/lighthouse-baseline.json` records the result. Category scores can vary with host and hardware; the checked-in thresholds, not a perfect-score claim, are the durable release policy.

## Security headers

The Vite production preview and emitted `_headers` file use the same typed policy from `src/site/securityHeaders.ts`. The deployment profile is a Git-backed static host or edge in front of it that supports `_headers`-style response configuration. The policy denies framing, objects, workers, media, external connections, and non-local scripts; it includes Referrer-Policy, nosniff, Permissions-Policy, and cross-origin opener isolation. It does not permit `unsafe-eval`.

Inline styles remain allowed because the established React workbench uses typed React style properties extensively. Scripts remain local-only. Hosts that ignore `_headers`, including a bare GitHub Pages origin, require an equivalent CDN/edge header configuration before release; a file in the build cannot create HTTP response headers by itself.

## Privacy switch

`siteConfig.analyticsOptIn` is the single typed analytics switch and defaults to `false`. No analytics provider, client script, cookie, local identifier, fingerprint, beacon, or consent banner is included. Enabling the boolean alone sends nothing: a future adapter would require its own privacy review, documentation, tests, and explicit implementation change.
