import { prFor, validationFor } from "../data/content";
import { issues } from "../data/fixtures";
import type { Issue, PullRequestFile, Tone } from "../data/types";
import { useApp, useIssue } from "../state/store";
import { Icon, type IconName } from "../../shared/Icon";
import { authorizeRegistryAction } from "../authorization/authorizeAction";
import { personaById } from "../authorization/personas";
import { sha256Hex } from "../control-plane/registry/canonical";
import { registrySnapshot } from "../control-plane/registry/generated";
import { buildContextPack } from "../context/runtime";
import { evaluateReleaseReadiness, evaluateValidationApproval } from "../state/guards";
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
  const authorizeDiffReview = async (decisionIdSuffix: string) => {
    const now = new Date().toISOString();
    const context = await authorizeRegistryAction({
      snapshot: registrySnapshot,
      persona: personaById(state.personaId),
      stageId: "review",
      toolId: "tool.workflow.diff-review",
      targetPaths: [],
      approvedChangeTargets: [],
      networkAccess: false,
      evidenceFinalized: false,
      effectiveSubject: issue.key,
      runId: `run.browser.${issue.key.toLocaleLowerCase()}`,
      sessionId: "session.browser.demo",
      now,
      expiresAt: new Date(Date.parse(now) + 15 * 60 * 1000).toISOString(),
      decisionId: `decision.browser.diff-review.${issue.key.toLocaleLowerCase()}.${decisionIdSuffix}`,
    });
    actions.recordAuthorizationDecision(context.decision);
    if (!context.decision.allowed) {
      actions.toast("error", "Review action blocked", context.decision.explanation);
      return false;
    }
    return true;
  };
  const markReviewed = async () => {
    if (!(await authorizeDiffReview("reviewed"))) return;
    actions.setPR(issue.key, {
      diffReviewed: true,
      checklist: Object.fromEntries(base.checklist.map((item) => [item.label, true])),
    });
    actions.toast(
      "success",
      "Diff marked reviewed",
      "Changed-file review recorded in browser-local state for synthetic PR #" + base.number + ".",
    );
  };
  const requestChanges = async () => {
    if (!(await authorizeDiffReview("changes-requested"))) return;
    actions.setPR(issue.key, { status: "Changes requested", reviewer: "changes" });
    actions.patchIssue(issue.key, { prStatus: "Changes requested" });
    actions.toast(
      "warn",
      "Changes requested",
      "Synthetic reviewer decision recorded locally; no notification was sent.",
    );
  };
  /* excerpt:start:human-approval-gate */
  const approveForValidation = async () => {
    const gate = evaluateValidationApproval({ issue, pullRequest: base, override: ov });
    const blocker = gate.blockers[0];
    if (blocker) {
      const message = {
        VERIFY_NOT_PASSED: [
          "Verification must pass",
          "A failed, stale, or incomplete Verify stage blocks validation approval.",
        ],
        REQUIRED_CHECKS_NOT_PASSED: [
          "Required checks must pass",
          "Resolve every required automated check before requesting validation approval.",
        ],
        DIFF_NOT_REVIEWED: [
          "Review the diff first",
          "Mark the changed-file diff reviewed before approving for validation.",
        ],
        REVIEW_CHECKLIST_INCOMPLETE: [
          "Complete the demo checklist",
          "Every browser-local reviewer checklist item must be checked before validation approval.",
        ],
        BOUND_APPROVAL_REQUIRED: ["Bound approval required", "A bound approval is required."],
        VALIDATION_PERSONA_REQUIRED: ["Validator required", "A distinct validator is required."],
        VALIDATION_SCENARIOS_INCOMPLETE: [
          "Validation incomplete",
          "Validation scenarios remain open.",
        ],
        VALIDATION_EVIDENCE_INCOMPLETE: [
          "Evidence incomplete",
          "Validation evidence remains open.",
        ],
      } as const;
      actions.toast("warn", message[blocker.code][0], message[blocker.code][1]);
      return;
    }
    const now = new Date().toISOString();
    const validation = validationFor(issue);
    const argumentsValue = {
      issueKey: issue.key,
      testedCommit: validation.commitSha,
      decision: "release-ready",
    } as const;
    const context = await authorizeRegistryAction({
      snapshot: registrySnapshot,
      persona: personaById(state.personaId),
      stageId: "review",
      toolId: "tool.workflow.release-readiness",
      targetPaths: [],
      approvedChangeTargets: [],
      networkAccess: false,
      evidenceFinalized: true,
      effectiveSubject: issue.key,
      runId: `run.browser.${issue.key.toLocaleLowerCase()}`,
      sessionId: "session.browser.demo",
      now,
      expiresAt: new Date(Date.parse(now) + 15 * 60 * 1000).toISOString(),
      decisionId: `decision.browser.release.${issue.key.toLocaleLowerCase()}`,
    });
    actions.recordAuthorizationDecision(context.decision);
    if (context.decision.mode !== "REQUIRE_APPROVAL") {
      actions.toast(
        context.decision.allowed ? "success" : "error",
        context.decision.allowed ? "Transition allowed" : "Transition blocked",
        context.decision.explanation,
      );
      return;
    }
    const changeTargetDigest = await sha256Hex(base.files.map((file) => file.path).sort());
    const contextPackDigest = (await buildContextPack(issue.key, "review")).packDigest;
    const request = await actions.queueApproval({
      context,
      argumentsValue,
      targetPaths: [],
      changeTargetDigest,
      contextPackDigest,
      requestedAt: now,
    });
    actions.toast(
      "info",
      "Validation approval requested",
      `${request.requestId} is waiting for a distinct synthetic validator; no transition ran.`,
    );
    actions.navigate("approvals", issue.key);
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
            This issue hasn't reached a pull request. Simulate the workflow through{" "}
            <strong>Implement</strong>, then create a mock PR in local state to start the human
            review gate. PRs keep AI-assisted changes inside normal engineering controls.
          </EmptyState>
        </Card>
      </div>
    );
  }

  const status = ov.status || base.status;
  const reviewerState = ov.reviewer || "pending";
  const checklist = base.checklist.map((item) => ({
    ...item,
    done: ov.checklist?.[item.label] ?? item.done,
  }));
  const checksOpen = base.checks.filter((check) => check.status !== "pass").length;
  const groups: Record<string, PullRequestFile[]> = {};
  base.files.forEach((file) => {
    const category = groups[file.category] ?? [];
    category.push(file);
    groups[file.category] = category;
  });
  const validationBase = validationFor(issue);
  const validationOverride = state.valState[issue.key];
  const readiness = evaluateReleaseReadiness({
    issue,
    pullRequest: base,
    pullRequestOverride: ov,
    validation: validationBase,
    ...(validationOverride ? { validationOverride } : {}),
  });
  const gates = readiness.gates;
  const mergeReady = readiness.allowed;

  return (
    <div className="wb-page wb-page-wide">
      <GitHubHead issue={issue} />
      <div className="wb-u-display-grid wb-u-cols-minmax-zero-1-7fr-minmax-zero-1fr wb-u-gap-16px wb-u-items-start">
        {/* Left */}
        <div className="wb-stack">
          <Card>
            <div className="wb-card-body">
              <div className="wb-between wb-wrap wb-u-gap-12px">
                <div className="wb-u-min-w-0">
                  <div className="wb-flex wb-u-gap-10px">
                    <span className="wb-row-key wb-u-text-14px">Synthetic PR #{base.number}</span>
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
                  <div className="wb-u-text-16px wb-u-weight-700 wb-u-mt-6px">{base.title}</div>
                  <div className="wb-flex wb-wrap wb-mt-8 wb-u-gap-14px wb-u-text-12px">
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
              <div className="wb-flex wb-wrap wb-u-gap-8px">
                <Btn size="sm" variant="secondary" icon="refresh-cw" onClick={refresh}>
                  Refresh PR status (simulated)
                </Btn>
                <Btn
                  size="sm"
                  variant={ov.diffReviewed ? "secondary" : "primary"}
                  icon={ov.diffReviewed ? "check" : "eye"}
                  onClick={() => void markReviewed()}
                  disabled={ov.diffReviewed}
                >
                  {ov.diffReviewed ? "Demo diff reviewed" : "Mark demo diff reviewed"}
                </Btn>
                <Btn
                  size="sm"
                  variant="danger"
                  icon="rotate-ccw"
                  onClick={() => void requestChanges()}
                >
                  Record demo changes requested
                </Btn>
                <Btn
                  size="sm"
                  variant="primary"
                  icon="shield-check"
                  onClick={() => void approveForValidation()}
                >
                  Request validation approval
                </Btn>
              </div>
              {state.lastAuthorizationDecision && !state.lastAuthorizationDecision.allowed && (
                <Banner tone="warn" title="Policy enforcement result" icon="lock">
                  {state.lastAuthorizationDecision.explanation} Required and effective scopes plus
                  the matched policy are evaluated in shared domain logic, not inferred from this
                  button's visibility.
                </Banner>
              )}
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
              <p className="wb-secondary wb-u-text-13-5px wb-u-leading-1-6">{base.summary}</p>
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
              {base.unexpected === 0 && (
                <div className="wb-u-p-12px-16px">
                  <Banner tone="neutral" icon="shield">
                    The approved change-targets artifact is the path allow-list. Every changed file
                    is compared with it; an outside path remains visible and blocks approval until a
                    person resolves the scope difference.
                  </Banner>
                </div>
              )}
              {base.unexpected > 0 && (
                <div className="wb-u-p-12px-16px">
                  <Banner tone="warn" title="Unexpected change detected">
                    A file outside the change-targets allow-list is present. Confirm it belongs
                    before approving — this is how scope creep stays visible.
                  </Banner>
                </div>
              )}
              {Object.entries(groups).map(([cat, files]) => (
                <div key={cat} className="wb-file-group">
                  <div className="wb-flex wb-file-group-heading">
                    <Icon name={CAT_ICON[cat] ?? "file-code"} size={14} className="wb-muted" />
                    <span className="wb-text-sm wb-strong">{cat}</span>
                    <span className="wb-muted wb-u-text-11px">{files.length}</span>
                  </div>
                  {files.map((f) => (
                    <div
                      key={f.path}
                      className="wb-flex wb-u-gap-10px wb-u-p-9px-16px wb-u-border-bottom-1px-solid-border-subtle"
                    >
                      <Icon
                        name={f.status === "unexpected" ? "alert-triangle" : "file-code"}
                        size={14}
                        className={
                          f.status === "unexpected"
                            ? "wb-tone--warn wb-u-flex-none"
                            : "wb-tone--tertiary wb-u-flex-none"
                        }
                      />
                      <span className="wb-mono wb-u-text-11-5px wb-u-flex-1 wb-u-overflow-hidden wb-u-text-overflow-ellipsis wb-u-whitespace-nowrap">
                        {f.path}
                      </span>
                      <span className="wb-mono wb-u-text-11px wb-u-color-safe">+{f.add}</span>
                      <span className="wb-mono wb-u-text-11px wb-u-color-danger">−{f.del}</span>
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
              {base.checks.map((c) => {
                const v = CHECK_VIS[c.status] ?? {
                  tone: "neutral",
                  icon: "circle",
                  label: c.status,
                };
                return (
                  <div
                    key={c.name}
                    className="wb-flex wb-divided-row wb-u-gap-11px wb-u-p-11px-16px"
                  >
                    <Icon name={v.icon} size={16} className={`wb-tone--${v.tone} wb-u-flex-none`} />
                    <span className="wb-text-sm wb-strong wb-u-flex-1">{c.name}</span>
                    <span className="wb-muted wb-u-text-12px">{c.detail}</span>
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
              <div className={`wb-banner wb-banner--${mergeReady ? "safe" : "warn"} wb-u-mb-14px`}>
                <Icon
                  name={mergeReady ? "check-circle" : "lock"}
                  size={17}
                  className="wb-banner-ico"
                />
                <div>
                  <span className="wb-banner-title">
                    {mergeReady ? "Ready for merge" : "Blocked — gates open"}
                  </span>
                  <div className="wb-u-mt-2px">
                    {mergeReady
                      ? "All governance gates satisfied."
                      : "Merge is held until every gate below is met."}
                  </div>
                </div>
              </div>
              <div className="wb-flex-col wb-u-gap-10px">
                {gates.map((g) => (
                  <div key={g.label} className="wb-flex wb-u-gap-10px">
                    <Icon
                      name={g.met ? "check-circle" : "circle"}
                      size={16}
                      className={
                        g.met ? "wb-tone--safe wb-u-flex-none" : "wb-tone--tertiary wb-u-flex-none"
                      }
                    />
                    <span className="wb-text-sm wb-u-flex-1">{g.label}</span>
                    <span className="wb-muted wb-u-text-11-5px">{g.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHead icon="list-checks" title="Human reviewer checklist" />
            <div className="wb-card-body wb-card-body--tight">
              {checklist.map((c, i) => (
                <div key={i} className="wb-divided-row wb-u-p-11px-16px">
                  <Check
                    on={c.done}
                    label={c.label}
                    onChange={(checked) =>
                      actions.setPR(issue.key, {
                        checklist: { ...ov.checklist, [c.label]: checked },
                      })
                    }
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
            <div className="wb-card-body wb-flex-col wb-u-gap-12px">
              {base.reviewers.map((r) => {
                const st =
                  r === base.reviewers[0] && reviewerState !== "pending" ? reviewerState : r.state;
                const tone: Tone =
                  st === "approved" ? "safe" : st === "changes" ? "danger" : "neutral";
                return (
                  <div key={r.name} className="wb-flex wb-u-gap-10px">
                    <Avatar name={r.name} sm />
                    <div className="wb-u-flex-1">
                      <div className="wb-text-sm wb-strong">{r.name}</div>
                      <div className="wb-muted wb-u-text-11-5px">{r.role}</div>
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
      <div className="wb-flex wb-inline-field wb-u-gap-8px">
        <label className="wb-text-sm wb-muted" htmlFor="github-issue-select">
          Issue
        </label>
        <div className="wb-select wb-u-w-230px">
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
