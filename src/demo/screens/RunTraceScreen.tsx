import type { NormalizedTraceArtifact } from "../../../tools/local-sandbox/telemetry";
import { recordedRunTrace } from "../observability/generated";
import { useApp } from "../state/store";
import { Badge, Banner, Btn, Card, CardHead, Progress } from "../components/primitives";

type TraceSpan = NormalizedTraceArtifact["spans"][number];

function shortHash(value: string): string {
  return `${value.slice(0, 12)}...${value.slice(-8)}`;
}

function spanDepth(span: TraceSpan, spans: readonly TraceSpan[]): number {
  const byId = new Map(spans.map((candidate) => [candidate.spanId, candidate]));
  let depth = 0;
  let parentId = span.parentSpanId;
  const visited = new Set<string>();
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    depth += 1;
    parentId = byId.get(parentId)?.parentSpanId ?? null;
  }
  return depth;
}

function statusTone(status: TraceSpan["status"]): "safe" | "danger" | "neutral" {
  if (status === "ERROR") return "danger";
  if (status === "OK") return "safe";
  return "neutral";
}

function labelSpan(span: TraceSpan): string {
  const category = span.attributes["delivery.command.category"];
  const tool = span.attributes["delivery.tool.id"];
  if (typeof category === "string") return `${span.name} | ${category}`;
  if (typeof tool === "string") return `${span.name} | ${tool}`;
  return span.name;
}

function SpanDetails({ span }: { readonly span: TraceSpan }) {
  const attributes = Object.entries(span.attributes);
  return (
    <details className="wb-trace-details">
      <summary>Inspect safe span attributes</summary>
      <dl className="wb-trace-attributes">
        {attributes.map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{Array.isArray(value) ? value.join(", ") : String(value)}</dd>
          </div>
        ))}
      </dl>
      {span.events.length > 0 && (
        <div className="wb-trace-events">
          <h3>Events</h3>
          <ul>
            {span.events.map((event) => (
              <li key={`${event.timestamp}-${event.name}`}>
                <code>{event.name}</code> | {event.timestamp}
              </li>
            ))}
          </ul>
        </div>
      )}
    </details>
  );
}

