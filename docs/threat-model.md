# Threat model

## Scope

This model covers the functional browser-local authorization demonstration and gitignored local sandbox CLI. External providers and enterprise integrations remain simulated. It does not claim that local storage or a local filesystem resists a malicious machine owner.

| Threat                            | Local mitigation                                                                                        | Residual / production requirement                         |
| --------------------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Unauthorized approval             | Closed synthetic persona IDs, persona/scope checks, reason requirement, fail-closed policy lookup       | Authenticate humans/workloads and authorize server-side   |
| Self-approval / separation bypass | Requester binding, self-approval prohibition, non-overlapping reviewer/administrator scopes             | Use authoritative organization/team and conflict data     |
| Approval replay                   | Bind arguments, versions/hashes, target/context digests, expiry/cache TTL; completed runs cannot resume | Transactional single-use consumption and idempotency keys |
| Stale decision                    | Recompute all bindings and append `INVALIDATED` on mismatch                                             | Trusted context/version services and compare-and-swap     |
| Confused deputy                   | Intersect human, delegation, stage, agent, tool, and resource authority; discovery grants nothing       | Audience/resource-bound tokens and workload attestation   |
| Delegation escalation             | Deny delegated scopes absent from the initiating persona                                                | Signed delegation/token-exchange claims and revocation    |
| Policy downgrade/tamper           | Schema validation, content hashes, exact policy/version binding                                         | Signed bundles, trusted distribution, rollback protection |
| Path escape                       | Host glob intersection plus server real-path/symlink checks and bounded writes                          | OS/container isolation, read-only mounts, egress controls |
| Network exfiltration              | Deny network-enabled sandbox requests; no network tool exists                                           | Enforced egress and credential isolation                  |
| Event-log mutation                | Hash-chained events expose accidental/local mutation                                                    | Append-only/WORM storage, signatures, trusted timestamps  |
| Browser impersonation             | Persona switching is labeled synthetic/local                                                            | Derive identity from an authenticated session             |

Tests exercise unauthorized personas, self-approval, expiry, TTL, replay, stale arguments, version changes, path escape, deny precedence, malformed schemas, process cleanup, and event-chain verification.
