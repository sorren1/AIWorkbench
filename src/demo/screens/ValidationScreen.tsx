import { useState } from "react";

import { validationFor } from "../data/content";
import { issues } from "../data/fixtures";
import type { Tone, ValidationStatus } from "../data/types";
import { useApp, useIssue } from "../state/store";
import { Icon, type IconName } from "../../shared/Icon";
import {
  Avatar,
  Badge,
  Banner,
  Btn,
  Card,
  CardHead,
  IconBtn,
  Kv,
  Progress,
} from "../components/primitives";

/* ============================================================
   AI Delivery Workbench — Screen: Validation Evidence
   QA handoff + audit trail: acceptance, scenarios, assumptions,
   tester notes, and a final validation decision.
   ============================================================ */
const VAL_TONE: Record<ValidationStatus, Tone> = {
  Passed: "safe",
  "In Progress": "accent",
  Failed: "danger",
  Blocked: "danger",
  "Not Started": "neutral",
  Pending: "warn",
  Complete: "safe",
};
const VAL_ICON: Record<ValidationStatus, IconName> = {
  Passed: "check-circle",
  "In Progress": "loader",
  Failed: "x-circle",
  Blocked: "ban",
  "Not Started": "circle-dashed",
  Pending: "clock",
  Complete: "check-circle",
};

function StatusPill({ status }: { readonly status: ValidationStatus }) {
  return (
    <Badge tone={VAL_TONE[status]} icon={VAL_ICON[status]}>
      {status}
    </Badge>
  );
}

