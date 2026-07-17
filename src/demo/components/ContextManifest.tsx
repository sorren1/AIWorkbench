import type { ContextPack } from "../context/contracts";
import { Badge, Banner, Btn } from "./primitives";

function shortDigest(value: string): string {
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

export function ContextManifest({
  pack,
  invalidatedByDigest,
  onRevise,
}: {
  readonly pack: ContextPack;
  readonly invalidatedByDigest: string | undefined;
  readonly onRevise: () => void;
}) {
  return (
    <section className="wb-context-manifest" aria-labelledby={`context-title-${pack.stageId}`}>
      <div className="wb-between wb-wrap" style={{ gap: 8 }}>
        <div>
          <h3 id={`context-title-${pack.stageId}`}>Context Manifest</h3>
          <p className="wb-muted wb-text-sm">
            Deterministic selection · policy {pack.memoryPolicy.id} v{pack.memoryPolicy.version} ·{" "}
            <code title={pack.memoryPolicy.contentHash}>
              sha256:{pack.memoryPolicy.contentHash.slice(0, 10)}…
            </code>
          </p>
          <p className="wb-muted" style={{ fontSize: 11.5 }}>
            {pack.agentCard ? (
              <>
                Agent {pack.agentCard.id}@{pack.agentCard.version} ·{" "}
                <code title={pack.agentCard.contentHash}>
                  sha256:{pack.agentCard.contentHash.slice(0, 10)}…
                </code>
              </>
            ) : (
              "Human-selected Seed stage · no agent card applies"
            )}
          </p>
        </div>
        <Badge tone={invalidatedByDigest ? "warn" : "safe"} icon="shield-check">
          {invalidatedByDigest ? "Stale binding" : "Digest bound"}
        </Badge>
      </div>

      {invalidatedByDigest && (
        <Banner tone="warn" title="A selected context record changed">
          The bound pack <code>{shortDigest(pack.packDigest)}</code> no longer matches candidate
          pack <code>{shortDigest(invalidatedByDigest)}</code>. This stage and its dependents
          require a new run.
        </Banner>
      )}

      <dl className="wb-context-summary">
        <div>
          <dt>Included</dt>
          <dd>{pack.includedRecords.length} records</dd>
        </div>
        <div>
          <dt>Excluded</dt>
          <dd>{pack.excludedRecords.length} candidates</dd>
        </div>
        <div>
          <dt>Estimate</dt>
          <dd>
            {pack.estimate.estimatedTokens} tokens · {pack.estimate.characters} characters
          </dd>
        </div>
        <div>
          <dt>Digest</dt>
          <dd>
            <code title={pack.packDigest}>{shortDigest(pack.packDigest)}</code>
          </dd>
        </div>
      </dl>
      <p className="wb-muted" style={{ fontSize: 11.5 }}>
        Token count is an honest estimate: ceiling(characters ÷ 4). It is not provider-measured
        usage. Pack created {pack.createdAt}.
      </p>

      <details open className="wb-context-records">
        <summary>Included records and selection reasons</summary>
        <ul>
          {pack.includedRecords.map(({ record, reason, freshness, estimatedTokens }) => (
            <li key={record.id}>
              <div className="wb-between wb-wrap" style={{ gap: 6 }}>
                <strong>{record.title}</strong>
                <Badge tone="safe">{freshness.status}</Badge>
              </div>
              <p>{reason}</p>
              <p className="wb-muted">
                {record.recordType} · {estimatedTokens} estimated tokens · {record.source.type} ·{" "}
                <code>{record.source.reference}</code>
                {record.source.sourceCommit ? ` · commit ${record.source.sourceCommit}` : ""} ·{" "}
                <code title={record.contentHash}>sha256:{record.contentHash.slice(0, 10)}…</code> ·{" "}
                {freshness.ageSeconds}s old · TTL{" "}
                {freshness.effectiveTtlSeconds === null
                  ? "none"
                  : `${freshness.effectiveTtlSeconds}s`}
              </p>
            </li>
          ))}
        </ul>
      </details>

      <details className="wb-context-records">
        <summary>Excluded candidates and rationale</summary>
        <ul>
          {pack.excludedRecords.map(({ record, reason, reasonCode, freshness }) => (
            <li key={record.id}>
              <div className="wb-between wb-wrap" style={{ gap: 6 }}>
                <strong>{record.title}</strong>
                <Badge tone={freshness.status === "FRESH" ? "neutral" : "warn"}>{reasonCode}</Badge>
              </div>
              <p>{reason}</p>
              <p className="wb-muted">
                Freshness: {freshness.status} · age {freshness.ageSeconds}s · source{" "}
                <code>{record.source.reference}</code> ·{" "}
                <code title={record.contentHash}>sha256:{record.contentHash.slice(0, 10)}…</code>
              </p>
            </li>
          ))}
        </ul>
      </details>

      {pack.truncation.occurred && (
        <p className="wb-text-sm">
          <strong>Budget enforcement:</strong> {pack.truncation.reason}
        </p>
      )}

      <Btn size="sm" variant="secondary" icon="refresh-cw" onClick={onRevise}>
        Simulate selected context revision
      </Btn>
    </section>
  );
}
