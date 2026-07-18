import { useState } from "react";

import { artifactsFor, buildStages, prFor, validationFor } from "../data/content";
import type {
  GeneratedStage,
  Issue,
  Lifecycle,
  StageId,
  StageStatus,
  Tone,
  ValidationStatus,
} from "../data/types";
import { useApp, useIssue } from "../state/store";
import { Icon, type IconName } from "../../shared/Icon";
import { currentStage } from "./WorkQueueScreen";
import {
  Avatar,
  Badge,
  Banner,
  Btn,
  Card,
  CardHead,
  EmptyState,
  Kv,
  LifecycleBadge,
  Progress,
  RiskBadge,
  StatusBadge,
  SurfaceBadge,
} from "../components/primitives";
import { ContextManifest } from "../components/ContextManifest";
import type { ContextPack } from "../context/contracts";
import {
  contextRecordHashInput,
  isContextPackCurrent,
  selectContextPack,
} from "../context/selector";
import { contextRecordsForSubject, contextSelectionInput } from "../context/runtime";
import { useContextPacks } from "../context/useContextPacks";
import { sha256Hex } from "../control-plane/registry/canonical";

/* ============================================================
   AI Delivery Workbench — Screen: Issue Detail
   The operational command center for a single issue: business
   context, acceptance criteria, the AI stage timeline (with
   live Run/Retry/Redo/Logs actions), and right-rail summaries.
   ============================================================ */
// progression metadata for "ready" stage actions
type StageProgress = { label: string; lifecycle: Lifecycle; next: StageId | null; msg: string };
const STAGE_PROGRESS: Record<StageId, StageProgress> = {
  seed: {
    label: "Simulate Seed",
    lifecycle: "Intake",
    next: "intake",
    msg: "Synthetic workspace state seeded · inputs.json captured locally.",
  },
  intake: {
    label: "Simulate Intake",
    lifecycle: "Spec",
    next: "spec",
    msg: "Synthetic intake.md generated with prompt provenance.",
  },
  spec: {
    label: "Generate synthetic Spec",
    lifecycle: "Planning",
    next: "plan",
    msg: "Synthetic spec.md generated with acceptance criteria.",
  },
  plan: {
    label: "Generate synthetic Plan",
    lifecycle: "Planning",
    next: "targets",
    msg: "Synthetic plan.md generated locally.",
  },
  targets: {
    label: "Generate synthetic Change Targets",
    lifecycle: "Implementation",
    next: "implement",
    msg: "Synthetic change-targets.json + risk-review.md generated locally.",
  },
  implement: {
    label: "Simulate Implement",
    lifecycle: "Verification",
    next: "verify",
    msg: "Synthetic branch and commit state recorded locally; no repository was contacted.",
  },
  verify: {
    label: "Simulate Verify",
    lifecycle: "Verification",
    next: "review",
    msg: "evidence.md generated · tests passed (simulated).",
  },
  review: {
    label: "Mark demo Review Ready",
    lifecycle: "Review Ready",
    next: null,
    msg: "Local human-review gate state is ready.",
  },
};

const CONTEXT_1150 = {
  summary:
    "Finance analysts hand-write budget-vs-actual variance commentary every close cycle. This issue introduces an AI-drafted commentary that an analyst reviews, edits, and explicitly approves before it can appear in a report — accelerating the narrative without removing human judgment.",
  business: [
    "Monthly reporting cycle spends meaningful analyst time on repetitive variance narratives.",
    "Draft-then-approve keeps a human accountable for every published statement.",
    "Materiality threshold (default 5% / $50k) keeps commentary focused on what matters.",
  ],
  riskNotes:
    "Medium — the change spans Angular, .NET, and Oracle. Primary risk is publishing commentary without review; mitigated by an approval gate enforced in both the UI and the API, behind a default-off feature flag.",
};