export function ValidationScreen() {
  const { state, actions } = useApp();
  const issue = useIssue(state.selectedKey);
  const base = validationFor(issue);
  const ov = state.valState[issue.key] || {};
  const [noteText, setNoteText] = useState("");

  const scen = base.scenarios.map((s) => ({
    ...s,
    status: (ov.scenarios && ov.scenarios[s.name]) || s.status,
  }));
  const notes = [...(base.testerNotes || []), ...(ov.notes || [])];
  const decision = ov.decision || base.decision;
  const evidence = ov.evidenceStatus || base.evidenceStatus;
  const started = ov.started || ["In Progress", "Passed", "Failed"].includes(base.evidenceStatus);
  const allPassed = scen.length > 0 && scen.every((s) => s.status === "Passed");
  const passedScenarioCount = scen.filter((s) => s.status === "Passed").length;
  const scenarioProgress = Math.round((passedScenarioCount / Math.max(1, scen.length)) * 100);

  const setScenario = (name: string, status: Extract<ValidationStatus, "Passed" | "Failed">) => {
    actions.setVal(issue.key, { scenarios: { ...(ov.scenarios || {}), [name]: status } });
    actions.toast(
      status === "Passed" ? "success" : "error",
      "Test " + (status === "Passed" ? "passed" : "failed"),
      name + " marked " + status + ".",
    );
  };
  const start = () => {
    actions.setVal(issue.key, {
      started: true,
      evidenceStatus: "In Progress",
      decision: "Pending",
    });
    actions.toast("info", "Validation started", "Tester assigned · evidence set to In Progress.");
  };
  const requestFixes = () => {
    actions.setVal(issue.key, { decision: "Blocked", evidenceStatus: "Blocked" });
    actions.patchIssue(issue.key, { lifecycle: "Implementation" });
    actions.toast(
      "warn",
      "Fixes requested",
      "Routed back to implementation — downstream evidence held.",
    );
  };
  const complete = () => {
    if (!allPassed) {
      actions.toast(
        "warn",
        "Tests not all passing",
        "Every scenario must pass before evidence can be marked complete.",
      );
      return;
    }
    actions.setVal(issue.key, { decision: "Passed", evidenceStatus: "Complete" });
    actions.toast(
      "success",
      "Evidence marked complete",
      "Final validation passed — change is merge-eligible (simulated).",
    );
  };
  const addNote = () => {
    if (!noteText.trim()) return;
    actions.setVal(issue.key, {
      notes: [
        ...(ov.notes || []),
        {
          author: issue.tester !== "—" ? issue.tester : "Synthetic tester A",
          time: "just now",
          text: noteText.trim(),
        },
      ],
    });
    setNoteText("");
    actions.toast(
      "success",
      "Synthetic tester note added",
      "Appended to the browser-local evidence fixture.",
    );
  };

  return (
    <div className="wb-page wb-page-wide">
      <div className="wb-page-head">
        <div>
          <div className="eyebrow wb-mb-8">
            <Icon name="flask" size={13} /> QA handoff &amp; audit trail
          </div>
          <h1 className="wb-page-title">Validation Evidence</h1>
          <div className="wb-page-desc">
            Synthetic acceptance coverage, test scenarios, data assumptions, tester personas, and
            metrics demonstrate how evidence and a final human decision can travel with a change.
            Decisions update browser-local state only.
          </div>
        </div>
        <div className="wb-spacer" />
        <div className="wb-flex wb-inline-field" style={{ gap: 8 }}>
          <label className="wb-text-sm wb-muted" htmlFor="validation-issue-select">
            Issue
          </label>
          <div className="wb-select" style={{ width: 230 }}>
            <select
              id="validation-issue-select"
              value={issue.key}
              onChange={(e) => actions.navigate("validation", e.target.value)}
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

      {/* Action bar */}
      <Card className="wb-mb-16">
        <div className="wb-card-body wb-between wb-wrap" style={{ gap: 12 }}>
          <div className="wb-flex" style={{ gap: 10 }}>
            <span className="wb-text-sm wb-secondary">Final decision</span>
            <StatusPill status={decision} />
            <span className="wb-muted">·</span>
            <span className="wb-text-sm wb-secondary">Evidence</span>
            <StatusPill status={evidence} />
          </div>
          <div className="wb-spacer" style={{ marginLeft: "auto" }} />
          <div className="wb-flex wb-wrap" style={{ gap: 8 }}>
            {!started && (
              <Btn size="sm" variant="primary" icon="play" onClick={start}>
                Start validation
              </Btn>
            )}
            <Btn size="sm" variant="danger" icon="rotate-ccw" onClick={requestFixes}>
              Request fixes
            </Btn>
            <Btn size="sm" variant="primary" icon="shield-check" onClick={complete}>
              Mark evidence complete
            </Btn>
          </div>
        </div>
      </Card>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0,1.7fr) minmax(0,1fr)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div className="wb-stack">
          <Card>
            <CardHead
              icon="list-checks"
              title="Acceptance criteria coverage"
              actions={
                <Badge tone="neutral">
                  {base.acceptance.filter((a) => a.status === "Passed").length}/
                  {base.acceptance.length}
                </Badge>
              }
            />
            <div className="wb-card-body wb-card-body--tight">
              {base.acceptance.map((a, i) => (
                <div
                  key={a.id}
                  className="wb-flex"
                  style={{
                    gap: 10,
                    padding: "10px 16px",
                    borderBottom:
                      i < base.acceptance.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  <span
                    className="wb-mono wb-muted"
                    style={{ fontSize: 11.5, width: 34, flex: "none" }}
                  >
                    {a.id}
                  </span>
                  <span style={{ fontSize: 13, flex: 1 }}>{a.text}</span>
                  <StatusPill status={a.status} />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <CardHead
              icon="flask"
              title="Test scenarios"
              sub="Mark each scenario as you validate"
            />
            <div className="wb-card-body wb-card-body--tight">
              {scen.map((s, i) => (
                <div
                  key={s.name}
                  className="wb-flex wb-wrap"
                  style={{
                    gap: 10,
                    padding: "11px 16px",
                    borderBottom: i < scen.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div className="wb-text-sm wb-strong">{s.name}</div>
                    {s.note && (
                      <div className="wb-mono wb-muted" style={{ fontSize: 11, marginTop: 2 }}>
                        {s.note}
                      </div>
                    )}
                  </div>
                  <StatusPill status={s.status} />
                  <div className="wb-flex" style={{ gap: 6 }}>
                    <IconBtn
                      icon="check"
                      size="sm"
                      title="Mark passed"
                      onClick={() => setScenario(s.name, "Passed")}
                    />
                    <IconBtn
                      icon="x"
                      size="sm"
                      title="Mark failed"
                      onClick={() => setScenario(s.name, "Failed")}
                    />
                  </div>
                </div>
              ))}
              {scen.length === 0 && (
                <div style={{ padding: 16 }}>
                  <span className="wb-muted wb-text-sm">No scenarios defined.</span>
                </div>
              )}
            </div>
          </Card>

          <div className="wb-grid wb-grid-2">
            <Card>
              <CardHead icon="database" title="Oracle data assumptions" />
              <div className="wb-card-body">
                <div className="wb-md">
                  <ul style={{ margin: 0 }}>
                    {base.oracleAssumptions.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
            <Card>
              <CardHead icon="cpu" title="API validation notes" />
              <div className="wb-card-body">
                <div className="wb-md">
                  <ul style={{ margin: 0 }}>
                    {base.apiNotes.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
            <Card>
              <CardHead icon="box" title="Angular UI validation notes" />
              <div className="wb-card-body">
                <div className="wb-md">
                  <ul style={{ margin: 0 }}>
                    {base.uiNotes.map((x, i) => (
                      <li key={i}>{x}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
            <Card>
              <CardHead icon="shield-check" title="Security &amp; access review" />
              <div className="wb-card-body wb-stack-sm">
                <div className="wb-between">
                  <span className="wb-text-sm wb-secondary">Permission / RBAC review</span>
                  <StatusPill status={base.security} />
                </div>
                <div className="wb-between">
                  <span className="wb-text-sm wb-secondary">Secrets in output</span>
                  <Badge tone="safe" icon="check">
                    None
                  </Badge>
                </div>
                <div className="wb-between">
                  <span className="wb-text-sm wb-secondary">Accessibility check</span>
                  <StatusPill status={base.a11y} />
                </div>
              </div>
            </Card>
          </div>

          <Card>
            <CardHead icon="scroll-text" title="Tester notes" sub="Append-only evidence log" />
            <div className="wb-card-body wb-card-body--tight">
              {notes.length === 0 && (
                <div style={{ padding: 16 }}>
                  <span className="wb-muted wb-text-sm">No tester notes yet.</span>
                </div>
              )}
              {notes.map((n, i) => (
                <div
                  key={i}
                  className="wb-flex"
                  style={{
                    gap: 11,
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--border-subtle)",
                    alignItems: "flex-start",
                  }}
                >
                  <Avatar name={n.author} sm />
                  <div style={{ flex: 1 }}>
                    <div className="wb-flex" style={{ gap: 8 }}>
                      <span className="wb-text-sm wb-strong">{n.author}</span>
                      <span className="wb-mono wb-muted" style={{ fontSize: 11 }}>
                        {n.time}
                      </span>
                    </div>
                    <div className="wb-secondary" style={{ fontSize: 13, marginTop: 3 }}>
                      {n.text}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="wb-card-foot" style={{ gap: 8 }}>
              <label className="wb-sr-only" htmlFor="tester-note-input">
                Add a synthetic tester note
              </label>
              <input
                id="tester-note-input"
                className="wb-input"
                placeholder="Add a tester note…"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote()}
              />
              <Btn size="sm" variant="secondary" icon="plus" onClick={addNote}>
                Add note
              </Btn>
            </div>
          </Card>
        </div>

        {/* Right rail */}
        <div className="wb-stack">
          <Card>
            <CardHead icon="git-commit" title="Tested build" />
            <div className="wb-card-body">
              <Kv
                rows={[
                  [
                    "Branch",
                    <span className="wb-mono wb-text-sm" style={{ color: "var(--accent-text)" }}>
                      {base.branch}
                    </span>,
                  ],
                  ["Commit", <span className="wb-mono wb-text-sm">{base.commitSha}</span>],
                  ["Environment", "QA (simulated)"],
                ]}
              />
            </div>
          </Card>
          <Card>
            <CardHead icon="check-circle" title="Validation summary" />
            <div className="wb-card-body wb-stack-sm">
              <Progress
                value={scenarioProgress}
                tone={allPassed ? "safe" : "warn"}
                label="Validation scenario completion"
                valueText={`${passedScenarioCount} of ${scen.length} scenarios passed`}
              />
              <div className="wb-between">
                <span className="wb-text-sm wb-secondary">Scenarios passed</span>
                <span className="wb-mono wb-strong">
                  {scen.filter((s) => s.status === "Passed").length}/{scen.length}
                </span>
              </div>
              <div className="wb-between">
                <span className="wb-text-sm wb-secondary">Acceptance passed</span>
                <span className="wb-mono wb-strong">
                  {base.acceptance.filter((a) => a.status === "Passed").length}/
                  {base.acceptance.length}
                </span>
              </div>
              <div className="wb-between">
                <span className="wb-text-sm wb-secondary">Environment readiness</span>
                <Badge tone="safe" icon="check">
                  Ready
                </Badge>
              </div>
              <hr className="wb-divider" />
              <div className="wb-between">
                <span className="wb-text-sm wb-secondary">Final decision</span>
                <StatusPill status={decision} />
              </div>
            </div>
          </Card>
          <Banner tone="neutral" icon="shield">
            Validation evidence is recorded immutably and linked to the issue, the PR, and the
            tested commit — so the audit trail stays intact after release.
          </Banner>
        </div>
      </div>
    </div>
  );
}
