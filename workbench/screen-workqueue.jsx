/* ============================================================
   AI Delivery Workbench — Screen: Work Queue (the cockpit)
   ============================================================ */
const { useApp: _useAppWQ } = window;

// Shared helper: which stage is "current" for an issue
function currentStage(issue) {
  const defs = window.WBData.stageDefs;
  let idx = issue.s.findIndex((v) => v === "run" || v === "fail" || v === "review");
  if (idx === -1) idx = issue.s.findIndex((v) => v === "ready");
  if (idx === -1) { // all done or none — pick last done, else first
    const lastDone = issue.s.lastIndexOf("done");
    idx = lastDone === -1 ? 0 : lastDone;
  }
  return { def: defs[idx], status: issue.s[idx], idx };
}
window.currentStage = currentStage;

function QueueChip({ active, icon, onClick, children }) {
  return <div className={"wb-chip" + (active ? " is-active" : "")} onClick={onClick}>
    <Icon name={icon} size={13} />{children}
  </div>;
}

function WorkQueue() {
  const { state, actions } = useApp();
  const f = state.filters;
  const issues = window.WBData.issues.map((i) => state.issues[i.key]);

  const filtered = issues.filter((it) => {
    if (f.search && !(it.key + " " + it.title).toLowerCase().includes(f.search.toLowerCase())) return false;
    if (f.assignedToMe && it.assignee !== window.WBData.meta.user.name) return false;
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

  const nextActionClick = (e, it) => {
    e.stopPropagation();
    const tgt = it.next.target;
    if (tgt === "issue") actions.openIssue(it.key);
    else actions.navigate(tgt, it.key);
  };

  const lifecycles = ["", ...Array.from(new Set(window.WBData.issues.map((i) => i.lifecycle)))];
  const surfaces = ["", ...window.WBData.surfaces];

  return (
    <div className="wb-page wb-page-wide">
      <div className="wb-page-head">
        <div>
          <div className="eyebrow wb-mb-8"><Icon name="layout-grid" size={13} /> Cockpit</div>
          <div className="wb-page-title">Work Queue</div>
          <div className="wb-page-desc">Every governed AI delivery run in one place — what needs attention, what stage it is in, and the next best action. Click any issue to open its command center.</div>
        </div>
        <div className="wb-spacer" />
        <Btn variant="secondary" icon="refresh-cw" onClick={() => actions.toast("info", "Syncing Jira (simulated)", "No real Jira connection — demo mode.")}>Sync Jira</Btn>
      </div>

      <div className="wb-grid wb-grid-4 wb-mb-16">
        <StatTile label="Active runs" icon="workflow" value={totals.all} meta="across 7 finance domains" />
        <StatTile label="Needs human review" icon="alert-triangle" value={totals.review} meta={totals.review ? "awaiting reviewer gate" : "all clear"} metaTone={totals.review ? "warn" : "safe"} />
        <StatTile label="Failed verification" icon="x-circle" value={totals.failed} meta={totals.failed ? "blocked — fixes required" : "none"} metaTone={totals.failed ? "danger" : "safe"} />
        <StatTile label="Stale downstream" icon="ban" value={totals.stale} meta={totals.stale ? "re-run required after redo" : "none"} metaTone={totals.stale ? "warn" : "safe"} />
      </div>

      <div className="wb-filterbar">
        <div className="wb-search">
          <Icon name="search" size={16} />
          <input placeholder="Search issues by key or title…" value={f.search} onChange={(e) => actions.setFilter({ search: e.target.value })} />
        </div>
        <div className="wb-select" style={{ width: 160 }}>
          <select value={f.lifecycle} onChange={(e) => actions.setFilter({ lifecycle: e.target.value })}>
            {lifecycles.map((l) => <option key={l} value={l}>{l || "All lifecycle states"}</option>)}
          </select>
          <Icon name="chevrons-up-down" size={15} className="wb-select-ico" />
        </div>
        <div className="wb-select" style={{ width: 150 }}>
          <select value={f.surface} onChange={(e) => actions.setFilter({ surface: e.target.value })}>
            {surfaces.map((l) => <option key={l} value={l}>{l || "All surfaces"}</option>)}
          </select>
          <Icon name="chevrons-up-down" size={15} className="wb-select-ico" />
        </div>
      </div>
      <div className="wb-filterbar">
        <QueueChip icon="user" active={f.assignedToMe} onClick={() => actions.setFilter({ assignedToMe: !f.assignedToMe })}>Assigned to me</QueueChip>
        <QueueChip icon="git-pull-request" active={f.hasPR} onClick={() => actions.setFilter({ hasPR: !f.hasPR })}>Has PR</QueueChip>
        <QueueChip icon="alert-triangle" active={f.needsReview} onClick={() => actions.setFilter({ needsReview: !f.needsReview })}>Needs review</QueueChip>
        <QueueChip icon="x-circle" active={f.failed} onClick={() => actions.setFilter({ failed: !f.failed })}>Failed verification</QueueChip>
        <QueueChip icon="ban" active={f.stale} onClick={() => actions.setFilter({ stale: !f.stale })}>Stale downstream</QueueChip>
        {(f.assignedToMe || f.hasPR || f.needsReview || f.failed || f.stale || f.lifecycle || f.surface || f.search) && (
          <div className="wb-chip" onClick={() => actions.setFilter({ search: "", assignedToMe: false, lifecycle: "", surface: "", hasPR: false, needsReview: false, failed: false, stale: false })}>
            <Icon name="x" size={13} />Clear
          </div>
        )}
        <div className="wb-spacer" style={{ marginLeft: "auto" }} />
        <span className="wb-text-sm wb-muted">{filtered.length} of {issues.length}</span>
      </div>

      <Card className="wb-card--flat" style={{ overflow: "hidden" }}>
        <div className="wb-table-wrap cr-scroll">
          <table className="wb-table">
            <thead>
              <tr>
                <th>Issue</th><th>Title</th><th>Domain</th><th>Surface</th>
                <th>Lifecycle</th><th>Current AI Stage</th><th>Last Run</th>
                <th style={{ textAlign: "center" }}>Artifacts</th><th>Branch</th>
                <th style={{ textAlign: "center" }}>PR</th><th>Next Action</th><th>Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((it) => {
                const cs = currentStage(it);
                return (
                  <tr key={it.key} onClick={() => actions.openIssue(it.key)}>
                    <td><span className="wb-row-key">{it.key}</span></td>
                    <td style={{ minWidth: 210 }}><span className="wb-row-title">{it.title}</span></td>
                    <td className="wb-secondary wb-nowrap">{it.domain}</td>
                    <td><SurfaceBadge value={it.surface} /></td>
                    <td><LifecycleBadge value={it.lifecycle} /></td>
                    <td className="wb-nowrap">
                      <div className="wb-flex" style={{ gap: 7 }}>
                        <span className="wb-secondary" style={{ fontSize: 12.5 }}>{cs.def.name}</span>
                        <StatusBadge status={cs.status} />
                      </div>
                    </td>
                    <td className="wb-mono wb-muted wb-nowrap" style={{ fontSize: 12 }}>{it.lastRun}</td>
                    <td style={{ textAlign: "center" }}><span className="wb-mono">{it.artifacts}</span></td>
                    <td className="wb-mono wb-muted" style={{ fontSize: 11.5, maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.branch}</td>
                    <td style={{ textAlign: "center" }}>{it.pr ? <span className="wb-mono wb-strong" style={{ color: "var(--accent-text)" }}>#{it.pr}</span> : <span className="wb-muted">—</span>}</td>
                    <td><Btn size="sm" variant="secondary" iconRight="arrow-right" onClick={(e) => nextActionClick(e, it)}>{it.next.label}</Btn></td>
                    <td><RiskBadge risk={it.risk} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <EmptyState icon="search" title="No issues match these filters" action={<Btn variant="secondary" onClick={() => actions.setFilter({ search: "", assignedToMe: false, lifecycle: "", surface: "", hasPR: false, needsReview: false, failed: false, stale: false })}>Clear filters</Btn>}>Try removing a filter or clearing the search.</EmptyState>}
      </Card>
    </div>
  );
}

Object.assign(window, { WorkQueue, currentStage });
