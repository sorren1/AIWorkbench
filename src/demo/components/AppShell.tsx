import {
  Fragment,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";

import { logsFor } from "../data/content";
import { issues, meta, stageDefs } from "../data/fixtures";
import type { Route } from "../data/types";
import { useApp, type LogDrawer, type ToastKind, type WorkbenchModal } from "../state/store";
import { readPreferences, writePreferences, type ThemePreference } from "../state/preferences";
import { Icon, type IconName } from "../../shared/Icon";
import { PERSONAS, personaById } from "../authorization/personas";
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
      { id: "approvals", label: "Approval Inbox", icon: "shield-check" },
    ],
  },
  {
    group: "Platform",
    items: [
      { id: "control-plane", label: "Control Plane", icon: "shield" },
      { id: "trace", label: "Run Trace", icon: "clock" },
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
  approvals: "Approval Inbox",
  "control-plane": "Control Plane",
  trace: "Run Trace",
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
    approvals:
      Object.values(state.approvalStore.requests).filter((request) => request.status === "PENDING")
        .length || null,
  };
  const activePersona = personaById(state.personaId);

  return (
    <aside className="wb-side">
      <div className="wb-brand">
        <BrandMark />
        <div>
          <div className="wb-brand-name">AI Delivery Workbench</div>
          <div className="wb-brand-sub">Human-in-the-loop control plane</div>
        </div>
      </div>
      <nav className="wb-nav cr-scroll" aria-label="Workbench screens">
        {NAV.map((sec) => (
          <Fragment key={sec.group}>
            <div className="wb-nav-label">{sec.group}</div>
            {sec.items.map((it) => (
              <button
                type="button"
                key={it.id}
                className={"wb-nav-item" + (state.route === it.id ? " is-active" : "")}
                onClick={() => actions.navigate(it.id)}
                aria-current={state.route === it.id ? "page" : undefined}
              >
                <Icon name={it.icon} size={17} className="wb-nav-ico" />
                <span>{it.label}</span>
                {counts[it.id] != null && <span className="wb-nav-count">{counts[it.id]}</span>}
              </button>
            ))}
          </Fragment>
        ))}
      </nav>
      <div className="wb-side-foot">
        <div className="wb-user">
          <Avatar name={activePersona.shortName} />
          <div className="wb-user-meta">
            <div className="wb-user-name">{activePersona.shortName}</div>
            <div className="wb-user-role">Synthetic demo persona</div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export type Theme = ThemePreference;
export function useTheme(): readonly [Theme, Dispatch<SetStateAction<Theme>>] {
  const [theme, setTheme] = useState<Theme>(() => readPreferences(localStorage).theme);
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-theme-switching", "true");
    root.setAttribute("data-theme", theme);
    writePreferences(localStorage, theme);

    const settledFrame = requestAnimationFrame(() => {
      root.removeAttribute("data-theme-switching");
    });

    return () => {
      cancelAnimationFrame(settledFrame);
      root.removeAttribute("data-theme-switching");
    };
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
      <nav className="wb-crumbs" aria-label="Breadcrumb">
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
      </nav>

      <div className="wb-disclaimer" title={meta.aboutNote}>
        <span className="wb-dot" aria-hidden="true" />
        Demo mode · Synthetic data · No external writes
      </div>

      <label className="wb-persona-selector">
        <span>View as</span>
        <select
          aria-label="View authorization as synthetic persona"
          value={state.personaId}
          onChange={(event) => {
            const selected = PERSONAS.find((persona) => persona.id === event.currentTarget.value);
            if (selected) actions.setPersona(selected.id);
          }}
        >
          {PERSONAS.map((persona) => (
            <option key={persona.id} value={persona.id}>
              {persona.shortName}
            </option>
          ))}
        </select>
      </label>

      <div className="wb-header-actions">
        <IconBtn
          icon="info"
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
  return (
    <section
      className="wb-toast-wrap"
      aria-label="Notifications"
      aria-live="polite"
      aria-atomic="false"
      aria-relevant="additions"
    >
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
          <div className="wb-u-min-w-0">
            <div className="wb-toast-title">{t.title || titleMap[t.kind]}</div>
            {t.msg && <div className="wb-toast-msg">{t.msg}</div>}
          </div>
          <button
            type="button"
            className="wb-toast-close"
            aria-label={`Dismiss ${t.title || titleMap[t.kind]} notification`}
            onClick={() => actions.dispatch({ type: "TOAST_REMOVE", id: t.id })}
          >
            <Icon name="x" size={15} />
          </button>
        </div>
      ))}
    </section>
  );
}

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function useDialogFocus(surfaceRef: RefObject<HTMLElement | null>, onClose: () => void) {
  const returnFocusRef = useRef<HTMLElement | null>(
    document.activeElement instanceof HTMLElement ? document.activeElement : null,
  );

  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    const returnTarget = returnFocusRef.current;
    const focusables = () =>
      Array.from(surface.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) =>
          !element.hasAttribute("hidden") && element.getAttribute("aria-hidden") !== "true",
      );
    (focusables()[0] ?? surface).focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const elements = focusables();
      if (!elements.length) {
        event.preventDefault();
        surface.focus();
        return;
      }
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      queueMicrotask(() => {
        if (returnTarget?.isConnected) returnTarget.focus();
      });
    };
  }, [onClose, surfaceRef]);
}

