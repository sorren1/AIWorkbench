import {
  Fragment,
  useRef,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react";

import { lifecycleTone, riskMap, statusMap, surfaceIcon } from "../data/fixtures";
import type { Lifecycle, Risk, StageStatus, Surface, Tone } from "../data/types";
import { Icon, type IconName } from "../../shared/Icon";

/* ============================================================
   AI Delivery Workbench — UI primitives
   Reusable building blocks composed across all screens.
   ============================================================ */
/* ---------- Buttons ---------- */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  readonly variant?: "primary" | "secondary" | "ghost" | "danger";
  readonly size?: "sm";
  readonly icon?: IconName;
  readonly iconRight?: IconName;
};

export function Btn({
  variant = "secondary",
  size,
  icon,
  iconRight,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  const cls = ["wb-btn", "wb-btn--" + variant, size ? "wb-btn--" + size : "", className]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" className={cls} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} className="wb-ico" />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 14 : 16} className="wb-ico" />}
    </button>
  );
}
type IconButtonProps = Omit<ButtonProps, "iconRight" | "children"> & {
  readonly icon: IconName;
  readonly title: string;
};

export function IconBtn({ icon, size, className = "", title, ...rest }: IconButtonProps) {
  const cls = [
    "wb-btn",
    "wb-btn--secondary",
    "wb-btn--icon",
    size ? "wb-btn--" + size : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <button type="button" className={cls} title={title} aria-label={title} {...rest}>
      <Icon name={icon} size={size === "sm" ? 15 : 17} />
    </button>
  );
}

