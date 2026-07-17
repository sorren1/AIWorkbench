import { Fragment, useEffect, useState, type Dispatch, type SetStateAction } from "react";

import { logsFor } from "../data/content";
import { issues, meta, stageDefs } from "../data/fixtures";
import type { Route } from "../data/types";
import { useApp, type ToastKind } from "../state/store";
import { Icon, type IconName } from "../../shared/Icon";
import { Avatar, Badge, Banner, Btn, IconBtn } from "./primitives";

/* ============================================================
   AI Delivery Workbench — App shell + overlay hosts
   ============================================================ */
type NavigationSection = {
  group: string;
  items: { id: Route; label: string; icon: IconName }[];
};

const NAV: NavigationSection[] = [
  {
    group: "Workflow",
    items: [
      { id: "queue", label: "Work Queue", icon: "layout-grid" },
      { id: "issue", label: "Issue Detail", icon: "workflow" },
      { id: "artifacts", label: "Artifacts", icon: "file-code" },
      { id: "github", label: "GitHub / PR", icon: "git-pull-request" },
      { id: "validation", label: "Validation Evidence", icon: "flask" },
    ],
  },
  {
    group: "Platform",
    items: [
      { id: "architecture", label: "Architecture", icon: "network" },
      { id: "settings", label: "Settings", icon: "sliders" },
    ],
  },
];

const ROUTE_TITLES: Record<Route, string> = {
  queue: "Work Queue",
  issue: "Issue Detail",
  artifacts: "Artifacts",
  github: "GitHub / PR",
  validation: "Validation Evidence",
  architecture: "Architecture",
  settings: "Settings",
};

export function BrandMark() {
  return (
    <svg className="wb-brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M11.5 11.5 H20.5 V20.5 H11.5 Z" fill="var(--accent)" />
      <rect
        x="3.4"
        y="3.4"
        width="17.2"
        height="17.2"
        rx="4.2"
        stroke="var(--accent)"
        strokeWidth="2.4"
      />
      <rect
        x="11.4"
        y="11.4"
        width="17.2"
        height="17.2"
        rx="4.2"
        stroke="var(--text-primary)"
        strokeWidth="2.4"
      />
    </svg>
  );
}

export function Sidebar() {
  const { state, actions } = useApp();
  const needsReview = Object.values(state.issues).filter(
    (i) => i.flags.needsReview || i.s.includes("review"),
  ).length;
  const failed = Object.values(state.issues).filter((i) => i.s.includes("fail")).length;
  const counts: Partial<Record<Route, number | null>> = {
    queue: issues.length,
    github: needsReview || null,
    validation: failed || null,
  };

  return (
    <aside className="wb-side">
      <div className="wb-brand">
        <BrandMark />
        <div>
          <div className="wb-brand-name">AI Delivery Workbench</div>
          <div className="wb-brand-sub">Human-in-the-loop control plane</div>
        </div>
      </div>
      <nav className="wb-nav cr-scroll">
        {NAV.map((sec) => (
          <Fragment key={sec.group}>
            <div className="wb-nav-label">{sec.group}</div>
            {sec.items.map((it) => (
              <div
                key={it.id}
                className={"wb-nav-item" + (state.route === it.id ? " is-active" : "")}
                onClick={() => actions.navigate(it.id)}
              >
                <Icon name={it.icon} size={17} className="wb-nav-ico" />
                <span>{it.label}</span>
                {counts[it.id] != null && <span className="wb-nav-count">{counts[it.id]}</span>}
              </div>
            ))}
          </Fragment>
        ))}
      </nav>
      <div className="wb-side-foot">
        <div className="wb-user">
          <Avatar name={meta.user.name} />
          <div className="wb-user-meta">
            <div className="wb-user-name">{meta.user.name}</div>
            <div className="wb-user-role">{meta.user.role}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export type Theme = "light" | "dark";
export function useTheme(): readonly [Theme, Dispatch<SetStateAction<Theme>>] {
  const [theme, setTheme] = useState<Theme>(() =>
    localStorage.getItem("wb-theme") === "dark" ? "dark" : "light",
  );
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("wb-theme", theme);
  }, [theme]);
  return [theme, setTheme];
}

export function Header({
  theme,
  setTheme,
}: {
  readonly theme: Theme;
  readonly setTheme: Dispatch<SetStateAction<Theme>>;
}) {
  const { state, actions } = useApp();
  const issue = state.issues[state.selectedKey];
  const showIssue = ["issue", "artifacts", "github", "validation"].includes(state.route);
  return (
    <header className="wb-header">
      <div className="wb-crumbs">
        <span className="wb-crumb">Workbench</span>
        <span className="wb-crumb-sep">
          <Icon name="chevron-right" size={14} />
        </span>
        <span className={"wb-crumb" + (!showIssue ? " is-current" : "")}>
          {ROUTE_TITLES[state.route]}
        </span>
        {showIssue && issue && (
          <>
            <span className="wb-crumb-sep">
              <Icon name="chevron-right" size={14} />
            </span>
            <span className="wb-crumb is-current wb-mono">{issue.key}</span>
          </>
        )}
      </div>

      <div className="wb-disclaimer" title={meta.aboutNote}>
        <span className="wb-dot" />
        {meta.disclaimer}
      </div>

      <div className="wb-header-actions">
        <IconBtn
          icon={theme === "dark" ? "info" : "info"}
          size="sm"
          title="About AI Delivery Workbench"
          onClick={() =>
            actions.openModal({
              title: "About AI Delivery Workbench",
              icon: "shield-check",
              body: (
                <div className="wb-stack-sm">
                  <p className="wb-strong">{meta.subtitle}</p>
                  <div className="wb-divider" />
                  <div>
                    <div className="eyebrow wb-mb-8">Clean-room boundary</div>
                    <p className="wb-text-sm wb-secondary">{meta.aboutNote}</p>
                  </div>
                  <div className="wb-divider" />
                  <div>
                    <div className="eyebrow wb-mb-8">Professional context · separate evidence</div>
                    <p className="wb-text-sm wb-secondary">{meta.professionalContext}</p>
                  </div>
                  <p className="wb-text-sm wb-muted">
                    Every persona, issue, repository, branch, pull request, check, log, and metric
                    shown in the workbench is a synthetic demo fixture.
                  </p>
                </div>
              ),
              confirmLabel: "Got it",
            })
          }
        />
        <IconBtn
          icon={theme === "dark" ? "zap" : "box"}
          size="sm"
          title={theme === "dark" ? "Switch to light" : "Switch to dark"}
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        />
      </div>
    </header>
  );
}

