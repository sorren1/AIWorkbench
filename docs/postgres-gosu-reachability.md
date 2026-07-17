# PostgreSQL `gosu` vulnerability reachability review

- Review date: 2026-07-17
- Re-review no later than: 2026-08-15
- Image: `postgres:17.10-alpine3.24@sha256:742f40ea20b9ff2ff31db5458d127452988a2164df9e17441e191f3b72252193`
- Scanner: Trivy 0.70.0 with the current database used by the release gate

## Observed scope

The exact Docker Official Image has no HIGH or CRITICAL Alpine or PostgreSQL package finding. Trivy reports one CRITICAL and fourteen HIGH Go-standard-library findings only in `/usr/local/bin/gosu`; the embedded Go standard library is `v1.24.6`. The exact CVE IDs are recorded as individual entries in `security/suppressions.json`, so a new CVE, package, path, or image digest remains unsuppressed and blocks release.

## Reachability decision

`gosu` is a short-lived entrypoint helper. In this Compose profile it receives trusted, image-owned arguments only to change from the container startup identity to the fixed `postgres` account and then exec PostgreSQL. It does not serve a port, process model prompts, parse database protocol traffic, or remain in the PostgreSQL process. The database has no published host port and is reachable only on the internal Compose network.

An anonymous website visitor cannot alter the Compose command, entrypoint, environment, or image. A malicious local Docker operator could do so, but that operator already controls the trusted local host and Docker daemon and is outside this prototype's adversarial boundary. On that basis, the reported `gosu` code is not reachable from untrusted input in the documented runtime profile.

This is a time-bounded exception, not a claim that the binary is vulnerability-free. The release gate still retains the original SARIF findings, requires every exception to match a finding, and reports zero only for **unsuppressed** HIGH/CRITICAL findings.

## Exception boundaries and exit conditions

The fifteen exceptions:

- match one CVE ID, this exact image digest, and `/usr/local/bin/gosu`;
- expire on 2026-08-15;
- cannot suppress findings in PostgreSQL, Alpine packages, another binary, or another image digest; and
- fail the gate if they become unused, stale, malformed, or expired.

Remove the exceptions immediately when the official image rebuilds `gosu` with fixed Go packages. Re-review before expiry, or sooner if the image, entrypoint, Compose command, network publication, trust boundary, or Trivy result changes. A maintained derivative image remains the fallback if the official image is not rebuilt; it was not chosen now because rebuilding the database image solely to replace a short-lived privilege-drop helper would create a larger patching and image-publishing responsibility than this narrow local profile requires.

Docker Official Images do not publish a PostgreSQL-specific Cosign key in the referenced image documentation. The gate therefore verifies the exact registry digest and scan target but does not mislabel that digest check as a vendor signature.