/* ---------- Badges ---------- */
export function Badge({
  tone = "neutral",
  icon,
  dot,
  children,
  className = "",
}: {
  readonly tone?: Tone;
  readonly icon?: IconName;
  readonly dot?: boolean;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <span className={"wb-badge wb-badge--" + tone + " " + className}>
      {dot && <span className="wb-badge-dot" />}
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

export function StatusBadge({
  status,
  size = 12,
}: {
  readonly status: StageStatus;
  readonly size?: number;
}) {
  const m = statusMap[status];
  const running = status === "run";
  return (
    <span className={"wb-badge wb-badge--" + m.tone + (running ? " wb-badge--running" : "")}>
      <Icon name={m.icon} size={size} className={running ? "wb-spin" : ""} />
      {m.label}
    </span>
  );
}

export function RiskBadge({ risk }: { readonly risk: Risk }) {
  const m = riskMap[risk];
  return (
    <Badge tone={m.tone} icon={m.icon}>
      {risk} risk
    </Badge>
  );
}

export function LifecycleBadge({ value }: { readonly value: Lifecycle }) {
  const tone = lifecycleTone[value];
  return (
    <Badge tone={tone} dot>
      {value}
    </Badge>
  );
}

export function SurfaceBadge({ value }: { readonly value: Surface }) {
  const icon = surfaceIcon[value];
  return (
    <Badge tone="neutral" icon={icon}>
      {value}
    </Badge>
  );
}

/* ---------- Cards ---------- */
export function Card({
  className = "",
  flat,
  children,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { readonly flat?: boolean }) {
  return (
    <div className={"wb-card " + (flat ? "wb-card--flat " : "") + className} {...rest}>
      {children}
    </div>
  );
}
export function CardHead({
  icon,
  title,
  sub,
  actions,
}: {
  readonly icon?: IconName;
  readonly title: ReactNode;
  readonly sub?: ReactNode;
  readonly actions?: ReactNode;
}) {
  return (
    <div className="wb-card-head">
      <div>
        <h2 className="wb-card-title">
          {icon && <Icon name={icon} size={16} className="wb-th-ico" />}
          {title}
        </h2>
        {sub && (
          <div className="wb-card-sub" style={{ marginTop: 2 }}>
            {sub}
          </div>
        )}
      </div>
      {actions && <div className="wb-spacer" />}
      {actions}
    </div>
  );
}
export function StatTile({
  label,
  icon,
  value,
  meta,
  metaTone,
}: {
  readonly label: ReactNode;
  readonly icon?: IconName;
  readonly value: ReactNode;
  readonly meta?: ReactNode;
  readonly metaTone?: string;
}) {
  return (
    <Card className="wb-stat">
      <div className="wb-stat-label">
        {icon && <Icon name={icon} size={13} />}
        {label}
      </div>
      <div className="wb-stat-value">{value}</div>
      {meta && (
        <div
          className="wb-stat-meta"
          style={metaTone ? { color: "var(--" + metaTone + ")" } : undefined}
        >
          {meta}
        </div>
      )}
    </Card>
  );
}

/* ---------- Form controls ---------- */
export function Field({
  label,
  hint,
  children,
}: {
  readonly label?: ReactNode;
  readonly hint?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <label className="wb-field">
      {label && (
        <span className="wb-label">
          {label}
          {hint && <span className="wb-label-hint">{hint}</span>}
        </span>
      )}
      {children}
    </label>
  );
}
type InputProps = InputHTMLAttributes<HTMLInputElement> & { readonly mono?: boolean };
export function Input({ mono, className = "", ...props }: InputProps) {
  return <input className={`wb-input ${mono ? "wb-input--mono " : ""}${className}`} {...props} />;
}
type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  readonly options: readonly string[];
};
export function SelectField({ value, onChange, options, ...rest }: SelectFieldProps) {
  return (
    <div className="wb-select">
      <select value={value} onChange={onChange} {...rest}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <Icon name="chevrons-up-down" size={15} className="wb-select-ico" />
    </div>
  );
}
export function Toggle({
  on,
  onChange,
  disabled,
  label,
}: {
  readonly on: boolean;
  readonly onChange?: (checked: boolean) => void;
  readonly disabled?: boolean;
  readonly label: ReactNode;
}) {
  return (
    <label className={"wb-toggle" + (on ? " is-on" : "") + (disabled ? " is-disabled" : "")}>
      <input
        className="wb-control-input"
        type="checkbox"
        role="switch"
        checked={on}
        disabled={disabled}
        onChange={(event) => onChange?.(event.currentTarget.checked)}
      />
      <span className="wb-toggle-track" aria-hidden="true">
        <span className="wb-toggle-knob" />
      </span>
      <span className="wb-sr-only">{label}</span>
    </label>
  );
}
export function Check({
  on,
  onChange,
  label,
  sub,
  disabled,
}: {
  readonly on: boolean;
  readonly onChange?: (checked: boolean) => void;
  readonly label: ReactNode;
  readonly sub?: ReactNode;
  readonly disabled?: boolean;
}) {
  return (
    <label className={"wb-check" + (on ? " is-on" : "") + (disabled ? " is-disabled" : "")}>
      <input
        className="wb-control-input"
        type="checkbox"
        checked={on}
        disabled={disabled}
        onChange={(event) => onChange?.(event.currentTarget.checked)}
      />
      <span className="wb-check-box" aria-hidden="true">
        <Icon name="check" size={13} strokeWidth={2.5} />
      </span>
      <span>
        <span className="wb-check-label">{label}</span>
        {sub && (
          <span className="wb-check-sub" style={{ display: "block" }}>
            {sub}
          </span>
        )}
      </span>
    </label>
  );
}

/* ---------- Tabs ---------- */
export type TabDefinition = { id: string; label: ReactNode; icon?: IconName; count?: number };
export const tabDomId = (groupId: string, tabId: string) => `${groupId}-tab-${tabId}`;
export const tabPanelDomId = (groupId: string) => `${groupId}-panel`;

export function Tabs({
  id,
  ariaLabel,
  tabs,
  active,
  onChange,
}: {
  readonly id: string;
  readonly ariaLabel: string;
  readonly tabs: readonly TabDefinition[];
  readonly active: string;
  readonly onChange: (id: string) => void;
}) {
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const moveFocus = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = tabs.length - 1;
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = index === last ? 0 : index + 1;
    if (event.key === "ArrowLeft") nextIndex = index === 0 ? last : index - 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = last;
    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = tabs[nextIndex];
    if (!nextTab) return;
    onChange(nextTab.id);
    tabRefs.current[nextIndex]?.focus();
  };

  return (
    <div className="wb-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((t, index) => (
        <button
          type="button"
          key={t.id}
          ref={(element) => {
            tabRefs.current[index] = element;
          }}
          id={tabDomId(id, t.id)}
          role="tab"
          className={"wb-tab" + (active === t.id ? " is-active" : "")}
          aria-selected={active === t.id}
          aria-controls={tabPanelDomId(id)}
          tabIndex={active === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={(event) => moveFocus(event, index)}
        >
          {t.icon && <Icon name={t.icon} size={15} />}
          {t.label}
          {t.count != null && <span className="wb-tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

/* ---------- Misc ---------- */
export function Avatar({ name, sm }: { readonly name: string; readonly sm?: boolean }) {
  const initials =
    name && name !== "—"
      ? name
          .split(/[ .]/)
          .filter(Boolean)
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase() ?? "")
          .join("")
      : "—";
  return <span className={"wb-avatar" + (sm ? " wb-avatar--sm" : "")}>{initials}</span>;
}
export function Banner({
  tone = "info",
  icon,
  title,
  children,
}: {
  readonly tone?: Extract<Tone, "info" | "warn" | "safe" | "danger" | "neutral">;
  readonly icon?: IconName;
  readonly title?: ReactNode;
  readonly children: ReactNode;
}) {
  const defaultIcons: Record<
    Extract<Tone, "info" | "warn" | "safe" | "danger" | "neutral">,
    IconName
  > = {
    info: "info",
    warn: "alert-triangle",
    safe: "check-circle",
    danger: "alert-circle",
    neutral: "info",
  };
  const defIcon = defaultIcons[tone];
  return (
    <div className={"wb-banner wb-banner--" + tone}>
      <Icon name={icon || defIcon} size={17} className="wb-banner-ico" />
      <div>
        {title && <div className="wb-banner-title">{title}</div>}
        <div className="wb-secondary" style={{ color: "inherit" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
export function Kv({ rows }: { readonly rows: readonly (readonly [ReactNode, ReactNode])[] }) {
  return (
    <dl className="wb-kv">
      {rows.map(([key, value], index) => (
        <Fragment key={index}>
          <dt>{key}</dt>
          <dd>{value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
export function Progress({
  value,
  tone,
  label,
  valueText,
}: {
  readonly value: number;
  readonly tone?: Tone;
  readonly label: string;
  readonly valueText?: string;
}) {
  const boundedValue = Math.max(0, Math.min(100, value));
  return (
    <div
      className="wb-progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={boundedValue}
      aria-valuetext={valueText}
    >
      <div
        className={"wb-progress-bar" + (tone ? " wb-progress-bar--" + tone : "")}
        style={{ width: boundedValue + "%" }}
      />
    </div>
  );
}
export function EmptyState({
  icon = "folder",
  title,
  children,
  action,
}: {
  readonly icon?: IconName;
  readonly title: ReactNode;
  readonly children?: ReactNode;
  readonly action?: ReactNode;
}) {
  return (
    <div className="wb-empty">
      <div className="wb-empty-ico">
        <Icon name={icon} size={22} />
      </div>
      <div style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 14 }}>{title}</div>
      {children && (
        <div style={{ marginTop: 6, fontSize: 13, maxWidth: 380, margin: "6px auto 0" }}>
          {children}
        </div>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

/* ---------- Artifact renderers ---------- */
function escapeHtml(source: string): string {
  return source.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function highlightJSON(src: string): string {
  let s = escapeHtml(src);
  s = s.replace(
    /("(?:\\.|[^"\\])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (m) => {
      let cls = "tok-num";
      if (/^"/.test(m)) cls = /:\s*$/.test(m) ? "tok-key" : "tok-str";
      else if (/true|false|null/.test(m)) cls = "tok-kw";
      return '<span class="' + cls + '">' + m + "</span>";
    },
  );
  return s;
}
export function CodeView({
  name,
  lang,
  body,
}: {
  readonly name: string;
  readonly lang: string;
  readonly body: string;
}) {
  if (lang === "json") {
    return (
      <div
        className="wb-code-body"
        role="region"
        aria-label={`${name} source`}
        tabIndex={0}
        dangerouslySetInnerHTML={{ __html: highlightJSON(body) }}
      />
    );
  }
  return (
    <div className="wb-code-body" role="region" aria-label={`${name} source`} tabIndex={0}>
      {body}
    </div>
  );
}

// minimal inline markdown -> react nodes
function inlineMd(text: string, keyBase: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0,
    match: RegExpExecArray | null,
    i = 0;
  while ((match = re.exec(text))) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const tok = match[0];
    if (tok.startsWith("**"))
      nodes.push(<strong key={keyBase + "-" + i++}>{tok.slice(2, -2)}</strong>);
    else nodes.push(<code key={keyBase + "-" + i++}>{tok.slice(1, -1)}</code>);
    last = match.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
export function MarkdownView({ body }: { readonly body: string }) {
  const lines = body.split("\n");
  const out = [];
  let i = 0,
    key = 0;
  while (i < lines.length) {
    const line = lines[i] ?? "";
    if (/^#\s/.test(line)) {
      out.push(<h2 key={key++}>{inlineMd(line.slice(2), "h" + key)}</h2>);
      i++;
      continue;
    }
    if (/^##\s/.test(line)) {
      out.push(<h3 key={key++}>{inlineMd(line.slice(3), "h" + key)}</h3>);
      i++;
      continue;
    }
    if (/^###\s/.test(line)) {
      out.push(
        <h4 key={key++} style={{ fontSize: 13.5 }}>
          {inlineMd(line.slice(4), "h" + key)}
        </h4>,
      );
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
      out.push(<hr key={key++} />);
      i++;
      continue;
    }
    if (/^>\s/.test(line)) {
      out.push(
        <div key={key++} className="wb-banner wb-banner--neutral" style={{ marginBottom: 10 }}>
          <Icon name="info" size={15} className="wb-banner-ico" />
          <div>{inlineMd(line.slice(2), "q" + key)}</div>
        </div>,
      );
      i++;
      continue;
    }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i] ?? "")) {
        rows.push(lines[i] ?? "");
        i++;
      }
      const cells = (row: string) =>
        row
          .split("|")
          .slice(1, -1)
          .map((cell) => cell.trim());
      const header = cells(rows[0] ?? "");
      const bodyRows = rows.slice(2).map(cells);
      out.push(
        <div
          key={key++}
          className="wb-table-wrap"
          role="region"
          aria-label="Artifact data table"
          tabIndex={0}
          style={{
            margin: "4px 0 14px",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
          }}
        >
          <table className="wb-table">
            <thead>
              <tr>
                {header.map((h, x) => (
                  <th key={x}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((r, y) => (
                <tr key={y} style={{ cursor: "default" }}>
                  {r.map((c, x) => (
                    <td key={x}>{inlineMd(c, "c" + y + x)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    if (/^[-*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").slice(2));
        i++;
      }
      out.push(
        <ul key={key++}>
          {items.map((it, x) => (
            <li key={x}>{inlineMd(it, "li" + key + x)}</li>
          ))}
        </ul>,
      );
      continue;
    }
    if (line.trim() === "") {
      i++;
      continue;
    }
    // paragraph (gather until blank)
    const para = [line];
    i++;
    while (
      i < lines.length &&
      (lines[i] ?? "").trim() !== "" &&
      !/^[#>|\-*]/.test(lines[i] ?? "")
    ) {
      para.push(lines[i] ?? "");
      i++;
    }
    out.push(<p key={key++}>{inlineMd(para.join(" "), "p" + key)}</p>);
  }
  return <div className="wb-md">{out}</div>;
}
