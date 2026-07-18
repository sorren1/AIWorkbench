# Authorization and separation of duties

## Claim boundary

The repository contains a functional local authorization model. The browser and local sandbox CLI call the same pure policy evaluator in `src/demo/authorization/engine.ts`. Personas, delegated identity envelopes, scopes, and decisions are deterministic synthetic records. They are not authenticated users, OAuth tokens, production service identities, or evidence of a deployed identity platform.

The public browser makes no external authorization request. The CLI creates only gitignored local run records and operates on the checked-in synthetic toy repository.

## Scope vocabulary

The closed local vocabulary is:

- `issue:read`
- `artifact:read`
- `artifact:write`
- `registry:read`
- `registry:manage`
- `tool:invoke`
- `sandbox:execute`
- `diff:review`
- `validation:approve`
- `policy:manage`
- `evidence:read`

Unknown descriptor scopes fail closed. A scope permits evaluation; it never bypasses registry lifecycle, stage, policy, or resource-boundary checks.

## Synthetic personas

| Persona                      | Intended authority                                                                     | Explicit prohibition                                               |
| ---------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Author / Implementer         | Read issue/context, write approved targets, invoke bounded tools, run fixed validation | Cannot review or approve its own implementation                    |
| Code Reviewer                | Read artifacts/evidence and record diff review                                         | Has no `artifact:write` or `validation:approve` scope              |
| Validator / Release Approver | Read evidence, run bounded validation, decide release readiness                        | Is distinct from the implementation author                         |
| Platform Administrator       | Manage registry and policy configuration                                               | Has no `tool:invoke`, `diff:review`, or `validation:approve` scope |
| Auditor                      | Read issues, artifacts, registry, and evidence                                         | Has no mutation or tool-invocation scope                           |

The Review Assistant is an approved stage agent, not a human persona. It can summarize or flag risk but is absent from the approver-persona vocabulary and cannot record a human decision.

## Effective permission intersection

For every governed action, the engine intersects:

1. scopes owned by the initiating synthetic persona;
2. scopes granted in the delegated identity envelope and every delegation link;
3. the stage's allowed scope set;
4. the approved agent card's stage, tool, and write declarations;
5. the approved tool descriptor's scopes, stage, risk, and filesystem boundary;
6. the approved change-target set and matched versioned policy.

Any delegation scope absent from the human persona is an escalation attempt and is denied. A bounded write must declare at least one canonical target, and every target must fit all three path sets: agent write paths, tool write paths, and current change targets. Canonical targets use normalized relative POSIX paths or the explicitly modeled URI form; empty values, absolute paths, backslashes, dot/traversal segments, duplicate separators, control characters, percent encoding, queries, and fragments fail closed. A policy matcher with `pathPatterns` cannot match an empty or noncanonical target list. Deny rules take precedence over approval, notification, and allow rules. No matching enabled policy means deny.

## Delegated identity envelope

Every governed browser or CLI action records the initiating human persona, effective subject, executing agent ID/version/hash, granted scopes and delegation chain, run/session IDs, expiry, and policy decision ID.

This envelope demonstrates an on-behalf-of contract without claiming token exchange. In production, an API gateway or workload-identity broker would validate a human OIDC access token, exchange or down-scope it using OAuth 2.0 token-exchange/on-behalf-of semantics, bind a workload identity to the approved agent version, place immutable subject/delegation claims in the authorization request, and issue short-lived resource-specific credentials. The local envelope would become a validated claim projection; browser-controlled persona selection would disappear.

## Separation rules

- Implementation authors cannot approve the same patch request.
- Code reviewers cannot write implementation artifacts while acting as reviewers.
- Release readiness requires `synthetic-validator` plus `validation:approve` and a reason.
- Platform administrators can change configuration but cannot silently approve release readiness.
- Auditors remain read-only.
- AI agents never appear in `requiredApproverPersonas`.

Tests cover scope intersection, delegation escalation, deny precedence, canonical path globs, empty/malformed/traversing/mismatched bounded-write targets, administrator restrictions, reviewer/validator separation, and the absence of an AI approver identity. The MCP integration test also verifies that invalid targets produce neither an approval pause nor a repository diff.
