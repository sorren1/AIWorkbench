import { prFor } from "../data/content";
import { issues } from "../data/fixtures";
import type { Issue, PullRequestFile, Tone } from "../data/types";
import { useApp, useIssue } from "../state/store";
import { Icon, type IconName } from "../../shared/Icon";
import {
  Avatar,
  Badge,
  Banner,
  Btn,
  Card,
  CardHead,
  Check,
  EmptyState,
} from "../components/primitives";

/* ============================================================
   AI Delivery Workbench — Screen: GitHub / PR readiness
   ============================================================ */
const CHECK_VIS: Record<string, { tone: Tone; icon: IconName; label: string }> = {
  pass: { tone: "safe", icon: "check-circle", label: "Passed" },
  fail: { tone: "danger", icon: "x-circle", label: "Failed" },
  pending: { tone: "warn", icon: "clock", label: "Pending" },
  required: { tone: "warn", icon: "alert-triangle", label: "Required" },
};
const CAT_ICON: Record<string, IconName> = {
  "Angular UI": "box",
  "C#/.NET API": "cpu",
  "Oracle SQL": "database",
  Tests: "flask",
  "Documentation / evidence": "file-text",
};

export function GitHubScreen() {
  const { state, actions } = useApp();
  const issue = useIssue(state.selectedKey);
  const base = prFor(issue);
  const ov = state.prState[issue.key] || {};
  const hasPR = !!issue.pr;

  const createMockPR = () => {
    actions.patchIssue(issue.key, { pr: 284, prStatus: "Draft", flags: { hasPR: true } });
    actions.toast(
      "success",
      "Mock PR created",
      "Synthetic PR #284 recorded on " + issue.branch + " in local state.",
    );
  };
  const refresh = () =>
    actions.toast("info", "PR status refreshed", "Checks re-read from the simulated provider.");
  const markReviewed = () => {
    actions.setPR(issue.key, { diffReviewed: true, checklistAll: true });
    actions.toast(
      "success",
      "Diff marked reviewed",
      "Changed-file review recorded against PR #" + base.number + ".",
    );
  };
  const requestChanges = () => {
    actions.setPR(issue.key, { status: "Changes requested", reviewer: "changes" });
    actions.patchIssue(issue.key, { prStatus: "Changes requested" });
    actions.toast(
      "warn",
      "Changes requested",
      "Synthetic reviewer decision and notification state recorded locally.",
    );
  };
  /* excerpt:start:human-approval-gate */
  const approveForValidation = () => {
    if (!ov.diffReviewed) {
      actions.toast(
        "warn",
        "Review the diff first",
        "Mark the changed-file diff reviewed before approving for validation.",
      );
      return;
    }
    actions.setPR(issue.key, {
      status: "Approved — validation",
      reviewer: "approved",
      approvedForValidation: true,
    });
    actions.patchIssue(issue.key, { prStatus: "Ready for review" });
    actions.toast(
      "success",
      "Approved for validation",
      "Human review gate met. Routing to validation evidence.",
    );
    window.setTimeout(() => actions.navigate("validation", issue.key), 700);
  };
  /* excerpt:end:human-approval-gate */

  if (!hasPR) {
    return (
      <div className="wb-page wb-page-wide">
        <GitHubHead issue={issue} />
        <Card>
          <EmptyState
            icon="git-pull-request"
            title="No pull request yet"
            action={
              <Btn variant="primary" icon="plus" onClick={createMockPR}>
                Create mock PR
              </Btn>
            }
          >
            This issue hasn't reached a pull request. Run the workflow through{" "}
            <strong>Implement</strong>, then create a mock PR to start the human review gate. PRs
            keep AI-assisted changes inside normal engineering controls.
          </EmptyState>
        </Card>
      </div>
    );
  }

  const status = ov.status || base.status;
  const reviewerState = ov.reviewer || "pending";
  const checklist = base.checklist.map((c) => ({ ...c, done: ov.checklistAll ? true : c.done }));
  const checksOpen = base.checks.filter((c) => c.status !== "pass").length;
  const groups: Record<string, PullRequestFile[]> = {};
  base.files.forEach((file) => {
    const category = groups[file.category] ?? [];
    category.push(file);
    groups[file.category] = category;
  });
  const reviewMet = reviewerState === "approved";
  const validationMet = false; // final validation gate intentionally still required

  const gates = [
    {
      label: "Required checks",
      met: checksOpen === 0,
      detail: checksOpen === 0 ? "all passed" : checksOpen + " open",
    },
    {
      label: "Changed-file review",
      met: !!ov.diffReviewed,
      detail: ov.diffReviewed ? "reviewed" : "not reviewed",
    },
    { label: "Human review gate", met: reviewMet, detail: reviewMet ? "approved" : "pending" },
    { label: "Final validation", met: validationMet, detail: "required before merge" },
  ];
  const mergeReady = gates.every((g) => g.met);

  return (
    <div className="wb-page wb-page-wide">
      <GitHubHead issue={issue} />
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.7fr) minmax(0,1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        {/* Left */}
        <div className="wb-stack">
          <Card>
            <div className="wb-card-body">
              <div className="wb-between wb-wrap" style={{ gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  <div className="wb-flex" style={{ gap: 10 }}>
                    <span className="wb-row-key" style={{ fontSize: 14 }}>
                      Synthetic PR #{base.number}
                    </span>
                    <Badge
                      tone={
                        status.startsWith("Approved")
                          ? "safe"
                          : status === "Changes requested"
                            ? "danger"
                            : status === "Draft"
                              ? "neutral"
                              : "accent"
                      }
                      dot
                    >
                      {status}
                    </Badge>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>{base.title}</div>
                  <div className="wb-flex wb-wrap wb-mt-8" style={{ gap: 14, fontSize: 12 }}>
                    <span className="wb-mono wb-muted">
                      <Icon name="git-branch" size={12} /> {base.branch}
                    </span>
                    <span className="wb-muted">
                      <Icon name="arrow-right" size={12} />{" "}
                      <span className="wb-mono">{base.target}</span>
                    </span>
                    <span className="wb-muted">
                      <Icon name="git-commit" size={12} /> {base.commits} commits
                    </span>
                    <span className="wb-muted">
                      <Icon name="user" size={12} /> {base.author}
                    </span>
                    <span className="wb-muted">
                      <Icon name="clock" size={12} /> {base.created}
                    </span>
                  </div>
                </div>
              </div>
              <hr className="wb-divider" />
              <div className="wb-flex wb-wrap" style={{ gap: 8 }}>
                <Btn size="sm" variant="secondary" icon="refresh-cw" onClick={refresh}>
                  Refresh PR status (simulated)
                </Btn>
                <Btn
                  size="sm"
                  variant={ov.diffReviewed ? "secondary" : "primary"}
                  icon={ov.diffReviewed ? "check" : "eye"}
                  onClick={markReviewed}
                  disabled={ov.diffReviewed}
                >
                  {ov.diffReviewed ? "Diff reviewed" : "Mark diff reviewed"}
                </Btn>
                <Btn size="sm" variant="danger" icon="rotate-ccw" onClick={requestChanges}>
                  Request changes
                </Btn>
                <Btn size="sm" variant="primary" icon="shield-check" onClick={approveForValidation}>
                  Approve for validation
                </Btn>
              </div>
            </div>
          </Card>

          <Card>
            <CardHead
              icon="sparkles"
              title="Synthetic AI-generated PR summary"
              actions={
                <Badge tone="accent" icon="sparkles">
                  Synthetic draft
                </Badge>
              }
            />
            <div className="wb-card-body">
              <p className="wb-secondary" style={{ fontSize: 13.5, lineHeight: 1.6 }}>
                {base.summary}
              </p>
              <Banner tone="neutral" icon="info">
                Generated from the issue's spec, plan, and change-targets artifacts. A human edits
                and owns the final description.
              </Banner>
            </div>
          </Card>

          <Card>
            <CardHead
              icon="file-code"
              title="Changed files"
              sub={
                base.files.length + " files across " + Object.keys(groups).length + " categories"
              }
              actions={
                base.unexpected > 0 ? (
                  <Badge tone="warn" icon="alert-triangle">
                    {base.unexpected} unexpected
                  </Badge>
                ) : (
                  <Badge tone="safe" icon="check">
                    All expected
                  </Badge>
                )
              }
            />
            <div className="wb-card-body wb-card-body--tight">
              {base.unexpected > 0 && (
                <div style={{ padding: "12px 16px" }}>
                  <Banner tone="warn" title="Unexpected change detected">
                    A file outside the change-targets allow-list is present. Confirm it belongs
                    before approving — this is how scope creep stays visible.
                  </Banner>
                </div>
              )}
              {Object.entries(groups).map(([cat, files], gi) => (
                <div key={cat}>
                  <div
                    className="wb-flex"
                    style={{
                      gap: 8,
                      padding: "9px 16px",
                      background: "var(--bg-surface-2)",
                      borderTop: gi ? "1px solid var(--border-subtle)" : "none",
                      borderBottom: "1px solid var(--border-subtle)",
                    }}
                  >
                    <Icon name={CAT_ICON[cat] ?? "file-code"} size={14} className="wb-muted" />
                    <span className="wb-text-sm wb-strong">{cat}</span>
                    <span className="wb-muted" style={{ fontSize: 11 }}>
                      {files.length}
                    </span>
                  </div>
                  {files.map((f) => (
                    <div
                      key={f.path}
                      className="wb-flex"
                      style={{
                        gap: 10,
                        padding: "9px 16px",
                        borderBottom: "1px solid var(--border-subtle)",
                      }}
                    >
                      <Icon
                        name={f.status === "unexpected" ? "alert-triangle" : "file-code"}
                        size={14}
                        style={{
                          color: f.status === "unexpected" ? "var(--warn)" : "var(--text-tertiary)",
                          flex: "none",
                        }}
                      />
                      <span
                        className="wb-mono"
                        style={{
                          fontSize: 11.5,
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {f.path}
                      </span>
                      <span className="wb-mono" style={{ fontSize: 11, color: "var(--safe)" }}>
                        +{f.add}
                      </span>
                      <span className="wb-mono" style={{ fontSize: 11, color: "var(--danger)" }}>
                        −{f.del}
                      </span>
                      {f.status === "unexpected" && <Badge tone="warn">unexpected</Badge>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead
              icon="list-checks"
              title="Synthetic required checks"
              actions={
                <Badge tone={checksOpen === 0 ? "safe" : "warn"}>
                  {base.checks.filter((c) => c.status === "pass").length}/{base.checks.length} green
                </Badge>
              }
            />
            <div className="wb-card-body wb-card-body--tight">
              {base.checks.map((c, i) => {
                const v = CHECK_VIS[c.status] ?? {
                  tone: "neutral",
                  icon: "circle",
                  label: c.status,
                };
                return (
                  <div
                    key={c.name}
                    className="wb-flex"
                    style={{
                      gap: 11,
                      padding: "11px 16px",
                      borderBottom:
                        i < base.checks.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    }}
                  >
                    <Icon
                      name={v.icon}
                      size={16}
                      style={{ color: "var(--" + v.tone + ")", flex: "none" }}
                    />
                    <span className="wb-text-sm wb-strong" style={{ flex: 1 }}>
                      {c.name}
                    </span>
                    <span className="wb-muted" style={{ fontSize: 12 }}>
                      {c.detail}
                    </span>
                    <Badge tone={v.tone}>{v.label}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right */}
        <div className="wb-stack">
          <Card>
            <CardHead icon="git-merge" title="Synthetic merge readiness" />
            <div className="wb-card-body">
              <div
                className={"wb-banner wb-banner--" + (mergeReady ? "safe" : "warn")}
                style={{ marginBottom: 14 }}
              >
                <Icon
                  name={mergeReady ? "check-circle" : "lock"}
                  size={17}
                  className="wb-banner-ico"
                />
                <div>
                  <span className="wb-banner-title">
                    {mergeReady ? "Ready for merge" : "Blocked — gates open"}
                  </span>
                  <div style={{ marginTop: 2 }}>
                    {mergeReady
                      ? "All governance gates satisfied."
                      : "Merge is held until every gate below is met."}
                  </div>
                </div>
              </div>
              <div className="wb-flex-col" style={{ gap: 10 }}>
                {gates.map((g) => (
                  <div key={g.label} className="wb-flex" style={{ gap: 10 }}>
                    <Icon
                      name={g.met ? "check-circle" : "circle"}
                      size={16}
                      style={{
                        color: g.met ? "var(--safe)" : "var(--text-tertiary)",
                        flex: "none",
                      }}
                    />
                    <span className="wb-text-sm" style={{ flex: 1 }}>
                      {g.label}
                    </span>
                    <span className="wb-muted" style={{ fontSize: 11.5 }}>
                      {g.detail}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHead icon="list-checks" title="Human reviewer checklist" />
            <div className="wb-card-body wb-card-body--tight">
              {checklist.map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: "11px 16px",
                    borderBottom:
                      i < checklist.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  <Check
                    on={c.done}
                    label={c.label}
                    onChange={(checked) => actions.setPR(issue.key, { checklistAll: checked })}
                  />
                </div>
              ))}
            </div>
            <div className="wb-card-foot">
              <Icon name="info" size={14} className="wb-muted" />
              <span className="wb-text-sm wb-muted">
                Checklist is enforced before the review gate can pass.
              </span>
            </div>
          </Card>

          <Card>
            <CardHead
              icon="users"
              title="Reviewers"
              actions={<Badge tone="warn">{base.unresolvedComments} unresolved</Badge>}
            />
            <div className="wb-card-body wb-flex-col" style={{ gap: 12 }}>
              {base.reviewers.map((r) => {
                const st =
                  r === base.reviewers[0] && reviewerState !== "pending" ? reviewerState : r.state;
                const tone: Tone =
                  st === "approved" ? "safe" : st === "changes" ? "danger" : "neutral";
                return (
                  <div key={r.name} className="wb-flex" style={{ gap: 10 }}>
                    <Avatar name={r.name} sm />
                    <div style={{ flex: 1 }}>
                      <div className="wb-text-sm wb-strong">{r.name}</div>
                      <div className="wb-muted" style={{ fontSize: 11.5 }}>
                        {r.role}
                      </div>
                    </div>
                    <Badge
                      tone={tone}
                      icon={st === "approved" ? "check" : st === "changes" ? "x" : "clock"}
                    >
                      {st === "approved" ? "Approved" : st === "changes" ? "Changes" : "Pending"}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function GitHubHead({ issue }: { readonly issue: Issue }) {
  const { actions } = useApp();
  return (
    <div className="wb-page-head">
      <div>
        <div className="eyebrow wb-mb-8">
          <Icon name="git-pull-request" size={13} /> Normal engineering controls
        </div>
        <h1 className="wb-page-title">GitHub / PR readiness</h1>
        <div className="wb-page-desc">
          A synthetic repository, branch, pull request, author, commit history, check suite, and
          reviewer state demonstrate how AI-assisted changes stay inside ordinary engineering
          controls. All actions update local state only.
        </div>
      </div>
      <div className="wb-spacer" />
      <div className="wb-flex wb-inline-field" style={{ gap: 8 }}>
        <label className="wb-text-sm wb-muted" htmlFor="github-issue-select">
          Issue
        </label>
        <div className="wb-select" style={{ width: 230 }}>
          <select
            id="github-issue-select"
            value={issue.key}
            onChange={(e) => actions.navigate("github", e.target.value)}
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