/* ---------- Drawer host (logs) ---------- */
export function DrawerHost() {
  const { state, actions } = useApp();
  const d = state.drawer;
  if (!d) return null;
  const issue = state.issues[d.key];
  if (!issue) return null;
  return <LogDrawerDialog drawer={d} onClose={actions.closeDrawer} />;
}

function LogDrawerDialog({
  drawer: d,
  onClose,
}: {
  readonly drawer: LogDrawer;
  readonly onClose: () => void;
}) {
  const { state } = useApp();
  const issue = state.issues[d.key];
  const surfaceRef = useRef<HTMLElement>(null);
  const titleId = useId();
  useDialogFocus(surfaceRef, onClose);
  if (!issue) return null;
  const stageDef = stageDefs.find((stage) => stage.id === d.stageId);
  const lines = logsFor(issue, d.stageId);
  return (
    <>
      <div className="wb-scrim" aria-hidden="true" />
      <aside
        ref={surfaceRef}
        className="wb-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="wb-drawer-head">
          <h2 className="wb-drawer-title" id={titleId}>
            <Icon name="terminal" size={16} />
            Run logs — {stageDef ? stageDef.name : d.stageId}
          </h2>
          <div className="wb-spacer wb-u-ml-auto" />
          <Badge tone="neutral" icon="hash">
            {issue.key}
          </Badge>
          <IconBtn
            icon="x"
            size="sm"
            title="Close logs drawer"
            onClick={onClose}
            className="wb-u-ml-8px"
          />
        </div>
        <div className="wb-drawer-body cr-scroll">
          <Banner tone="neutral" icon="info">
            Synthetic log fixture for the interactive portfolio prototype. No external execution
            occurred.
          </Banner>
          <div className="wb-code wb-mt-12 wb-u-border-1px-solid-border-subtle">
            <pre
              className="wb-code-body wb-log"
              aria-label={`Synthetic ${stageDef ? stageDef.name : d.stageId} run logs`}
              tabIndex={0}
            >
              {lines.map((l, i) => (
                <span
                  key={i}
                  className={
                    /FAIL|error|non-zero/.test(l)
                      ? "wb-tone--danger"
                      : /audit|done|exit: 0|complete/.test(l)
                        ? "wb-tone--safe"
                        : "wb-tone--secondary"
                  }
                >
                  <span className="wb-muted">{String(i + 1).padStart(2, "0")}</span>
                  {"  "}
                  {l}
                </span>
              ))}
            </pre>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ---------- Modal host ---------- */
export function ModalHost() {
  const { state, actions } = useApp();
  const m = state.modal;
  if (!m) return null;
  return <ModalDialog modal={m} onClose={actions.closeModal} />;
}

function ModalDialog({
  modal: m,
  onClose,
}: {
  readonly modal: WorkbenchModal;
  readonly onClose: () => void;
}) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useDialogFocus(surfaceRef, onClose);
  const onConfirm = () => {
    if (m.onConfirm) m.onConfirm();
    onClose();
  };
  return (
    <>
      <div className="wb-scrim" aria-hidden="true" />
      <div
        ref={surfaceRef}
        className="wb-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="wb-modal-head">
          <h2
            className="wb-modal-title wb-u-display-flex wb-u-items-center wb-u-gap-9px"
            id={titleId}
          >
            {m.icon && (
              <Icon name={m.icon} size={19} className={`wb-tone--${m.tone ?? "accent"}`} />
            )}
            {m.title}
          </h2>
          <IconBtn icon="x" size="sm" title="Close dialog" onClick={onClose} />
        </div>
        <div className="wb-modal-body">{m.body}</div>
        <div className="wb-modal-foot">
          {m.onConfirm && (
            <Btn variant="ghost" onClick={onClose}>
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
