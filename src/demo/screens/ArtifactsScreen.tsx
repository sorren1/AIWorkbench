import { useEffect } from "react";

import { artifactsFor } from "../data/content";
import { issues } from "../data/fixtures";
import type { Artifact, Issue, Tone } from "../data/types";
import { useApp, useIssue } from "../state/store";
import { Icon } from "../../shared/Icon";
import { artifactDownloadSpec, copyText, downloadTextFile } from "../utils/browserActions";
import { useContextPacks } from "../context/useContextPacks";
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
  const { packs: contextPacks, error: contextError } = useContextPacks(issue.key);
  const contextPackDigests = new Map(
    [...contextPacks].map(([stageId, pack]) => [stageId, pack.packDigest] as const),
  );
  const artifacts = artifactsFor(issue, contextPackDigests);
  const selName = state.selectedArtifact[issue.key];
  const selected = artifacts.find((a) => a.name === selName) || artifacts[0];

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
            Simulate the AI delivery workflow on this issue to generate synthetic intake, spec,
            plan, change-target, and evidence artifacts locally.
          </EmptyState>
        </Card>
      </div>
    );
  }
  if (!selected) return null;

  const reviewState = (artifact: Artifact) =>
    state.artifactReviews[artifact.id] ?? artifact.reviewStatus;
  const approve = () => {
    actions.setArtifactReview(selected.id, "Approved");
    actions.toast(
      "success",
      "Demo artifact approved",
      selected.name + " marked approved in browser-local state.",
    );
  };
  const requestChanges = () => {
    actions.setArtifactReview(selected.id, "Changes requested");
    actions.toast(
      "warn",
      "Changes requested",
      "Synthetic reviewer decision recorded locally for " + selected.name + ".",
    );
  };
  const copyArtifact = async () => {
    try {
      await copyText(selected.body);
      actions.toast(
        "success",
        "Artifact copied",
        selected.name + " contents copied to the clipboard.",
      );
    } catch (error) {
      actions.toast(
        "error",
        "Copy failed",
        error instanceof Error ? error.message : "The browser rejected the clipboard operation.",
      );
    }
  };
  const downloadArtifact = () => {
    try {
      const spec = artifactDownloadSpec(issue.key, selected);
      downloadTextFile(spec);
      actions.toast("success", "Artifact downloaded", spec.filename + " saved locally.");
    } catch (error) {
      actions.toast(
        "error",
        "Download failed",
        error instanceof Error ? error.message : "The browser rejected the download operation.",
      );
    }
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
            <h2 className="wb-card-title" style={{ fontSize: 13 }}>
              <Icon name="folder" size={15} className="wb-th-ico" />
              {artifacts.length} artifacts
            </h2>
          </div>
          <div className="wb-card-body--tight">
            {artifacts.map((a) => {
              const isSel = a.id === selected.id;
              const rs = reviewState(a);
              return (
                <button
                  type="button"
                  key={a.id}
                  className="wb-artifact-option"
                  aria-pressed={isSel}
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
                  <span style={{ minWidth: 0, flex: 1 }}>
                    <span
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
                    </span>
                    <span className="wb-flex" style={{ gap: 6, marginTop: 4 }}>
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
                    </span>
                  </span>
                </button>
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
                title="Copy artifact contents"
                onClick={() => void copyArtifact()}
              />
              <IconBtn
                icon="download"
                size="sm"
                title="Download synthetic artifact"
                onClick={downloadArtifact}
                style={{ marginLeft: 6 }}
              />
            </div>
            <div
              style={{ maxHeight: "calc(100vh - 220px)", overflow: "auto" }}
              className="cr-scroll"
              role="region"
              aria-label={`${selected.name} preview`}
              tabIndex={0}
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
                    [
                      "Context pack",
                      selected.contextPackDigest ? (
                        <span className="wb-mono wb-text-sm" title={selected.contextPackDigest}>
                          {selected.contextPackDigest.slice(0, 12)}…
                        </span>
                      ) : (
                        <Badge tone="warn">Binding pending</Badge>
                      ),
                    ],
                  ]}
                />
                {contextError && <p className="wb-text-sm wb-danger">{contextError}</p>}
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
                  Mark demo artifact approved
                </Btn>
                <Btn
                  size="sm"
                  variant="secondary"
                  icon="rotate-ccw"
                  className="wb-btn--block"
                  onClick={requestChanges}
                >
                  Record demo changes requested
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
        <h1 className="wb-page-title">Artifacts</h1>
        <div className="wb-page-desc">
          Deterministic synthetic artifacts show how AI output can become reviewable and traceable
          instead of remaining an opaque suggestion. Review decisions update local state only.
        </div>
      </div>
      <div className="wb-spacer" />
      <div className="wb-flex wb-inline-field" style={{ gap: 8 }}>
        <label className="wb-text-sm wb-muted" htmlFor="artifacts-issue-select">
          Issue
        </label>
        <div className="wb-select" style={{ width: 230 }}>
          <select
            id="artifacts-issue-select"
            value={issue.key}
            onChange={(e) => actions.navigate("artifacts", e.target.value)}
          >
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
