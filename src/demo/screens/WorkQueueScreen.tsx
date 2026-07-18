import type { ReactNode } from "react";

import {
  issues as issueFixtures,
  meta,
  stageDefs,
  surfaces as surfaceFixtures,
} from "../data/fixtures";
import type { Issue, StageDefinition, StageStatus } from "../data/types";
import { useApp } from "../state/store";
import { Icon, type IconName } from "../../shared/Icon";
import {
  Btn,
  Card,
  EmptyState,
  LifecycleBadge,
  RiskBadge,
  StatTile,
  StatusBadge,
  SurfaceBadge,
} from "../components/primitives";

/* ============================================================
   AI Delivery Workbench — Screen: Work Queue (the cockpit)
   ============================================================ */
// Shared helper: which stage is "current" for an issue
export function currentStage(issue: Issue): {
  def: StageDefinition;
  status: StageStatus;
  idx: number;
} {
  let idx = issue.s.findIndex((v) => v === "run" || v === "fail" || v === "review");
  if (idx === -1) idx = issue.s.findIndex((v) => v === "ready");
  if (idx === -1) {
    // all done or none — pick last done, else first
    const lastDone = issue.s.lastIndexOf("done");
    idx = lastDone === -1 ? 0 : lastDone;
  }
  const def = stageDefs[idx];
  if (!def) throw new Error(`Missing stage definition at index ${idx}`);
  return { def, status: issue.s[idx] ?? "none", idx };
}

function QueueChip({
  active,
  icon,
  onClick,
  children,
}: {
  readonly active: boolean;
  readonly icon: IconName;
  readonly onClick: () => void;
  readonly children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={"wb-chip" + (active ? " is-active" : "")}
      aria-pressed={active}
      onClick={onClick}
    >
      <Icon name={icon} size={13} />
      {children}
    </button>
  );
}

