import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";

import {
  BrandMark,
  DrawerHost,
  Header,
  ModalHost,
  Sidebar,
  ToastHost,
  useTheme,
} from "./components/AppShell";
import { Btn } from "./components/primitives";
import { meta } from "./data/fixtures";
import { ArtifactsScreen } from "./screens/ArtifactsScreen";
import { GitHubScreen } from "./screens/GitHubScreen";
import { IssueDetail } from "./screens/IssueScreen";
import { ValidationScreen } from "./screens/ValidationScreen";
import { ApprovalInboxScreen } from "./screens/ApprovalInboxScreen";
import { WorkQueue } from "./screens/WorkQueueScreen";
import { useApp } from "./state/store";
import { clearPreferences } from "./state/preferences";
import { clearBrowserAuthorizationState } from "./authorization/browserStore";
import { DEMO_SCENARIOS, isDemoScenarioId, type DemoScenarioId } from "./state/scenarios";
import { Icon } from "../shared/Icon";
import {
  configurePrincipalWalkthroughUrl,
  PRINCIPAL_WALKTHROUGH_ID,
  PRINCIPAL_WALKTHROUGH_STEPS,
  principalWalkthroughStepAt,
  principalWalkthroughStepIndex,
} from "./walkthrough/principalWalkthrough";
import {
  isPrincipalReplayRequest,
  queuePrincipalApprovalReplay,
} from "./walkthrough/approvalReplay";

const ArchitectureScreen = lazy(async () => ({
  default: (await import("./screens/ArchitectureScreen")).ArchitectureScreen,
}));
const GuidedWalkthrough = lazy(async () => ({
  default: (await import("./components/GuidedWalkthrough")).GuidedWalkthrough,
}));
const ControlPlaneScreen = lazy(async () => ({
  default: (await import("./screens/ControlPlaneScreen")).ControlPlaneScreen,
}));
const RunTraceScreen = lazy(async () => ({
  default: (await import("./screens/RunTraceScreen")).RunTraceScreen,
}));
const SettingsScreen = lazy(async () => ({
  default: (await import("./screens/SettingsScreen")).SettingsScreen,
}));

/* ============================================================
   AI Delivery Workbench — Root app + router
   ============================================================ */
function Screen() {
  const { state } = useApp();
  let screen;
  switch (state.route) {
    case "queue":
      screen = <WorkQueue />;
      break;
    case "issue":
      screen = <IssueDetail />;
      break;
    case "artifacts":
      screen = <ArtifactsScreen />;
      break;
    case "github":
      screen = <GitHubScreen />;
      break;
    case "validation":
      screen = <ValidationScreen />;
      break;
    case "approvals":
      screen = <ApprovalInboxScreen />;
      break;
    case "control-plane":
      screen = <ControlPlaneScreen />;
      break;
    case "trace":
      screen = <RunTraceScreen />;
      break;
    case "architecture":
      screen = <ArchitectureScreen />;
      break;
    case "settings":
      screen = <SettingsScreen />;
      break;
    default:
      screen = <WorkQueue />;
  }
  return (
    <Suspense fallback={<div role="status">Loading local demo screen…</div>}>{screen}</Suspense>
  );
}

function Footer() {
  return (
    <footer style={{ maxWidth: 1320, margin: "0 auto", padding: "0 26px 28px" }}>
      <div
        className="wb-flex wb-wrap"
        style={{
          gap: 10,
          padding: "14px 0 0",
          borderTop: "1px solid var(--border-subtle)",
          color: "var(--text-tertiary)",
          fontSize: 12,
        }}
      >
        <Icon name="shield-check" size={14} />
        <span>
          Independent portfolio prototype · synthetic fixtures · local workflow state is functional
        </span>
        <span className="wb-spacer" style={{ marginLeft: "auto" }} />
        <span className="wb-mono">
          {meta.product} · v{meta.version}
        </span>
      </div>
    </footer>
  );
}

function walkthroughStepFromQuery(): number {
  return principalWalkthroughStepIndex(new URLSearchParams(window.location.search).get("tourStep"));
}

