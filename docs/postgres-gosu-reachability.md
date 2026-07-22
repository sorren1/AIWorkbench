# PostgreSQL `gosu` vulnerability reachability review

- Review date: 2026-07-17
- Re-review no later than: 2026-08-15
- Image: `postgres:17.10-alpine3.24@sha256:742f40ea20b9ff2ff31db5458d127452988a2164df9e17441e191f3b72252193`
- Scanner: Trivy 0.70.0 with the current database used by the release gate

## 2026-07-21 pre-expiry review attempt

The required fresh Trivy scan could not run in the available sandbox: Docker CLI 29.5.3 was installed, but the Docker Engine named pipe rejected access, no Linux-container alternative was installed or reachable, and direct registry network access was unavailable. The supply-chain command failed closed. It did not refresh an advisory database, produce a scanner/database date, or create evidence that can renew an exception.

No suppression was removed, renewed, widened, or otherwise changed. `SUP-2026-001` through `SUP-2026-015` retain their original 2026-08-15 expiry. Their provisional classification remains **present but unreachable in the exact configured profile**, but that classification is not accepted as a completed renewal until the pinned Trivy image scans the exact runtime image with a current database and every selector matches independently. Complete that run no later than 2026-08-14 so an environmental failure cannot carry an exception past expiry.

Authoritative upstream state was rechecked on 2026-07-21:

- Docker Hub still mapped `17.10-alpine3.24` to the configured [index digest](https://hub.docker.com/layers/library/postgres/17.10-alpine3.24/images/sha256-1902911d4ca21b4ec0c6b64f08f6c62d630be0fbc7e1055e8e99a87322dc2f18), so there was no compatible trusted digest update to adopt.
- The Docker Official Images source-of-truth mapped that tag to PostgreSQL packaging commit [`4f9ced003ba58a854656ba150d146243d27ae3ac`](https://github.com/docker-library/postgres/tree/4f9ced003ba58a854656ba150d146243d27ae3ac/17/alpine3.24). Its [Dockerfile](https://github.com/docker-library/postgres/blob/4f9ced003ba58a854656ba150d146243d27ae3ac/17/alpine3.24/Dockerfile) still installs signed `gosu` 1.19, whose latest release remains built with Go 1.24.6.
- The exact upstream [entrypoint](https://github.com/docker-library/postgres/blob/4f9ced003ba58a854656ba150d146243d27ae3ac/docker-entrypoint.sh) still invokes `gosu` only when `id -u` is zero. This repository still fixes the service identity at `70:70`, so the binary is not executed in the reviewed profile.
- The `gosu` maintainer's [security policy](https://github.com/tianon/gosu/blob/40506998e34a7a679e6dae41374c1b7aa37eb73f/SECURITY.md) requires symbol-aware `govulncheck` analysis before treating embedded Go-library version findings as applicable. That is supporting upstream context, not a substitute for this repository's required exact-image Trivy evidence.

## Observed scope

The exact Docker Official Image has no HIGH or CRITICAL Alpine or PostgreSQL package finding. Trivy reports one CRITICAL and fourteen HIGH Go-standard-library findings only in `/usr/local/bin/gosu`; the embedded Go standard library is `v1.24.6`. The exact CVE IDs are recorded as individual entries in `security/suppressions.json`, so a new CVE, package, path, or image digest remains unsuppressed and blocks release.

## Reachability decision

`gosu` is present in the official image for root-to-PostgreSQL privilege changes, but this Compose profile starts the container directly as numeric user/group `70:70`. The upstream entrypoint reaches its `gosu` branch only when its effective UID is zero, so the verified profile never executes the reported binary. PostgreSQL starts, initializes its named volume, and passes readiness at `70:70` with a read-only root, dropped capabilities, and only its data directory plus bounded tmpfs paths writable. The database has no published host port and is reachable only on the internal Compose network.

An anonymous website visitor cannot alter the Compose startup identity, command, entrypoint, secret mounts, or image. A malicious local Docker operator could run the image as root, but that operator already controls the trusted local host and Docker daemon and is outside this prototype's adversarial boundary. On that basis, the reported `gosu` code is not executed and is not reachable from untrusted input in the documented runtime profile.

This is a time-bounded exception, not a claim that the binary is vulnerability-free. The release gate still retains the original SARIF findings, requires every exception to match a finding, and reports zero only for **unsuppressed** HIGH/CRITICAL findings.

## Exception boundaries and exit conditions

The fifteen exceptions:

- match one CVE ID, this exact image digest, and `/usr/local/bin/gosu`;
- expire on 2026-08-15;
- cannot suppress findings in PostgreSQL, Alpine packages, another binary, or another image digest; and
- fail the gate if they become unused, stale, malformed, or expired.

Remove the exceptions immediately when the official image rebuilds `gosu` with fixed Go packages. Re-review before expiry, or sooner if the image, entrypoint, Compose startup user, command, network publication, trust boundary, or Trivy result changes. Running this profile as root invalidates the reachability analysis and must fail container policy. A maintained derivative image remains the fallback if the official image is not rebuilt; it was not chosen now because rebuilding the database image solely to remove a dormant helper would create a larger patching and image-publishing responsibility than this narrow local profile requires.

Docker Official Images do not publish a PostgreSQL-specific Cosign key in the referenced image documentation. The gate therefore verifies the exact registry digest and scan target but does not mislabel that digest check as a vendor signature.
