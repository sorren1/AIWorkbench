import { useEffect, useState } from "react";

import { artifactsFor } from "../data/content";
import { issues } from "../data/fixtures";
import type { Artifact, Issue, Tone } from "../data/types";
import { useApp, useIssue } from "../state/store";
import { Icon } from "../../shared/Icon";
import {
  Badge,
  Btn,
  Card,
  CardHead,
  CodeView,
  EmptyState,
  IconBtn,
  Kv,
  MarkdownView,
  RiskBadge,
} from "../components/primitives";

/* ============================================================
   AI Delivery Workbench — Screen: Artifacts (split-pane review)
   ============================================================ */
const REVIEW_TONE: Record<string, Tone> = {
  Approved: "safe",
  "Review required": "warn",
  Pending: "warn",
  "Auto-recorded": "neutral",
  Recorded: "neutral",
  "Changes requested": "danger",
};

export function ArtifactsScreen() {
  const { state, actions } = useApp();
  const issue = useIssue(state.selectedKey);
  const artifacts = artifactsFor(issue);
  const selName = state.selectedArtifact[issue.key];
  const selected = artifacts.find((a) => a.name === selName) || artifacts[0];
  const [reviews, setReviews] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selected && selName !== selected.name) actions.selectArtifact(issue.key, selected.name);
  }, [actions, issue.key, selName, selected]);

  if (!artifacts.length) {
    return (
      <div className="wb-page wb-page-wide">
        <ArtifactsHead issue={issue} />
        <Card>
          <EmptyState
            icon="file-code"
            title="No artifacts generated yet"
            action={
              <Btn
                variant="primary"
                icon="arrow-right"
                onClick={() => actions.openIssue(issue.key)}
              >
                Open issue workflow
              </Btn>
            }
          >
            Run the AI delivery workflow on this issue to generate intake, spec, plan, change
            targets, and evidence artifacts.
          </EmptyState>
        </Card>
      </div>
    );
  }
  if (!selected) return null;

  const reviewState = (artifact: Artifact) => reviews[artifact.id] ?? artifact.reviewStatus;
  const approve = () => {
    setReviews((r) => ({ ...r, [selected.id]: "Approved" }));
    actions.toast("success", "Artifact approved", selected.name + " marked approved (simulated).");
  };
  const requestChanges = () => {
    setReviews((r) => ({ ...r, [selected.id]: "Changes requested" }));
    actions.toast(
      "warn",
      "Changes requested",
      "Reviewer decision recorded for " + selected.name + ".",
    );
  };

  return (
    <div className="wb-page wb-page-wide">
      <ArtifactsHead issue={issue} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "300px minmax(0,1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Left: artifact list */}
        <Card className="wb-card--flat" style={{ overflow: "hidden", position: "sticky", top: 0 }}>
          <div className="wb-card-head" style={{ padding: "12px 14px" }}>
            <div className="wb-card-title" style={{ fontSize: 13 }}>
              <Icon name="folder" size={15} className="wb-th-ico" />
              {artifacts.length} artifacts
            </div>
          </div>
          <div className="wb-card-body--tight">
            {artifacts.map((a) => {
              const isSel = selected && a.id === selected.id;
              const rs = reviewState(a);
              return (
                <div
                  key={a.id}
                  onClick={() => actions.selectArtifact(issue.key, a.name)}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "11px 14px",
                    cursor: "pointer",
                    borderBottom: "1px solid var(--border-subtle)",
                    background: isSel ? "var(--accent-soft)" : "transparent",
                    borderLeft: "2px solid " + (isSel ? "var(--accent)" : "transparent"),
                  }}
                >
                  <Icon
                    name={a.type === "JSON" ? "file-code" : "file-text"}
                    size={16}
                    style={{
                      color: isSel ? "var(--accent)" : "var(--text-tertiary)",
                      marginTop: 1,
                      flex: "none",
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      className="wb-mono"
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: isSel ? "var(--accent-text)" : "var(--text-primary)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.name}
                    </div>
                    <div className="wb-flex" style={{ gap: 6, marginTop: 4 }}>
                      <span className="wb-muted" style={{ fontSize: 10.5 }}>
                        {a.stage}
                      </span>
                      <span
                        className="wb-badge-dot"
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background:
                            "var(--" +
                            (REVIEW_TONE[rs] === "safe"
                              ? "safe"
                              : REVIEW_TONE[rs] === "danger"
                                ? "danger"
                                : REVIEW_TONE[rs] === "warn"
                                  ? "warn"
                                  : "border-strong") +
                            ")",
                        }}
                      />
                      <span className="wb-muted" style={{ fontSize: 10.5 }}>
                        {rs}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Right: preview + metadata */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0,1fr) 240px",
            gap: 16,
            alignItems: "start",
          }}
        >
          <Card className="wb-card--flat" style={{ overflow: "hidden" }}>
            <div className="wb-code-head" style={{ position: "static", borderRadius: 0 }}>
              <Icon
                name={selected.type === "JSON" ? "file-code" : "file-text"}
                size={15}
                className="wb-muted"
              />
              <span className="wb-code-name wb-strong">{selected.name}</span>
              <Badge tone="neutral">{selected.type}</Badge>
              <div className="wb-spacer" style={{ marginLeft: "auto" }} />
              <IconBtn
                icon="copy"
                size="sm"
                title="Copy (simulated)"
                onClick={() =>
                  actions.toast("info", "Copied to clipboard", selected.name + " (simulated).")
                }
              />
              <IconBtn
                icon="download"
                size="sm"
                title="Download (simulated)"
                onClick={() =>
                  actions.toast("info", "Download started", selected.name + " (simulated).")
                }
                style={{ marginLeft: 6 }}
              />
            </div>
            <div
              style={{ maxHeight: "calc(100vh - 220px)", overflow: "auto" }}
              className="cr-scroll"
            >
              {selected.lang === "json" ? (
                <div
                  className="wb-code"
                  style={{ border: "none", borderRadius: 0, background: "var(--bg-inset)" }}
                >
                  <CodeView name={selected.name} lang="json" body={selected.body} />
                </div>
              ) : (
                <div style={{ padding: "18px 22px" }}>
                  <MarkdownView body={selected.body} />
                </div>
              )}
            </div>
          </Card>

          {/* Metadata + review */}
          <div className="wb-stack" style={{ position: "sticky", top: 0 }}>
            <Card>
              <CardHead icon="info" title="Metadata" />
              <div className="wb-card-body">
                <Kv
                  rows={[
                    ["Type", selected.type],
                    ["Stage", selected.stage],
                    ["Generated", <span className="wb-mono wb-text-sm">{selected.timestamp}</span>],
                    ["Risk", <RiskBadge risk={selected.risk} />],
                  ]}
                />
              </div>
            </Card>
            <Card>
              <CardHead icon="user" title="Reviewer" />
              <div className="wb-card-body wb-stack-sm">
                <div className="wb-between">
                  <span className="wb-text-sm wb-secondary">Status</span>
                  <Badge
                    tone={REVIEW_TONE[reviewState(selected)] || "neutral"}
                    icon={
                      reviewState(selected) === "Approved"
                        ? "check"
                        : reviewState(selected) === "Changes requested"
                          ? "x"
                          : "clock"
                    }
                  >
                    {reviewState(selected)}
                  </Badge>
                </div>
                <p className="wb-text-sm wb-muted" style={{ lineHeight: 1.5 }}>
                  {selected.name === "change-targets.json"
                    ? "Verify the file allow-list matches the diff before approving."
                    : "Deterministic artifact — review for correctness and scope."}
                </p>
                <Btn
                  size="sm"
                  variant="primary"
                  icon="check"
                  className="wb-btn--block"
                  onClick={approve}
                >
                  Approve artifact
                </Btn>
                <Btn
                  size="sm"
                  variant="secondary"
                  icon="rotate-ccw"
                  className="wb-btn--block"
                  onClick={requestChanges}
                >
                  Request changes
                </Btn>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArtifactsHead({ issue }: { readonly issue: Issue }) {
  const { actions } = useApp();
  return (
    <div className="wb-page-head">
      <div>
        <div className="eyebrow wb-mb-8">
          <Icon name="file-code" size={13} /> Reviewable AI output
        </div>
        <div className="wb-page-title">Artifacts</div>
        <div className="wb-page-desc">
          Deterministic synthetic artifacts show how AI output can become reviewable and traceable
          instead of remaining an opaque suggestion. Review decisions update local state only.
        </div>
      </div>
      <div className="wb-spacer" />
      <div className="wb-flex" style={{ gap: 8 }}>
        <span className="wb-text-sm wb-muted">Issue</span>
        <div className="wb-select" style={{ width: 230 }}>
          <select value={issue.key} onChange={(e) => actions.navigate("artifacts", e.target.value)}>
            {issues.map((item) => (
              <option key={item.key} value={item.key}>
                {item.key} · {item.title}
              </option>
            ))}
          </select>
          <Icon name="chevrons-up-down" size={15} className="wb-select-ico" />
        </div>
      </div>
    </div>
  );
}