/* ---------- Toast host ---------- */
export function ToastHost() {
  const { state, actions } = useApp();
  const map: Record<ToastKind, IconName> = {
    success: "check-circle",
    warn: "alert-triangle",
    error: "x-circle",
    info: "info",
  };
  const titleMap: Record<ToastKind, string> = {
    success: "Success",
    warn: "Warning",
    error: "Error",
    info: "Working",
  };
  if (!state.toasts.length) return null;
  return (
    <div className="wb-toast-wrap">
      {state.toasts.map((t) => (
        <div
          key={t.id}
          className={"wb-toast wb-toast--" + t.kind + (t.leaving ? " is-leaving" : "")}
        >
          <Icon
            name={map[t.kind]}
            size={18}
            className={"wb-toast-ico" + (t.kind === "info" ? "" : "")}
          />
          <div style={{ minWidth: 0 }}>
            <div className="wb-toast-title">{t.title || titleMap[t.kind]}</div>
            {t.msg && <div className="wb-toast-msg">{t.msg}</div>}
          </div>
          <button
            className="wb-toast-close"
            onClick={() => actions.dispatch({ type: "TOAST_REMOVE", id: t.id })}
          >
            <Icon name="x" size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ---------- Drawer host (logs) ---------- */
export function DrawerHost() {
  const { state, actions } = useApp();
  const d = state.drawer;
  if (!d) return null;
  const issue = state.issues[d.key];
  if (!issue) return null;
  const stageDef = stageDefs.find((stage) => stage.id === d.stageId);
  const lines = logsFor(issue, d.stageId);
  return (
    <>
      <div className="wb-scrim" onClick={actions.closeDrawer} />
      <div className="wb-drawer">
        <div className="wb-drawer-head">
          <div className="wb-drawer-title">
            <Icon name="terminal" size={16} />
            Run logs — {stageDef ? stageDef.name : d.stageId}
          </div>
          <div className="wb-spacer" style={{ marginLeft: "auto" }} />
          <Badge tone="neutral" icon="hash">
            {issue.key}
          </Badge>
          <IconBtn
            icon="x"
            size="sm"
            title="Close"
            onClick={actions.closeDrawer}
            style={{ marginLeft: 8 }}
          />
        </div>
        <div className="wb-drawer-body cr-scroll">
          <Banner tone="neutral" icon="info">
            Synthetic log fixture for the interactive portfolio prototype. No external execution
            occurred.
          </Banner>
          <div className="wb-code wb-mt-12" style={{ border: "1px solid var(--border-subtle)" }}>
            <div className="wb-code-body" style={{ whiteSpace: "pre-wrap" }}>
              {lines.map((l, i) => (
                <div
                  key={i}
                  style={{
                    color: /FAIL|error|non-zero/.test(l)
                      ? "var(--danger)"
                      : /audit|done|exit: 0|complete/.test(l)
                        ? "var(--safe)"
                        : "var(--text-secondary)",
                  }}
                >
                  <span className="wb-muted">{String(i + 1).padStart(2, "0")}</span>
                  {"  "}
                  {l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* ---------- Modal host ---------- */
export function ModalHost() {
  const { state, actions } = useApp();
  const m = state.modal;
  if (!m) return null;
  const onConfirm = () => {
    if (m.onConfirm) m.onConfirm();
    actions.closeModal();
  };
  return (
    <>
      <div className="wb-scrim" onClick={actions.closeModal} />
      <div className="wb-modal">
        <div className="wb-modal-head">
          <div className="wb-modal-title" style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {m.icon && (
              <Icon
                name={m.icon}
                size={19}
                style={{ color: m.tone ? "var(--" + m.tone + ")" : "var(--accent)" }}
              />
            )}
            {m.title}
          </div>
        </div>
        <div className="wb-modal-body">{m.body}</div>
        <div className="wb-modal-foot">
          {m.onConfirm && (
            <Btn variant="ghost" onClick={actions.closeModal}>
              {m.cancelLabel || "Cancel"}
            </Btn>
          )}
          <Btn variant={m.tone === "danger" ? "danger" : "primary"} onClick={onConfirm}>
            {m.confirmLabel || "Confirm"}
          </Btn>
        </div>
      </div>
    </>
  );
}