export function WorkQueue() {
  const { state, actions } = useApp();
  const f = state.filters;
  const issues = issueFixtures
    .map((issue) => state.issues[issue.key])
    .filter((issue): issue is Issue => issue !== undefined);

  const filtered = issues.filter((it) => {
    if (f.search && !(it.key + " " + it.title).toLowerCase().includes(f.search.toLowerCase()))
      return false;
    if (f.assignedToMe && it.assignee !== meta.user.name) return false;
    if (f.lifecycle && it.lifecycle !== f.lifecycle) return false;
    if (f.surface && it.surface !== f.surface) return false;
    if (f.hasPR && !it.pr) return false;
    if (f.needsReview && !(it.flags.needsReview || it.s.includes("review"))) return false;
    if (f.failed && !it.s.includes("fail")) return false;
    if (f.stale && !it.s.includes("stale")) return false;
    return true;
  });

  const totals = {
    all: issues.length,
    review: issues.filter((i) => i.flags.needsReview || i.s.includes("review")).length,
    failed: issues.filter((i) => i.s.includes("fail")).length,
    stale: issues.filter((i) => i.s.includes("stale")).length,
  };

  const nextActionClick = (it: Issue) => {
    const tgt = it.next.target;
    if (tgt === "issue") actions.openIssue(it.key);
    else actions.navigate(tgt, it.key);
  };

  const lifecycles = ["", ...Array.from(new Set(issueFixtures.map((issue) => issue.lifecycle)))];
  const surfaces = ["", ...surfaceFixtures];

  return (
    <div className="wb-page wb-page-wide">
      <div className="wb-page-head">
        <div>
          <div className="eyebrow wb-mb-8">
            <Icon name="layout-grid" size={13} /> Synthetic delivery cockpit
          </div>
          <h1 className="wb-page-title">Work Queue</h1>
          <div className="wb-page-desc">
            A deterministic queue for exploring governed delivery state. Every issue, persona,
            branch, status, timestamp, and count below is a synthetic demo fixture.
          </div>
        </div>
        <div className="wb-spacer" />
        <Btn
          variant="secondary"
          icon="refresh-cw"
          onClick={() =>
            actions.toast(
              "info",
              "Syncing Jira (simulated)",
              "No real Jira connection — demo mode.",
            )
          }
        >
          Sync Jira (simulated)
        </Btn>
      </div>

      <div className="wb-grid wb-grid-4 wb-mb-16">
        <StatTile
          label="Tracked issues"
          icon="workflow"
          value={totals.all}
          meta="synthetic fixture count"
        />
        <StatTile
          label="Needs human review"
          icon="alert-triangle"
          value={totals.review}
          meta={totals.review ? "synthetic reviewer gate" : "synthetic fixture: none"}
          metaTone={totals.review ? "warn" : "safe"}
        />
        <StatTile
          label="Failed verification"
          icon="x-circle"
          value={totals.failed}
          meta={totals.failed ? "synthetic failures" : "synthetic fixture: none"}
          metaTone={totals.failed ? "danger" : "safe"}
        />
        <StatTile
          label="Stale downstream"
          icon="ban"
          value={totals.stale}
          meta={totals.stale ? "synthetic stale state" : "synthetic fixture: none"}
          metaTone={totals.stale ? "warn" : "safe"}
        />
      </div>

      <div className="wb-filterbar">
        <div className="wb-search">
          <Icon name="search" size={16} />
          <input
            aria-label="Search synthetic issues"
            placeholder="Search issues by key or title…"
            value={f.search}
            onChange={(e) => actions.setFilter({ search: e.target.value })}
          />
        </div>
        <div className="wb-select wb-u-w-160px">
          <select
            aria-label="Filter by lifecycle state"
            value={f.lifecycle}
            onChange={(e) => actions.setFilter({ lifecycle: e.target.value })}
          >
            {lifecycles.map((l) => (
              <option key={l} value={l}>
                {l || "All lifecycle states"}
              </option>
            ))}
          </select>
          <Icon name="chevrons-up-down" size={15} className="wb-select-ico" />
        </div>
        <div className="wb-select wb-u-w-150px">
          <select
            aria-label="Filter by implementation surface"
            value={f.surface}
            onChange={(e) => actions.setFilter({ surface: e.target.value })}
          >
            {surfaces.map((l) => (
              <option key={l} value={l}>
                {l || "All surfaces"}
              </option>
            ))}
          </select>
          <Icon name="chevrons-up-down" size={15} className="wb-select-ico" />
        </div>
      </div>
      <div className="wb-filterbar">
        <QueueChip
          icon="user"
          active={f.assignedToMe}
          onClick={() => actions.setFilter({ assignedToMe: !f.assignedToMe })}
        >
          Assigned to me
        </QueueChip>
        <QueueChip
          icon="git-pull-request"
          active={f.hasPR}
          onClick={() => actions.setFilter({ hasPR: !f.hasPR })}
        >
          Has PR
        </QueueChip>
        <QueueChip
          icon="alert-triangle"
          active={f.needsReview}
          onClick={() => actions.setFilter({ needsReview: !f.needsReview })}
        >
          Needs review
        </QueueChip>
        <QueueChip
          icon="x-circle"
          active={f.failed}
          onClick={() => actions.setFilter({ failed: !f.failed })}
        >
          Failed verification
        </QueueChip>
        <QueueChip
          icon="ban"
          active={f.stale}
          onClick={() => actions.setFilter({ stale: !f.stale })}
        >
          Stale downstream
        </QueueChip>
        {(f.assignedToMe ||
          f.hasPR ||
          f.needsReview ||
          f.failed ||
          f.stale ||
          f.lifecycle ||
          f.surface ||
          f.search) && (
          <button
            type="button"
            className="wb-chip"
            aria-label="Clear all queue filters"
            onClick={() =>
              actions.setFilter({
                search: "",
                assignedToMe: false,
                lifecycle: "",
                surface: "",
                hasPR: false,
                needsReview: false,
                failed: false,
                stale: false,
              })
            }
          >
            <Icon name="x" size={13} />
            Clear
          </button>
        )}
        <div className="wb-spacer wb-u-ml-auto" />
        <span className="wb-text-sm wb-muted" aria-live="polite">
          {filtered.length} of {issues.length}
        </span>
      </div>

      <Card className="wb-card--flat wb-u-overflow-hidden">
        <div
          className="wb-table-wrap cr-scroll"
          role="region"
          aria-label="Synthetic work queue"
          tabIndex={0}
        >
          <table className="wb-table">
            <caption className="wb-sr-only">
              Synthetic issues. Use the Open issue button in the first column or the action in the
              Next Action column.
            </caption>
            <thead>
              <tr>
                <th scope="col">Issue</th>
                <th scope="col">Title</th>
                <th scope="col">Domain</th>
                <th scope="col">Surface</th>
                <th scope="col">Lifecycle</th>
                <th scope="col">Current AI Stage</th>
                <th scope="col">Last Run</th>
                <th scope="col" className="wb-u-text-align-center">
                  Artifacts
                </th>
                <th scope="col">Branch</th>
                <th scope="col" className="wb-u-text-align-center">
                  PR
                </th>
                <th scope="col">Next Action</th>
                <th scope="col">Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => {
                const cs = currentStage(it);
                return (
                  <tr key={it.key}>
                    <td>
                      <button
                        type="button"
                        className="wb-row-key wb-row-link"
                        aria-label={`Open issue ${it.key}: ${it.title}`}
                        onClick={() => actions.openIssue(it.key)}
                      >
                        {it.key}
                      </button>
                    </td>
                    <td className="wb-u-min-w-210px">
                      <span className="wb-row-title">{it.title}</span>
                    </td>
                    <td className="wb-secondary wb-nowrap">{it.domain}</td>
                    <td>
                      <SurfaceBadge value={it.surface} />
                    </td>
                    <td>
                      <LifecycleBadge value={it.lifecycle} />
                    </td>
                    <td className="wb-nowrap">
                      <div className="wb-flex wb-u-gap-7px">
                        <span className="wb-secondary wb-u-text-12-5px">{cs.def.name}</span>
                        <StatusBadge status={cs.status} />
                      </div>
                    </td>
                    <td className="wb-mono wb-muted wb-nowrap wb-u-text-12px">{it.lastRun}</td>
                    <td className="wb-u-text-align-center">
                      <span className="wb-mono">{it.artifacts}</span>
                    </td>
                    <td className="wb-mono wb-muted wb-u-text-11-5px wb-u-max-w-150px wb-u-overflow-hidden wb-u-text-overflow-ellipsis wb-u-whitespace-nowrap">
                      {it.branch}
                    </td>
                    <td className="wb-u-text-align-center">
                      {it.pr ? (
                        <span className="wb-mono wb-strong wb-u-color-accent-text">#{it.pr}</span>
                      ) : (
                        <span className="wb-muted">—</span>
                      )}
                    </td>
                    <td>
                      <Btn
                        size="sm"
                        variant="secondary"
                        iconRight="arrow-right"
                        onClick={() => nextActionClick(it)}
                      >
                        {it.next.label}
                      </Btn>
                    </td>
                    <td>
                      <RiskBadge risk={it.risk} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <EmptyState
            icon="search"
            title="No issues match these filters"
            action={
              <Btn
                variant="secondary"
                onClick={() =>
                  actions.setFilter({
                    search: "",
                    assignedToMe: false,
                    lifecycle: "",
                    surface: "",
                    hasPR: false,
                    needsReview: false,
                    failed: false,
                    stale: false,
                  })
                }
              >
                Clear filters
              </Btn>
            }
          >
            Try removing a filter or clearing the search.
          </EmptyState>
        )}
      </Card>
    </div>
  );
}