function updateWalkthroughQuery(open: boolean, stepIndex = 0): void {
  let url = new URL(window.location.href);
  if (open) {
    url = configurePrincipalWalkthroughUrl(url, stepIndex);
  } else {
    url.searchParams.delete("walkthrough");
    url.searchParams.delete("tourStep");
  }
  url.searchParams.delete("tour");
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function DemoControls({
  walkthroughOpen,
  onOpenWalkthrough,
  onApplyScenario,
  onRequestReset,
}: {
  readonly walkthroughOpen: boolean;
  readonly onOpenWalkthrough: () => void;
  readonly onApplyScenario: (scenarioId: DemoScenarioId) => void;
  readonly onRequestReset: () => void;
}) {
  const { state } = useApp();
  const selected =
    DEMO_SCENARIOS.find((scenario) => scenario.id === state.scenarioId) ?? DEMO_SCENARIOS[0];
  return (
    <section className="wb-demo-toolbar" aria-label="Synthetic demo controls">
      <div className="wb-demo-scenario-field">
        <label htmlFor="demo-scenario-select">Scenario seed</label>
        <div className="wb-select">
          <select
            id="demo-scenario-select"
            value={state.scenarioId}
            onChange={(event) => {
              const scenarioId = event.currentTarget.value;
              if (isDemoScenarioId(scenarioId)) onApplyScenario(scenarioId);
            }}
            aria-describedby="demo-scenario-description"
          >
            {DEMO_SCENARIOS.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.label}
              </option>
            ))}
          </select>
          <Icon name="chevrons-up-down" size={15} className="wb-select-ico" />
        </div>
      </div>
      <p id="demo-scenario-description" className="wb-demo-scenario-description" aria-live="polite">
        {selected?.description} Interactions may diverge from this deterministic starting point.
      </p>
      <div className="wb-spacer" />
      <Btn size="sm" variant="secondary" icon="workflow" onClick={onOpenWalkthrough}>
        {walkthroughOpen ? "Restart principal tour" : "7-minute principal tour"}
      </Btn>
      <Btn size="sm" variant="ghost" icon="rotate-ccw" onClick={onRequestReset}>
        Reset demo
      </Btn>
    </section>
  );
}

