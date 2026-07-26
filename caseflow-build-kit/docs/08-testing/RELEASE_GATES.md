# Release Gates

## Gate A — Source

Formatting, lint, strict types, Python static/format checks, domain unit/coverage, API tests, frontend tests, contract/schema validation.

## Gate B — Behavior

All five gold cases, unauthorized write, duplicate write, partial failure, explanation evidence mapping, support handoff.

## Gate C — Public boundary

Static replay without external network, no secrets/real data, claim labels, clean-room disclosure, no navigation/sitemap link.

## Gate D — User experience

Chromium/Firefox/WebKit, keyboard, axe, responsive captures, reduced motion, performance budgets.

## Gate E — Existing site compatibility

Every pre-existing Workbench check passes, routes remain unchanged, release-evidence rules remain valid.

## Gate F — Live evidence

When live validation exists: sanitized manifest validates, hashes match, call ledger is within budget, no raw output is tracked.

## Gate G — Hosted

Direct routes load, headers and noindex are correct, static evidence matches source, deployment binding identifies exact commit, rollback is documented.
