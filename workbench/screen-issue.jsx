/* ============================================================
   AI Delivery Workbench — Screen: Issue Detail
   The operational command center for a single issue: business
   context, acceptance criteria, the AI stage timeline (with
   live Run/Retry/Redo/Logs actions), and right-rail summaries.
   ============================================================ */
const { useState: useStateID } = React;

// progression metadata for "ready" stage actions
const STAGE_PROGRESS = {
  seed:      { label: "Run Seed",              lifecycle: "Intake",         next: "intake",    msg: "Workspace seeded · inputs.json captured." },
  intake:    { label: "Run Intake",            lifecycle: "Spec",           next: "spec",      msg: "intake.md generated with prompt provenance." },
  spec:      { label: "Generate Spec",         lifecycle: "Planning",       next: "plan",      msg: "spec.md generated with acceptance criteria." },
  plan:      { label: "Generate Plan",         lifecycle: "Planning",       next: "targets",   msg: "plan.md generated." },
  targets:   { label: "Generate Change Targets", lifecycle: "Implementation", next: "implement", msg: "change-targets.json + risk-review.md generated." },
  implement: { label: "Run Implement",         lifecycle: "Verification",   next: "verify",    msg: "Draft code committed to the feature branch." },
  verify:    { label: "Run Verify",            lifecycle: "Verification",   next: "review",    msg: "evidence.md generated · tests passed (simulated)." },
};

const CONTEXT_1150 = {
  summary: "Finance analysts hand-write budget-vs-actual variance commentary every close cycle. This issue introduces an AI-drafted commentary that an analyst reviews, edits, and explicitly approves before it can appear in a report — accelerating the narrative without removing human judgment.",
  business: [
    "Monthly reporting cycle spends meaningful analyst time on repetitive variance narratives.",
    "Draft-then-approve keeps a human accountable for every published statement.",
    "Materiality threshold (default 5% / $50k) keeps commentary focused on what matters.",
  ],
  riskNotes: "Medium — the change spans Angular, .NET, and Oracle. Primary risk is publishing commentary without review; mitigated by an approval gate enforced in both the UI and the API, behind a default-off feature flag.",
};

function genContext(issue) {
  return {
    summary: "Synthetic business context for " + issue.key + " — " + issue.title + ". This work item follows the same governed AI delivery workflow as the FIN-1150 reference issue: intake, spec, plan, change targets, implementation, verification, and a human review gate.",
    business: [
      issue.domain + " workflow improvement framed as a reviewable, traceable change.",
      "Deterministic artifacts are produced at each stage for human review.",
      "No downstream action is taken without passing the review and validation gates.",
    ],
    riskNotes: issue.risk + " — synthetic risk assessment for this demonstration issue.",
  };
}