function genContext(issue: Issue): typeof CONTEXT_1150 {
  return {
    summary:
      "Synthetic business context for " +
      issue.key +
      " — " +
      issue.title +
      ". This work item follows the same governed AI delivery workflow as the FIN-1150 reference issue: intake, spec, plan, change targets, implementation, verification, and a human review gate.",
    business: [
      issue.domain + " workflow improvement framed as a reviewable, traceable change.",
      "Deterministic artifacts are produced at each stage for human review.",
      "No downstream action is taken without passing the review and validation gates.",
    ],
    riskNotes: issue.risk + " — synthetic risk assessment for this demonstration issue.",
  };
}

function StageRow({
  issue,
  stage,
  selected,
  onToggle,
  contextPack,
  invalidatedByDigest,
  onReviseContext,
}: {
  readonly issue: Issue;
  readonly stage: GeneratedStage;
  readonly selected: boolean;
  readonly onToggle: () => void;
  readonly contextPack: ContextPack | undefined;
  readonly invalidatedByDigest: string | undefined;
  readonly onReviseContext: (pack: ContextPack) => void;
}) {
  const { actions } = useApp();
  const id = stage.id,
    status = stage.status;
  const def = stage;

  const nodeClasses: Record<StageStatus, string> = {
    done: "wb-tl-node--done",
    run: "wb-tl-node--running",
    fail: "wb-tl-node--failed",
    review: "wb-tl-node--review",
    stale: "wb-tl-node--stale",
    ready: "wb-tl-node--ready",
    none: "",
  };
  const nodeClass = nodeClasses[status];
  const nodeIcons: Record<StageStatus, IconName> = {
    done: "check",
    run: "loader",
    fail: "x",
    review: "alert-triangle",
    stale: "ban",
    ready: "play",
    none: def.icon,
  };
  const nodeIcon = nodeIcons[status];
  const firstArtifact = stage.artifacts[0];
  const triggerId = `timeline-trigger-${issue.key}-${id}`;
  const panelId = `timeline-panel-${issue.key}-${id}`;

  const runReady = () => {
    if (id === "review") return markReviewReady();
    const p = STAGE_PROGRESS[id];
    actions.runStage(issue.key, id, {
      lifecycle: p.lifecycle,
      doneMsg: p.msg,
      onDone: () => {
        if (p.next && p.next !== "review") actions.setStage(issue.key, p.next, "ready");
        if (p.next === "review") actions.setStage(issue.key, "review", "ready");
      },
    });
  };
  const retry = () => {
    actions.runStage(issue.key, id, {
      doneMsg: def.name + " simulation re-run succeeded in local state.",
      onDone: () => {
        const p = STAGE_PROGRESS[id];
        if (p && p.next) actions.setStage(issue.key, p.next, "ready");
      },
    });
  };
  const redo = () => {
    actions.openModal({
      title: "Redo " + def.name + "?",
      icon: "refresh-cw",
      tone: "warn",
      confirmLabel: "Simulate redo & mark downstream stale",
      cancelLabel: "Cancel",
      body: (
        <div>
          Re-running <strong>{def.name}</strong> invalidates downstream stages that already have
          state. They will be marked <strong>Stale</strong>; not-started stages remain blocked. This
          enforces deterministic, in-order artifacts.
        </div>
      ),
      onConfirm: () =>
        actions.runStage(issue.key, id, {
          doneMsg: def.name + " re-run · downstream marked stale.",
          onDone: () => {
            actions.invalidateAfterRedo(issue.key, id);
            actions.toast(
              "warn",
              "Downstream marked stale",
              "Existing downstream artifacts and stage state must be re-run.",
            );
          },
        }),
    });
  };
  const markReviewReady = () => {
    actions.setStage(issue.key, "review", "review");
    actions.patchIssue(issue.key, { lifecycle: "Review Ready", flags: { needsReview: true } });
    actions.toast(
      "success",
      "Marked demo Review Ready",
      "Lifecycle → Review Ready. Human review gate is now open.",
    );
  };

  return (
    <div className="wb-tl-item">
      <div className="wb-tl-rail">
        <span className={"wb-tl-node " + nodeClass}>
          <Icon
            name={nodeIcon}
            size={15}
            className={status === "run" ? "wb-spin" : ""}
            strokeWidth={status === "done" ? 2.4 : 1.9}
          />
        </span>
        <span className="wb-tl-line" />
      </div>
      <div className="wb-tl-body">
        <div className={"wb-tl-card" + (selected ? " is-selected" : "")}>
          <button
            type="button"
            className="wb-tl-card-head"
            id={triggerId}
            aria-expanded={selected}
            aria-controls={panelId}
            onClick={onToggle}
          >
            <span className="wb-u-min-w-0">
              <span className="wb-flex wb-u-gap-9px">
                <span className="wb-tl-stage-name">{def.name}</span>
                <StatusBadge status={status} />
                {stage.reviewerActionRequired && (
                  <Badge tone="warn" icon="user">
                    Reviewer action
                  </Badge>
                )}
              </span>
              <span className="wb-tl-stage-meta wb-mt-8 wb-u-display-flex wb-u-gap-14px wb-u-wrap-wrap">
                <span>
                  <Icon name="sparkles" size={11} /> {stage.promptVersion}
                </span>
                {stage.startedAt !== "—" && (
                  <span>
                    <Icon name="clock" size={11} /> {stage.startedAt}
                    {stage.completedAt !== "—" && stage.completedAt !== "running…"
                      ? " → " + stage.completedAt
                      : ""}
                  </span>
                )}
                {stage.artifacts.length > 0 && (
                  <span>
                    <Icon name="file-code" size={11} /> {stage.artifacts.join(", ")}
                  </span>
                )}
              </span>
            </span>
            <span className="wb-spacer wb-u-ml-auto" />
            <Icon
              name={selected ? "chevron-down" : "chevron-right"}
              size={16}
              className="wb-muted"
            />
          </button>
          {selected && (
            <div
              className="wb-tl-detail wb-u-pt-12px"
              id={panelId}
              role="region"
              aria-labelledby={triggerId}
            >
              <p className="wb-text-sm wb-secondary wb-u-mb-12px">{def.desc}</p>
              <div className="wb-flex wb-wrap wb-u-gap-8px">
                {status === "ready" && (
                  <Btn
                    size="sm"
                    variant="primary"
                    icon={id === "review" ? "shield-check" : "play"}
                    onClick={runReady}
                  >
                    {id === "review" ? "Mark demo Review Ready" : STAGE_PROGRESS[id].label}
                  </Btn>
                )}
                {status === "fail" && (
                  <Btn size="sm" variant="primary" icon="rotate-ccw" onClick={retry}>
                    Retry simulated {def.name}
                  </Btn>
                )}
                {status === "stale" && (
                  <Btn size="sm" variant="primary" icon="refresh-cw" onClick={retry}>
                    Re-run simulated {def.name}
                  </Btn>
                )}
                {status === "run" && (
                  <Btn size="sm" variant="secondary" disabled icon="loader">
                    <span className="wb-spin wb-u-display-inline-flex">
                      <Icon name="loader" size={13} />
                    </span>
                    Running…
                  </Btn>
                )}
                {status === "done" && (id === "plan" || id === "targets") && (
                  <Btn size="sm" variant="secondary" icon="refresh-cw" onClick={redo}>
                    Simulate redo of {def.name}
                  </Btn>
                )}
                {status === "review" && (
                  <Btn
                    size="sm"
                    variant="primary"
                    icon="git-pull-request"
                    onClick={() => actions.navigate("github", issue.key)}
                  >
                    Open human review
                  </Btn>
                )}
                {firstArtifact && (
                  <Btn
                    size="sm"
                    variant="secondary"
                    icon="file-code"
                    onClick={() => {
                      actions.selectArtifact(issue.key, firstArtifact);
                      actions.navigate("artifacts", issue.key);
                    }}
                  >
                    View artifact
                  </Btn>
                )}
                {stage.logsAvailable && (
                  <Btn
                    size="sm"
                    variant="ghost"
                    icon="terminal"
                    onClick={() => actions.openLogs(issue.key, id)}
                  >
                    View logs
                  </Btn>
                )}
              </div>
              {contextPack ? (
                <ContextManifest
                  pack={contextPack}
                  invalidatedByDigest={invalidatedByDigest}
                  onRevise={() => onReviseContext(contextPack)}
                />
              ) : (
                <p className="wb-text-sm wb-muted wb-mt-12" role="status">
                  Assembling the deterministic context manifest…
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type PrimaryAction = { label: string; icon: IconName; run: () => void };

export function IssueDetail() {
  const { state, actions } = useApp();
  const issue = useIssue(state.selectedKey);
  const stages = buildStages(issue);
  const cs = currentStage(issue);
  const ctx = issue.key === "FIN-1150" ? CONTEXT_1150 : genContext(issue);
  const val = validationFor(issue);
  const pr = prFor(issue);
  const artifacts = artifactsFor(issue);
  const [open, setOpen] = useState<StageId | null>(() => {
    const requested = new URLSearchParams(window.location.search).get("stage");
    return stages.find((stage) => stage.id === requested)?.id ?? cs.def.id;
  });
  const { packs: contextPacks, error: contextError } = useContextPacks(issue.key);
  const [invalidatedPacks, setInvalidatedPacks] = useState<Readonly<Record<string, string>>>({});

  function setOpenStage(stageId: StageId | null): void {
    setOpen(stageId);
    const url = new URL(window.location.href);
    if (stageId) url.searchParams.set("stage", stageId);
    else url.searchParams.delete("stage");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  async function simulateContextRevision(stageId: StageId, boundPack: ContextPack) {
    const selectedRecord = boundPack.includedRecords[0]?.record;
    if (!selectedRecord) {
      actions.toast(
        "error",
        "Context revision unavailable",
        "The bound pack has no selected record.",
      );
      return;
    }
    const updatedAt = "2026-07-17T17:59:00.000Z";
    const changedContent = `${selectedRecord.content} Synthetic revision marker: context-v2.`;
    const changedRecordWithoutNewHash = {
      ...selectedRecord,
      content: changedContent,
      updatedAt,
    };
    const changedRecord = {
      ...changedRecordWithoutNewHash,
      contentHash: await sha256Hex(contextRecordHashInput(changedRecordWithoutNewHash)),
    };
    const candidates = contextRecordsForSubject(issue.key).map((record) =>
      record.id === selectedRecord.id ? changedRecord : record,
    );
    const revisedInput = contextSelectionInput(issue.key, stageId, { candidates });
    const revisedPack = await selectContextPack(revisedInput);
    if (await isContextPackCurrent(boundPack, revisedInput)) {
      actions.toast("error", "Context invariant failed", "The context change was not detected.");
      return;
    }
    setInvalidatedPacks((current) => ({
      ...current,
      [`${issue.key}:${stageId}`]: revisedPack.packDigest,
    }));
    actions.staleFrom(issue.key, stageId);
    actions.toast(
      "warn",
      "Context binding invalidated",
      `${stageId} and dependent completed stages were marked stale; start a new run to bind ${revisedPack.packDigest.slice(0, 12)}…`,
    );
  }

  // primary next action
  const nextStage =
    stages.find((s) => s.status === "ready") ||
    stages.find((s) => s.status === "fail") ||
    stages.find((s) => s.status === "review") ||
    stages.find((s) => s.status === "stale");
  const primary: PrimaryAction | null = (() => {
    if (!nextStage) return null;
    const s = nextStage;
    if (s.status === "ready")
      return {
        label: s.id === "review" ? "Mark demo Review Ready" : STAGE_PROGRESS[s.id].label,
        icon: s.id === "review" ? "shield-check" : "play",
        run: () => triggerReady(s),
      };
    if (s.status === "fail")
      return {
        label: "Retry simulated " + s.name,
        icon: "rotate-ccw",
        run: () => triggerReady(s),
      };
    if (s.status === "review")
      return {
        label: "Open human review",
        icon: "git-pull-request",
        run: () => actions.navigate("github", issue.key),
      };
    if (s.status === "stale")
      return {
        label: "Re-run simulated " + s.name,
        icon: "refresh-cw",
        run: () => triggerReady(s),
      };
    return null;
  })();

  function triggerReady(s: GeneratedStage) {
    setOpen(s.id);
    if (s.id === "review") {
      actions.setStage(issue.key, "review", "review");
      actions.patchIssue(issue.key, { lifecycle: "Review Ready", flags: { needsReview: true } });
      actions.toast(
        "success",
        "Marked demo Review Ready",
        "Lifecycle → Review Ready. Human review gate is now open.",
      );
      return;
    }
    const p = STAGE_PROGRESS[s.id];
    actions.runStage(issue.key, s.id, {
      lifecycle: p && p.lifecycle,
      doneMsg: p ? p.msg : "Completed.",
      onDone: () => {
        if (p && p.next) actions.setStage(issue.key, p.next, "ready");
      },
    });
  }

  const valTone: Record<ValidationStatus, Tone> = {
    Passed: "safe",
    "In Progress": "accent",
    Failed: "danger",
    Blocked: "danger",
    "Not Started": "neutral",
    Pending: "warn",
    Complete: "safe",
  };

  return (
    <div className="wb-page wb-page-wide">
      {/* Contextual action bar */}
      <Card className="wb-mb-16 wb-u-position-sticky wb-u-top-0 wb-u-z-5">
        <div className="wb-card-body wb-between wb-wrap wb-u-gap-14px">
          <div className="wb-u-min-w-0">
            <div className="wb-flex wb-u-gap-10px">
              <span className="wb-row-key wb-u-text-14px">{issue.key}</span>
              <Badge tone="neutral">Synthetic issue fixture</Badge>
              <LifecycleBadge value={issue.lifecycle} />
              <RiskBadge risk={issue.risk} />
            </div>
            <h1 className="wb-u-text-18px wb-u-weight-700 wb-u-tracking-zero-01em wb-u-mt-6px">
              {issue.title}
            </h1>
            <div className="wb-text-sm wb-muted wb-mt-8 wb-flex wb-u-gap-8px">
              <Icon name="circle-dot" size={13} /> Current stage:{" "}
              <strong className="wb-secondary">{cs.def.name}</strong>{" "}
              <StatusBadge status={cs.status} />
            </div>
          </div>
          <div className="wb-spacer wb-u-ml-auto" />
          <div className="wb-flex wb-wrap wb-u-gap-8px">
            <Btn
              variant="secondary"
              icon="git-pull-request"
              onClick={() => actions.navigate("github", issue.key)}
            >
              {issue.pr ? "Synthetic PR #" + issue.pr : "Synthetic PR readiness"}
            </Btn>
            {primary && (
              <Btn variant="primary" icon={primary.icon} onClick={primary.run}>
                {primary.label}
              </Btn>
            )}
          </div>
        </div>
      </Card>

      <div className="wb-u-display-grid wb-u-cols-minmax-zero-1-7fr-minmax-zero-1fr wb-u-gap-16px wb-u-items-start">
        {/* Left column */}
        <div className="wb-stack">
          {primary && (
            <Banner
              tone={
                nextStage && nextStage.status === "fail"
                  ? "danger"
                  : nextStage && (nextStage.status === "review" || nextStage.status === "stale")
                    ? "warn"
                    : "info"
              }
              title="Next best action"
            >
              {nextStage && nextStage.status === "fail" && (
                <>
                  The <strong>{nextStage.name}</strong> stage failed. Inspect the logs and retry —
                  downstream stages stay blocked until it passes.
                </>
              )}
              {nextStage && nextStage.status === "ready" && (
                <>
                  This issue is ready to <strong>{primary.label.toLowerCase()}</strong>. Output is
                  recorded as a synthetic reviewable artifact with prompt provenance.
                </>
              )}
              {nextStage && nextStage.status === "review" && (
                <>
                  Implementation and verification are complete. This change is waiting on the{" "}
                  <strong>human review gate</strong> before it is release-eligible.
                </>
              )}
              {nextStage && nextStage.status === "stale" && (
                <>
                  A plan change marked downstream stages stale.{" "}
                  <strong>Re-run simulated {nextStage.name}</strong> to restore a consistent,
                  in-order artifact chain.
                </>
              )}
            </Banner>
          )}

          <Card>
            <CardHead icon="file-text" title="Business context" />
            <div className="wb-card-body">
              <p className="wb-secondary wb-u-text-13-5px wb-u-leading-1-6">{ctx.summary}</p>
              <div className="wb-md wb-u-mt-6px">
                <ul>
                  {ctx.business.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              </div>
              <div className="wb-banner wb-banner--warn wb-mt-12">
                <Icon name="shield-alert" size={16} className="wb-banner-ico" />
                <div>
                  <span className="wb-banner-title">Risk notes</span>
                  <div className="wb-u-mt-2px">{ctx.riskNotes}</div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <CardHead
              icon="list-checks"
              title="Acceptance criteria"
              actions={
                <Badge tone="neutral">
                  {val.acceptance.filter((a) => a.status === "Passed").length}/
                  {val.acceptance.length} passed
                </Badge>
              }
            />
            <div className="wb-card-body wb-card-body--tight">
              {val.acceptance.map((a) => (
                <div key={a.id} className="wb-flex wb-divided-row wb-u-gap-10px wb-u-p-10px-16px">
                  <span className="wb-mono wb-muted wb-u-text-11-5px wb-u-flex-none wb-u-w-34px">
                    {a.id}
                  </span>
                  <span className="wb-u-text-13px wb-u-flex-1">{a.text}</span>
                  <Badge
                    tone={valTone[a.status] || "neutral"}
                    icon={
                      a.status === "Passed"
                        ? "check"
                        : a.status === "Failed"
                          ? "x"
                          : a.status === "In Progress"
                            ? "loader"
                            : "circle-dashed"
                    }
                  >
                    {a.status}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead
              icon="workflow"
              title="AI delivery workflow"
              sub="Eight deterministic stages · human review gate before release"
              actions={
                <Badge tone="accent" icon="sparkles">
                  Governed
                </Badge>
              }
            />
            <div className="wb-card-body">
              {contextError && (
                <Banner tone="danger" title="Context manifests unavailable">
                  {contextError}
                </Banner>
              )}
              <div className="wb-timeline">
                {stages.map((s) => (
                  <StageRow
                    key={s.id}
                    issue={issue}
                    stage={s}
                    selected={open === s.id}
                    onToggle={() => setOpenStage(open === s.id ? null : s.id)}
                    contextPack={contextPacks.get(s.id)}
                    invalidatedByDigest={invalidatedPacks[`${issue.key}:${s.id}`]}
                    onReviseContext={(pack) => void simulateContextRevision(s.id, pack)}
                  />
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Right rail */}
        <div className="wb-stack">
          <Card>
            <CardHead icon="info" title="Issue" />
            <div className="wb-card-body">
              <Kv
                rows={[
                  ["Domain", issue.domain],
                  ["Surface", <SurfaceBadge value={issue.surface} />],
                  [
                    "Branch",
                    <span className="wb-mono wb-text-sm wb-u-color-accent-text">
                      {issue.branch}
                    </span>,
                  ],
                  ["Target surfaces", "Angular · C#/.NET API · Oracle"],
                ]}
              />
              <hr className="wb-divider" />
              <div className="wb-flex-col wb-u-gap-10px">
                {[
                  { role: "Owner", name: issue.assignee },
                  { role: "Reviewer", name: issue.reviewer },
                  { role: "Tester", name: issue.tester },
                ].map((person) => (
                  <div key={person.role} className="wb-flex wb-u-gap-10px">
                    <Avatar name={person.name} sm />
                    <div>
                      <div className="wb-text-sm wb-strong">{person.name}</div>
                      <div className="wb-muted wb-u-text-11-5px">{person.role}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHead
              icon="file-code"
              title="Latest artifacts"
              actions={
                <Btn
                  size="sm"
                  variant="ghost"
                  iconRight="arrow-right"
                  onClick={() => actions.navigate("artifacts", issue.key)}
                >
                  All
                </Btn>
              }
            />
            <div className="wb-card-body wb-card-body--tight">
              {artifacts.length === 0 && (
                <div className="wb-u-p-16px">
                  <span className="wb-muted wb-text-sm">
                    No artifacts yet — run the workflow to generate them.
                  </span>
                </div>
              )}
              {artifacts
                .slice(-4)
                .reverse()
                .map((a) => (
                  <button
                    type="button"
                    key={a.id}
                    className="wb-flex wb-clickable wb-artifact-shortcut wb-divided-row wb-u-gap-10px wb-u-p-10px-16px"
                    onClick={() => {
                      actions.selectArtifact(issue.key, a.name);
                      actions.navigate("artifacts", issue.key);
                    }}
                  >
                    <Icon
                      name={a.type === "JSON" ? "file-code" : "file-text"}
                      size={15}
                      className="wb-muted"
                    />
                    <span className="wb-mono wb-text-sm wb-u-flex-1">{a.name}</span>
                    <span className="wb-muted wb-u-text-11px">{a.stage}</span>
                  </button>
                ))}
            </div>
          </Card>

          <Card>
            <CardHead icon="git-pull-request" title="PR readiness" />
            <div className="wb-card-body">
              {issue.pr ? (
                <div className="wb-stack-sm">
                  <div className="wb-between">
                    <span className="wb-text-sm wb-secondary">Pull request</span>
                    <span className="wb-mono wb-strong wb-u-color-accent-text">#{issue.pr}</span>
                  </div>
                  <div className="wb-between">
                    <span className="wb-text-sm wb-secondary">Status</span>
                    <Badge
                      tone={
                        issue.prStatus === "Open" || issue.prStatus === "Ready for review"
                          ? "accent"
                          : "neutral"
                      }
                    >
                      {issue.prStatus}
                    </Badge>
                  </div>
                  <div className="wb-between">
                    <span className="wb-text-sm wb-secondary">Checks</span>
                    <span className="wb-text-sm">
                      <span className="wb-u-color-safe">
                        {pr.checks.filter((c) => c.status === "pass").length} pass
                      </span>
                      {pr.checks.some((c) => c.status === "fail") ? (
                        <span className="wb-u-color-danger">
                          {" "}
                          · {pr.checks.filter((c) => c.status === "fail").length} fail
                        </span>
                      ) : (
                        ""
                      )}
                      {pr.checks.some((c) => c.status === "pending" || c.status === "required") ? (
                        <span className="wb-u-color-warn">
                          {" "}
                          ·{" "}
                          {
                            pr.checks.filter(
                              (c) => c.status === "pending" || c.status === "required",
                            ).length
                          }{" "}
                          open
                        </span>
                      ) : (
                        ""
                      )}
                    </span>
                  </div>
                  <Btn
                    size="sm"
                    variant="secondary"
                    className="wb-btn--block wb-mt-8"
                    iconRight="arrow-right"
                    onClick={() => actions.navigate("github", issue.key)}
                  >
                    Open PR readiness
                  </Btn>
                </div>
              ) : (
                <EmptyState icon="git-pull-request" title="No PR yet">
                  Simulate through Implement, then create a mock PR in local state on the GitHub
                  screen.
                </EmptyState>
              )}
            </div>
          </Card>

          <Card>
            <CardHead icon="flask" title="Validation status" />
            <div className="wb-card-body wb-stack-sm">
              <div className="wb-between">
                <span className="wb-text-sm wb-secondary">Decision</span>
                <Badge tone={valTone[val.decision] || "neutral"}>{val.decision}</Badge>
              </div>
              <div className="wb-between">
                <span className="wb-text-sm wb-secondary">Evidence</span>
                <Badge tone={valTone[val.evidenceStatus] || "neutral"}>{val.evidenceStatus}</Badge>
              </div>
              <Progress
                value={Math.round(
                  (val.acceptance.filter((a) => a.status === "Passed").length /
                    val.acceptance.length) *
                    100,
                )}
                tone="safe"
                label="Acceptance criteria completion"
                valueText={`${val.acceptance.filter((a) => a.status === "Passed").length} of ${val.acceptance.length} criteria passed`}
              />
              <Btn
                size="sm"
                variant="secondary"
                className="wb-btn--block wb-mt-8"
                iconRight="arrow-right"
                onClick={() => actions.navigate("validation", issue.key)}
              >
                Open validation evidence
              </Btn>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
