import { useCallback, useEffect, useRef, useState } from "react";

import {
  BrandMark,
  DrawerHost,
  Header,
  ModalHost,
  Sidebar,
  ToastHost,
  useTheme,
} from "./components/AppShell";
import { GuidedWalkthrough } from "./components/GuidedWalkthrough";
import { meta } from "./data/fixtures";
import { ArchitectureScreen } from "./screens/ArchitectureScreen";
import { ArtifactsScreen } from "./screens/ArtifactsScreen";
import { GitHubScreen } from "./screens/GitHubScreen";
import { IssueDetail } from "./screens/IssueScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { ValidationScreen } from "./screens/ValidationScreen";
import { WorkQueue } from "./screens/WorkQueueScreen";
import { useApp } from "./state/store";
import { Icon } from "../shared/Icon";

/* ============================================================
   AI Delivery Workbench — Root app + router
   ============================================================ */
function Screen() {
  const { state } = useApp();
  switch (state.route) {
    case "queue":
      return <WorkQueue />;
    case "issue":
      return <IssueDetail />;
    case "artifacts":
      return <ArtifactsScreen />;
    case "github":
      return <GitHubScreen />;
    case "validation":
      return <ValidationScreen />;
    case "architecture":
      return <ArchitectureScreen />;
    case "settings":
      return <SettingsScreen />;
    default:
      return <WorkQueue />;
  }
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

export function App() {
  const { state } = useApp();
  const [theme, setTheme] = useTheme();
  const [walkthroughOpen, setWalkthroughOpen] = useState(
    () => new URLSearchParams(window.location.search).get("walkthrough") === "1",
  );
  const walkthroughReturnFocus = useRef<HTMLElement | null>(null);
  const applicationShellRef = useRef<HTMLDivElement>(null);
  const openWalkthrough = useCallback(() => {
    walkthroughReturnFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setWalkthroughOpen(true);
  }, []);
  const closeWalkthrough = useCallback(() => {
    setWalkthroughOpen(false);
    const returnTarget = walkthroughReturnFocus.current;
    queueMicrotask(() => {
      if (returnTarget?.isConnected) returnTarget.focus();
    });
  }, []);
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
          <Header theme={theme} setTheme={setTheme} onOpenWalkthrough={openWalkthrough} />
          <main id="workbench-main" className="wb-content cr-scroll" tabIndex={0}>
            <div className="wb-viewport-notice" role="note">
              Dense evidence tables scroll within their own panels at this width. At narrower
              widths, the demo provides a concise overview and a link back to the case study.
            </div>
            {walkthroughOpen && <GuidedWalkthrough onClose={closeWalkthrough} />}
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