function StageRow({ issue, stage, selected, onToggle }) {
  const { actions } = useApp();
  const id = stage.id, status = stage.status;
  const def = window.WBData.stageDefs.find((s) => s.id === id);

  const nodeClass = {
    done: "wb-tl-node--done", run: "wb-tl-node--running", fail: "wb-tl-node--failed",
    review: "wb-tl-node--review", stale: "wb-tl-node--stale", ready: "wb-tl-node--ready", none: "",
  }[status] || "";
  const nodeIcon = { done: "check", run: "loader", fail: "x", review: "alert-triangle", stale: "ban", ready: "play", none: def.icon }[status] || def.icon;

  const runReady = () => {
    if (id === "review") return markReviewReady();
    const p = STAGE_PROGRESS[id];
    actions.runStage(issue.key, id, {
      lifecycle: p.lifecycle, doneMsg: p.msg,
      onDone: () => { if (p.next && p.next !== "review") actions.setStage(issue.key, p.next, "ready"); if (p.next === "review") actions.setStage(issue.key, "review", "ready"); },
    });
  };
  const retry = () => {
    actions.runStage(issue.key, id, { doneMsg: def.name + " re-run succeeded (simulated).", onDone: () => { const p = STAGE_PROGRESS[id]; if (p && p.next) actions.setStage(issue.key, p.next, "ready"); } });
  };
  const redo = () => {
    actions.openModal({
      title: "Redo " + def.name + "?", icon: "refresh-cw", tone: "warn", confirmLabel: "Redo & mark downstream stale", cancelLabel: "Cancel",
      body: <div>Re-running <strong>{def.name}</strong> invalidates everything after it. Implement, Verify, and PR Review will be marked <strong>Stale</strong> and must be re-run. This enforces deterministic, in-order artifacts.</div>,
      onConfirm: () => actions.runStage(issue.key, id, { doneMsg: def.name + " re-run · downstream marked stale.", onDone: () => { actions.staleFrom(issue.key, "implement"); actions.toast("warn", "Downstream marked stale", "Implement → Verify → PR Review must be re-run."); } }),
    });
  };
  const markReviewReady = () => {
    actions.setStage(issue.key, "review", "review");
    actions.patchIssue(issue.key, { lifecycle: "Review Ready", flags: { needsReview: true } });
    actions.toast("success", "Marked Review Ready", "Lifecycle → Review Ready. Human review gate is now open.");
  };

  return (
    <div className="wb-tl-item">
      <div className="wb-tl-rail">
        <span className={"wb-tl-node " + nodeClass}><Icon name={nodeIcon} size={15} className={status === "run" ? "wb-spin" : ""} strokeWidth={status === "done" ? 2.4 : 1.9} /></span>
        <span className="wb-tl-line" />
      </div>
      <div className="wb-tl-body">
        <div className={"wb-tl-card" + (selected ? " is-selected" : "")}>
          <div className="wb-tl-card-head" onClick={onToggle}>
            <div style={{ minWidth: 0 }}>
              <div className="wb-flex" style={{ gap: 9 }}>
                <span className="wb-tl-stage-name">{def.name}</span>
                <StatusBadge status={status} />
                {stage.reviewerActionRequired && <Badge tone="warn" icon="user">Reviewer action</Badge>}
              </div>
              <div className="wb-tl-stage-meta wb-mt-8" style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                <span><Icon name="sparkles" size={11} /> {stage.promptVersion}</span>
                {stage.startedAt !== "—" && <span><Icon name="clock" size={11} /> {stage.startedAt}{stage.completedAt !== "—" && stage.completedAt !== "running…" ? " → " + stage.completedAt : ""}</span>}
                {stage.artifacts.length > 0 && <span><Icon name="file-code" size={11} /> {stage.artifacts.join(", ")}</span>}
              </div>
            </div>
            <div className="wb-spacer" style={{ marginLeft: "auto" }} />
            <Icon name={selected ? "chevron-down" : "chevron-right"} size={16} className="wb-muted" />
          </div>
          {selected && (
            <div className="wb-tl-detail" style={{ paddingTop: 12 }}>
              <p className="wb-text-sm wb-secondary" style={{ marginBottom: 12 }}>{def.desc}</p>
              <div className="wb-flex wb-wrap" style={{ gap: 8 }}>
                {status === "ready" && <Btn size="sm" variant="primary" icon={id === "review" ? "shield-check" : "play"} onClick={runReady}>{id === "review" ? "Mark Review Ready" : STAGE_PROGRESS[id].label}</Btn>}
                {status === "fail" && <Btn size="sm" variant="primary" icon="rotate-ccw" onClick={retry}>Retry {def.name}</Btn>}
                {status === "stale" && <Btn size="sm" variant="primary" icon="refresh-cw" onClick={retry}>Re-run {def.name}</Btn>}
                {status === "run" && <Btn size="sm" variant="secondary" disabled icon="loader"><span className="wb-spin" style={{ display: "inline-flex" }}><Icon name="loader" size={13} /></span>Running…</Btn>}
                {status === "done" && (id === "plan" || id === "targets") && <Btn size="sm" variant="secondary" icon="refresh-cw" onClick={redo}>Redo {def.name}</Btn>}
                {status === "review" && <Btn size="sm" variant="primary" icon="git-pull-request" onClick={() => actions.navigate("github", issue.key)}>Open human review</Btn>}
                {stage.artifacts.length > 0 && <Btn size="sm" variant="secondary" icon="file-code" onClick={() => { actions.selectArtifact(issue.key, stage.artifacts[0]); actions.navigate("artifacts", issue.key); }}>View artifact</Btn>}
                {stage.logsAvailable && <Btn size="sm" variant="ghost" icon="terminal" onClick={() => actions.openLogs(issue.key, id)}>View logs</Btn>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function IssueDetail() {
  const { state, actions } = useApp();
  const issue = state.issues[state.selectedKey];
  const stages = window.WBData.buildStages(issue);
  const cs = currentStage(issue);
  const ctx = issue.key === "FIN-1150" ? CONTEXT_1150 : genContext(issue);
  const val = window.WBData.validationFor(issue);
  const pr = window.WBData.prFor(issue);
  const artifacts = window.WBData.artifactsFor(issue);
  const [open, setOpen] = useStateID(cs.id);

  // primary next action
  const nextStage = stages.find((s) => s.status === "ready") || stages.find((s) => s.status === "fail") || stages.find((s) => s.status === "review") || stages.find((s) => s.status === "stale");
  const primary = (() => {
    if (!nextStage) return null;
    const s = nextStage;
    if (s.status === "ready") return { label: s.id === "review" ? "Mark Review Ready" : STAGE_PROGRESS[s.id].label, icon: s.id === "review" ? "shield-check" : "play", run: () => triggerReady(s) };
    if (s.status === "fail") return { label: "Retry " + s.name, icon: "rotate-ccw", run: () => triggerReady(s, true) };
    if (s.status === "review") return { label: "Open human review", icon: "git-pull-request", run: () => actions.navigate("github", issue.key) };
    if (s.status === "stale") return { label: "Re-run " + s.name, icon: "refresh-cw", run: () => triggerReady(s, true) };
    return null;
  })();

  function triggerReady(s, retry) {
    setOpen(s.id);
    if (s.id === "review") {
      actions.setStage(issue.key, "review", "review");
      actions.patchIssue(issue.key, { lifecycle: "Review Ready", flags: { needsReview: true } });
      actions.toast("success", "Marked Review Ready", "Lifecycle → Review Ready. Human review gate is now open.");
      return;
    }
    const p = STAGE_PROGRESS[s.id];
    actions.runStage(issue.key, s.id, { lifecycle: p && p.lifecycle, doneMsg: p ? p.msg : "Completed.", onDone: () => { if (p && p.next) actions.setStage(issue.key, p.next, "ready"); } });
  }

  const valTone = { Passed: "safe", "In Progress": "accent", Failed: "danger", Blocked: "danger", "Not Started": "neutral", Pending: "warn" };

  return (
    <div className="wb-page wb-page-wide">
      {/* Contextual action bar */}
      <Card className="wb-mb-16" style={{ position: "sticky", top: 0, zIndex: 5 }}>
        <div className="wb-card-body wb-between wb-wrap" style={{ gap: 14 }}>
          <div style={{ minWidth: 0 }}>
            <div className="wb-flex" style={{ gap: 10 }}>
              <span className="wb-row-key" style={{ fontSize: 14 }}>{issue.key}</span>
              <LifecycleBadge value={issue.lifecycle} />
              <RiskBadge risk={issue.risk} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "-0.01em", marginTop: 6 }}>{issue.title}</div>
            <div className="wb-text-sm wb-muted wb-mt-8 wb-flex" style={{ gap: 8 }}>
              <Icon name="circle-dot" size={13} /> Current stage: <strong className="wb-secondary">{cs.def.name}</strong> <StatusBadge status={cs.status} />
            </div>
          </div>
          <div className="wb-spacer" style={{ marginLeft: "auto" }} />
          <div className="wb-flex wb-wrap" style={{ gap: 8 }}>
            <Btn variant="secondary" icon="git-pull-request" onClick={() => actions.navigate("github", issue.key)}>{issue.pr ? "PR #" + issue.pr : "PR readiness"}</Btn>
            {primary && <Btn variant="primary" icon={primary.icon} onClick={primary.run}>{primary.label}</Btn>}
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1.7fr) minmax(0,1fr)", gap: 16, alignItems: "start" }}>
        {/* Left column */}
        <div className="wb-stack">
          {primary && (
            <Banner tone={nextStage && nextStage.status === "fail" ? "danger" : nextStage && (nextStage.status === "review" || nextStage.status === "stale") ? "warn" : "info"} title="Next best action">
              {nextStage && nextStage.status === "fail" && <>The <strong>{nextStage.name}</strong> stage failed. Inspect the logs and retry — downstream stages stay blocked until it passes.</>}
              {nextStage && nextStage.status === "ready" && <>This issue is ready to <strong>{primary.label.toLowerCase()}</strong>. Output is recorded as a reviewable artifact with prompt provenance.</>}
              {nextStage && nextStage.status === "review" && <>Implementation and verification are complete. This change is waiting on the <strong>human review gate</strong> before it is release-eligible.</>}
              {nextStage && nextStage.status === "stale" && <>A plan change marked downstream stages stale. <strong>Re-run {nextStage.name}</strong> to restore a consistent, in-order artifact chain.</>}
            </Banner>
          )}

          <Card>
            <CardHead icon="file-text" title="Business context" />
            <div className="wb-card-body">
              <p className="wb-secondary" style={{ fontSize: 13.5, lineHeight: 1.6 }}>{ctx.summary}</p>
              <div className="wb-md" style={{ marginTop: 6 }}><ul>{ctx.business.map((b, i) => <li key={i}>{b}</li>)}</ul></div>
              <div className="wb-banner wb-banner--warn wb-mt-12"><Icon name="shield-alert" size={16} className="wb-banner-ico" /><div><span className="wb-banner-title">Risk notes</span><div style={{ marginTop: 2 }}>{ctx.riskNotes}</div></div></div>
            </div>
          </Card>

          <Card>
            <CardHead icon="list-checks" title="Acceptance criteria" actions={<Badge tone="neutral">{val.acceptance.filter((a) => a.status === "Passed").length}/{val.acceptance.length} passed</Badge>} />
            <div className="wb-card-body wb-card-body--tight">
              {val.acceptance.map((a, i) => (
                <div key={a.id} className="wb-flex" style={{ gap: 10, padding: "10px 16px", borderBottom: i < val.acceptance.length - 1 ? "1px solid var(--border-subtle)" : "none" }}>
                  <span className="wb-mono wb-muted" style={{ fontSize: 11.5, flex: "none", width: 34 }}>{a.id}</span>
                  <span style={{ fontSize: 13, flex: 1 }}>{a.text}</span>
                  <Badge tone={valTone[a.status] || "neutral"} icon={a.status === "Passed" ? "check" : a.status === "Failed" ? "x" : a.status === "In Progress" ? "loader" : "circle-dashed"}>{a.status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead icon="workflow" title="AI delivery workflow" sub="Eight deterministic stages · human review gate before release" actions={<Badge tone="accent" icon="sparkles">Governed</Badge>} />
            <div className="wb-card-body">
              <div className="wb-timeline">
                {stages.map((s) => <StageRow key={s.id} issue={issue} stage={s} selected={open === s.id} onToggle={() => setOpen(open === s.id ? null : s.id)} />)}
              </div>
            </div>
          </Card>
        </div>

        {/* Right rail */}
        <div className="wb-stack">
          <Card>
            <CardHead icon="info" title="Issue" />
            <div className="wb-card-body">
              <Kv rows={[
                ["Domain", issue.domain],
                ["Surface", <SurfaceBadge value={issue.surface} />],
                ["Branch", <span className="wb-mono wb-text-sm" style={{ color: "var(--accent-text)" }}>{issue.branch}</span>],
                ["Target surfaces", "Angular · C#/.NET API · Oracle"],
              ]} />
              <hr className="wb-divider" />
              <div className="wb-flex-col" style={{ gap: 10 }}>
                {[["Owner", issue.assignee], ["Reviewer", issue.reviewer], ["Tester", issue.tester]].map(([role, who]) => (
                  <div key={role} className="wb-flex" style={{ gap: 10 }}>
                    <Avatar name={who} sm />
                    <div><div className="wb-text-sm wb-strong">{who}</div><div className="wb-muted" style={{ fontSize: 11.5 }}>{role}</div></div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <CardHead icon="file-code" title="Latest artifacts" actions={<Btn size="sm" variant="ghost" iconRight="arrow-right" onClick={() => actions.navigate("artifacts", issue.key)}>All</Btn>} />
            <div className="wb-card-body wb-card-body--tight">
              {artifacts.length === 0 && <div style={{ padding: 16 }}><span className="wb-muted wb-text-sm">No artifacts yet — run the workflow to generate them.</span></div>}
              {artifacts.slice(-4).reverse().map((a, i) => (
                <div key={a.id} className="wb-flex wb-clickable" style={{ gap: 10, padding: "10px 16px", borderBottom: i < Math.min(4, artifacts.length) - 1 ? "1px solid var(--border-subtle)" : "none" }}
                  onClick={() => { actions.selectArtifact(issue.key, a.name); actions.navigate("artifacts", issue.key); }}>
                  <Icon name={a.type === "JSON" ? "file-code" : "file-text"} size={15} className="wb-muted" />
                  <span className="wb-mono wb-text-sm" style={{ flex: 1 }}>{a.name}</span>
                  <span className="wb-muted" style={{ fontSize: 11 }}>{a.stage}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead icon="git-pull-request" title="PR readiness" />
            <div className="wb-card-body">
              {issue.pr ? (
                <div className="wb-stack-sm">
                  <div className="wb-between"><span className="wb-text-sm wb-secondary">Pull request</span><span className="wb-mono wb-strong" style={{ color: "var(--accent-text)" }}>#{issue.pr}</span></div>
                  <div className="wb-between"><span className="wb-text-sm wb-secondary">Status</span><Badge tone={issue.prStatus === "Open" || issue.prStatus === "Ready for review" ? "accent" : "neutral"}>{issue.prStatus}</Badge></div>
                  <div className="wb-between"><span className="wb-text-sm wb-secondary">Checks</span><span className="wb-text-sm"><span style={{ color: "var(--safe)" }}>{pr.checks.filter((c) => c.status === "pass").length} pass</span>{pr.checks.some((c) => c.status === "fail") ? <span style={{ color: "var(--danger)" }}> · {pr.checks.filter((c) => c.status === "fail").length} fail</span> : ""}{pr.checks.some((c) => c.status === "pending" || c.status === "required") ? <span style={{ color: "var(--warn)" }}> · {pr.checks.filter((c) => c.status === "pending" || c.status === "required").length} open</span> : ""}</span></div>
                  <Btn size="sm" variant="secondary" className="wb-btn--block wb-mt-8" iconRight="arrow-right" onClick={() => actions.navigate("github", issue.key)}>Open PR readiness</Btn>
                </div>
              ) : <EmptyState icon="git-pull-request" title="No PR yet">Run through Implement, then create a mock PR on the GitHub screen.</EmptyState>}
            </div>
          </Card>

          <Card>
            <CardHead icon="flask" title="Validation status" />
            <div className="wb-card-body wb-stack-sm">
              <div className="wb-between"><span className="wb-text-sm wb-secondary">Decision</span><Badge tone={valTone[val.decision] || "neutral"}>{val.decision}</Badge></div>
              <div className="wb-between"><span className="wb-text-sm wb-secondary">Evidence</span><Badge tone={valTone[val.evidenceStatus] || "neutral"}>{val.evidenceStatus}</Badge></div>
              <Progress value={Math.round(val.acceptance.filter((a) => a.status === "Passed").length / val.acceptance.length * 100)} tone="safe" />
              <Btn size="sm" variant="secondary" className="wb-btn--block wb-mt-8" iconRight="arrow-right" onClick={() => actions.navigate("validation", issue.key)}>Open validation evidence</Btn>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { IssueDetail });
