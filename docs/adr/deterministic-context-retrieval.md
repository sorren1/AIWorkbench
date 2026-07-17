# ADR: Use deterministic context retrieval by default

- Status: Accepted
- Date: 2026-07-17
- Decision owners: repository maintainers

## Context

The portfolio thesis requires a reviewer to explain why each context record reached a coding stage. A semantic or vector search can be valuable in a larger corpus, but ranking depends on an embedding model, index revision, chunking, filters, scores, and often nondeterministic provider behavior. None of those systems exists in this static public prototype. Claiming semantic retrieval would make replay and evidence weaker rather than stronger.

## Decision

Use a repository-owned deterministic selector as the only executable default. It applies versioned tag, stage, sensitivity, persona, agent, delegated-scope, freshness, record-type, source-type, recency, priority, episodic-permission, and budget rules. It records every candidate and reason, uses stable ordering, and hashes the full canonical pack.

Keep an adapter seam for future candidate retrieval. A semantic adapter is optional and not implemented. If added, it must:

- identify the embedding model, index, chunking, query, filter, and adapter versions;
- return versioned `ContextRecord` candidates rather than ungoverned prompt text;
- preserve the deterministic authorization, revocation, freshness, and budget filter as the authoritative final gate;
- record ranking evidence sufficient to investigate and, where the provider allows, replay a selection;
- fail closed when its evidence or index binding is unavailable;
- remain opt-in per approved policy rather than silently changing existing stages.

## Consequences

- Current packs are reproducible from repository fixtures and exact policy/agent versions.
- Reviewers see ordinary rule evidence rather than an unexplained relevance score.
- The public demo makes no vector-search or semantic-retrieval claim.
- Exact replay is achievable for the current selector; a future semantic proposal may be only reproducible within the guarantees of its pinned provider/index and must say so.
- Deterministic tags require curation and do not discover synonyms or latent relationships in a large corpus. That is an accepted initial-release tradeoff.

## Alternatives considered

1. **Vector search in the browser** — rejected because it adds model/index weight, unclear freshness, and no relevant public corpus.
2. **Simulated relevance scores** — rejected because decorative scores would be fabricated evidence.
3. **Unbounded prior chat history** — rejected because it is difficult to authorize, expire, inspect, or keep free of secrets.
4. **No extension seam** — rejected because a production corpus may justify semantic candidate generation behind the same policy boundary.