export function RunTraceScreen() {
  const { actions } = useApp();
  if (!recordedRunTrace) {
    return (
      <div>
        <div className="wb-page-head">
          <div>
            <p className="eyebrow">Recorded local evidence</p>
            <h1 className="wb-page-title">Run Trace</h1>
          </div>
        </div>
        <Banner tone="warn" icon="alert-triangle">
          No validated checked-in trace is available. The public browser never connects to a live
          telemetry backend.
        </Banner>
      </div>
    );
  }

  const { trace, evidence } = recordedRunTrace;
  const root = trace.spans.find((span) => span.parentSpanId === null);
  const start = root ? new Date(root.startedAt).getTime() : 0;
  const totalDuration = Math.max(trace.summary.totalDurationMs, 1);

  const openArtifact = (name: string) => {
    if (name === "context-pack.json") {
      actions.navigate("issue", "FIN-1150");
      return;
    }
    actions.selectArtifact("FIN-1150", name);
    actions.navigate("artifacts", "FIN-1150");
  };

  return (
    <div>
      <div className="wb-page-head">
        <div>
          <p className="eyebrow">Recorded real local execution | synthetic toy repository</p>
          <h1 className="wb-page-title">Run Trace</h1>
          <p className="wb-page-sub">
            One OpenTelemetry-compatible trace, rendered from checked-in validated JSON. No live
            collector, sandbox, or telemetry service is contacted by this screen.
          </p>
        </div>
        <Badge tone={evidence.status === "SUCCEEDED" ? "safe" : "danger"} icon="clock">
          {evidence.status}
        </Badge>
      </div>

      <Banner tone="neutral" icon="info">
        Trace attributes contain identifiers, versions, hashes, categories, counts, durations, and
        outcomes only. Prompt bodies, source code, raw command input, secrets, credentials, and
        personal data are excluded.
      </Banner>

      <div className="wb-grid wb-grid-4 wb-mt-16">
        <Card className="wb-stat">
          <div className="wb-stat-label">Measured duration</div>
          <div className="wb-stat-value">{Math.round(trace.summary.totalDurationMs)} ms</div>
          <div className="wb-stat-meta">Wall-clock trace root</div>
        </Card>
        <Card className="wb-stat">
          <div className="wb-stat-label">Tool calls</div>
          <div className="wb-stat-value">{trace.summary.toolCallCount}</div>
          <div className="wb-stat-meta">Exact controller count</div>
        </Card>
        <Card className="wb-stat">
          <div className="wb-stat-label">Repair attempts</div>
          <div className="wb-stat-value">{trace.summary.repairAttempts}</div>
          <div className="wb-stat-meta">Exact deterministic attempts</div>
        </Card>
        <Card className="wb-stat">
          <div className="wb-stat-label">Model cost</div>
          <div className="wb-stat-value">$0</div>
          <div className="wb-stat-meta">Exact zero | no model used</div>
        </Card>
      </div>

      <Card className="wb-mt-16">
        <CardHead
          icon="clock"
          title="Execution waterfall"
          sub={`${trace.summary.spanCount} nested spans | ${trace.summary.failedSpanCount} failed`}
        />
        <div
          className="wb-table-wrap"
          role="region"
          aria-label="Recorded execution trace waterfall"
          tabIndex={0}
        >
          <table className="wb-table wb-trace-table">
            <caption className="wb-sr-only">
              OpenTelemetry-compatible spans with hierarchy, status, measured duration, and safe
              details.
            </caption>
            <thead>
              <tr>
                <th scope="col">Operation</th>
                <th scope="col">Status</th>
                <th scope="col">Duration</th>
                <th scope="col">Waterfall</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {trace.spans.map((span) => {
                const offset = Math.max(0, new Date(span.startedAt).getTime() - start);
                const left = Math.min(96, (offset / totalDuration) * 100);
                const width = Math.max(
                  1.5,
                  Math.min(100 - left, (span.durationMs / totalDuration) * 100),
                );
                return (
                  <tr key={span.spanId}>
                    <th scope="row">
                      <span
                        className="wb-trace-operation"
                        style={{ paddingInlineStart: `${spanDepth(span, trace.spans) * 18}px` }}
                      >
                        {labelSpan(span)}
                      </span>
                    </th>
                    <td>
                      <Badge tone={statusTone(span.status)}>{span.status}</Badge>
                    </td>
                    <td className="wb-mono">{span.durationMs.toFixed(1)} ms</td>
                    <td>
                      <div className="wb-trace-waterfall" aria-hidden="true">
                        <span
                          className={`wb-trace-bar wb-trace-bar--${span.status.toLowerCase()}`}
                          style={{ marginInlineStart: `${left}%`, width: `${width}%` }}
                        />
                      </div>
                    </td>
                    <td>
                      <SpanDetails span={span} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="wb-grid wb-grid-2 wb-mt-16">
        <Card>
          <CardHead
            icon="cpu"
            title="Execution budgets"
            sub={`${evidence.budget.policy.id} | v${evidence.budget.policy.version}`}
            actions={
              <Badge tone={evidence.budget.outcome === "STOPPED" ? "danger" : "warn"}>
                {evidence.budget.outcome}
              </Badge>
            }
          />
          <div className="wb-card-body wb-trace-budget-list">
            {evidence.budget.dimensions.map((item) => {
              const percentage =
                item.limit === null
                  ? 0
                  : item.limit === 0
                    ? 100
                    : (item.observed / item.limit) * 100;
              return (
                <div key={item.dimension}>
                  <div className="wb-flex wb-between">
                    <strong>{item.dimension.replaceAll("_", " ").toLowerCase()}</strong>
                    <span className="wb-mono">
                      {item.limit === null
                        ? `${item.observed} | no limit configured`
                        : `${item.observed} / ${item.limit}`}{" "}
                      | {item.measurement.toLowerCase()}
                    </span>
                  </div>
                  {item.limit === null ? (
                    <Badge tone="neutral">Optional limit not configured</Badge>
                  ) : (
                    <Progress
                      value={percentage}
                      tone={
                        item.status === "EXCEEDED"
                          ? "danger"
                          : item.status === "APPROACHING"
                            ? "warn"
                            : "safe"
                      }
                      label={`${item.dimension} budget use`}
                      valueText={`${item.observed} of ${item.limit}, ${item.status.toLowerCase()}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        <Card>
          <CardHead
            icon="link"
            title="Evidence bindings"
            sub="Trace, governance, and tested tree"
          />
          <dl className="wb-kv wb-trace-bindings">
            <dt>Trace ID</dt>
            <dd>
              <code>{trace.traceId}</code>
            </dd>
            <dt>Trace SHA-256</dt>
            <dd>
              <code title={evidence.traceArtifactSha256}>
                {shortHash(evidence.traceArtifactSha256)}
              </code>
            </dd>
            <dt>Evidence SHA-256</dt>
            <dd>
              <code title={evidence.evidenceDigest}>{shortHash(evidence.evidenceDigest)}</code>
            </dd>
            <dt>Source commit</dt>
            <dd>
              <code>{evidence.sourceCommit.slice(0, 12)}</code> |{" "}
              {evidence.sourceWorkingTree.toLowerCase()}
            </dd>
            <dt>Tested tree</dt>
            <dd>
              <code title={evidence.testedRepositoryTreeDigest ?? undefined}>
                {evidence.testedRepositoryTreeDigest
                  ? shortHash(evidence.testedRepositoryTreeDigest)
                  : "Unavailable"}
              </code>
            </dd>
            <dt>Context pack</dt>
            <dd>
              <code title={trace.bindings.contextPackDigest}>
                {shortHash(trace.bindings.contextPackDigest)}
              </code>
            </dd>
            <dt>Approval</dt>
            <dd>
              {evidence.approval.outcome.replaceAll("_", " ").toLowerCase()} |{" "}
              {evidence.approval.waitDurationMs.toFixed(3)} ms measured
            </dd>
          </dl>
        </Card>
      </div>

      <Card className="wb-mt-16">
        <CardHead
          icon="file-text"
          title="Related governed artifacts"
          sub="Open the equivalent synthetic demo artifact or Context Manifest"
        />
        <div className="wb-card-body wb-flex wb-wrap wb-gap-8">
          {trace.relatedArtifacts.map((artifact) => (
            <Btn
              key={artifact.name}
              size="sm"
              variant="secondary"
              onClick={() => openArtifact(artifact.name)}
            >
              {artifact.name === "context-pack.json" ? "Context Manifest" : artifact.name}
            </Btn>
          ))}
        </div>
      </Card>
    </div>
  );
}