export function App() {
  const { state, actions } = useApp();
  const [theme, setTheme] = useTheme();
  const [walkthroughOpen, setWalkthroughOpen] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return (
      params.get("walkthrough") === "1" ||
      params.get("walkthrough") === PRINCIPAL_WALKTHROUGH_ID ||
      params.get("tour") === "1"
    );
  });
  const [walkthroughStep, setWalkthroughStep] = useState(walkthroughStepFromQuery);
  const [walkthroughSession, setWalkthroughSession] = useState(0);
  const walkthroughReturnFocus = useRef<HTMLElement | null>(null);
  const applicationShellRef = useRef<HTMLDivElement>(null);
  const openWalkthrough = useCallback(() => {
    walkthroughReturnFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setWalkthroughStep(0);
    updateWalkthroughQuery(true, 0);
    actions.navigate(principalWalkthroughStepAt(0).route);
    setWalkthroughSession((session) => session + 1);
    setWalkthroughOpen(true);
  }, [actions]);
  const closeWalkthrough = useCallback(() => {
    setWalkthroughOpen(false);
    updateWalkthroughQuery(false);
    const returnTarget = walkthroughReturnFocus.current;
    queueMicrotask(() => {
      if (returnTarget?.isConnected) returnTarget.focus();
    });
  }, []);
  const changeWalkthroughStep = useCallback(
    (stepIndex: number) => {
      const step = PRINCIPAL_WALKTHROUGH_STEPS[stepIndex];
      if (!step) return;
      setWalkthroughStep(stepIndex);
      updateWalkthroughQuery(true, stepIndex);
      actions.navigate(step.route, step.issueKey);
    },
    [actions],
  );
  const startApprovalReplay = useCallback(async () => {
    const existing = Object.values(state.approvalStore.requests).find(isPrincipalReplayRequest);
    actions.setPersona("synthetic-implementer");
    if (existing) {
      actions.navigate("approvals");
      actions.toast(
        "info",
        `Approval replay is ${existing.status}`,
        "Reset the demo to recreate the deterministic WAITING_FOR_APPROVAL checkpoint.",
      );
      return;
    }
    try {
      const request = await queuePrincipalApprovalReplay(actions);
      actions.navigate("approvals");
      actions.toast(
        "info",
        "WAITING_FOR_APPROVAL",
        `${request.tool.id}@${request.tool.version} is paused before invocation. No patch was executed.`,
      );
    } catch (error) {
      actions.toast(
        "error",
        "Approval replay could not start",
        error instanceof Error ? error.message : "The local policy replay failed.",
      );
    }
  }, [actions, state.approvalStore.requests]);
  const applyScenario = useCallback(
    (scenarioId: DemoScenarioId) => {
      setWalkthroughOpen(false);
      updateWalkthroughQuery(false);
      actions.applyScenario(scenarioId);
    },
    [actions],
  );
  const resetDemo = useCallback(() => {
    actions.openModal({
      title: "Reset the synthetic demo?",
      icon: "rotate-ccw",
      tone: "danger",
      confirmLabel: "Reset demo",
      cancelLabel: "Keep current state",
      body: (
        <p>
          This clears all browser-local workflow changes, filters, and scenario state; restores
          harmless preferences to their defaults; and returns to the deterministic baseline queue.
          No external system is contacted.
        </p>
      ),
      onConfirm: () => {
        setWalkthroughOpen(false);
        updateWalkthroughQuery(false);
        clearPreferences(localStorage);
        clearBrowserAuthorizationState(localStorage);
        setTheme("light");
        actions.resetDemo();
      },
    });
  }, [actions, setTheme]);
  const overlayOpen = Boolean(state.drawer || state.modal);
  useEffect(() => {
    if (applicationShellRef.current) applicationShellRef.current.inert = overlayOpen;
  }, [overlayOpen]);
  return (
    <div className="wb-app">
      <a className="wb-skip-link" href="#workbench-main">
        Skip to main content
      </a>
      <section className="wb-narrow-overview" aria-labelledby="narrow-overview-title">
        <BrandMark />
        <p className="eyebrow">Desktop-optimized interactive prototype</p>
        <h1 id="narrow-overview-title">AI Delivery Workbench</h1>
        <p className="wb-narrow-boundary">Demo mode · Synthetic data · No external writes</p>
        <p>
          This narrow-screen view avoids forcing a desktop control plane into an unusable canvas.
          The full workbench is available on wider screens; the case study remains fully responsive.
        </p>
        <ul>
          <li>Eight governed delivery stages with explicit stale-state behavior</li>
          <li>Synthetic artifacts, pull-request controls, and validation evidence</li>
          <li>Human-controlled transitions and clearly labeled simulated integrations</li>
        </ul>
        <a className="wb-narrow-overview-link" href="../">
          Return to the responsive case study
        </a>
      </section>
      <div ref={applicationShellRef} className="wb-application-shell">
        <Sidebar />
        <div className="wb-main">
          <Header theme={theme} setTheme={setTheme} />
          <main id="workbench-main" className="wb-content cr-scroll" tabIndex={0}>
            <div className="wb-viewport-notice" role="note">
              Dense evidence tables scroll within their own panels at this width. At narrower
              widths, the demo provides a concise overview and a link back to the case study.
            </div>
            <DemoControls
              walkthroughOpen={walkthroughOpen}
              onOpenWalkthrough={openWalkthrough}
              onApplyScenario={applyScenario}
              onRequestReset={resetDemo}
            />
            {walkthroughOpen && (
              <Suspense fallback={<div role="status">Loading local walkthrough…</div>}>
                <GuidedWalkthrough
                  key={walkthroughSession}
                  stepIndex={walkthroughStep}
                  onStepChange={changeWalkthroughStep}
                  onStartApprovalReplay={startApprovalReplay}
                  onClose={closeWalkthrough}
                />
              </Suspense>
            )}
            <Screen />
            <Footer />
          </main>
        </div>
        <ToastHost />
      </div>
      <DrawerHost />
      <ModalHost />
    </div>
  );
}
