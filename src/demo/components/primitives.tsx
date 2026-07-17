import {
  Fragment,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type InputHTMLAttributes,
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
    <button className={cls} {...rest}>
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
    <button className={cls} title={title} aria-label={title} {...rest}>
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
        <div className="wb-card-title">
          {icon && <Icon name={icon} size={16} className="wb-th-ico" />}
          {title}
        </div>
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
  onClick,
  disabled,
  label,
}: {
  readonly on: boolean;
  readonly onClick?: () => void;
  readonly disabled?: boolean;
  readonly label?: ReactNode;
}) {
  return (
    <div
      className={"wb-toggle" + (on ? " is-on" : "") + (disabled ? " is-disabled" : "")}
      onClick={disabled ? undefined : onClick}
      role="switch"
      aria-checked={on}
    >
      <span className="wb-toggle-track">
        <span className="wb-toggle-knob" />
      </span>
      {label && <span style={{ fontSize: 13 }}>{label}</span>}
    </div>
  );
}
export function Check({
  on,
  onClick,
  label,
  sub,
  disabled,
}: {
  readonly on: boolean;
  readonly onClick?: () => void;
  readonly label: ReactNode;
  readonly sub?: ReactNode;
  readonly disabled?: boolean;
}) {
  return (
    <div
      className={"wb-check" + (on ? " is-on" : "")}
      onClick={disabled ? undefined : onClick}
      style={disabled ? { opacity: 0.55, cursor: "not-allowed" } : undefined}
    >
      <span className="wb-check-box">
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
    </div>
  );
}

/* ---------- Tabs ---------- */
export type TabDefinition = { id: string; label: ReactNode; icon?: IconName; count?: number };
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  readonly tabs: readonly TabDefinition[];
  readonly active: string;
  readonly onChange: (id: string) => void;
}) {
  return (
    <div className="wb-tabs">
      {tabs.map((t) => (
        <div
          key={t.id}
          className={"wb-tab" + (active === t.id ? " is-active" : "")}
          onClick={() => onChange(t.id)}
        >
          {t.icon && <Icon name={t.icon} size={15} />}
          {t.label}
          {t.count != null && <span className="wb-tab-count">{t.count}</span>}
        </div>
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
export function Progress({ value, tone }: { readonly value: number; readonly tone?: Tone }) {
  return (
    <div className="wb-progress">
      <div
        className={"wb-progress-bar" + (tone ? " wb-progress-bar--" + tone : "")}
        style={{ width: Math.max(0, Math.min(100, value)) + "%" }}
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
  lang,
  body,
}: {
  readonly name: string;
  readonly lang: string;
  readonly body: string;
}) {
  if (lang === "json") {
    return (
      <div className="wb-code-body" dangerouslySetInnerHTML={{ __html: highlightJSON(body) }} />
    );
  }
  return <div className="wb-code-body">{body}</div>;
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
      out.push(<h1 key={key++}>{inlineMd(line.slice(2), "h" + key)}</h1>);
      i++;
      continue;
    }
    if (/^##\s/.test(line)) {
      out.push(<h2 key={key++}>{inlineMd(line.slice(3), "h" + key)}</h2>);
      i++;
      continue;
    }
    if (/^###\s/.test(line)) {
      out.push(
        <h2 key={key++} style={{ fontSize: 13.5 }}>
          {inlineMd(line.slice(4), "h" + key)}
        </h2>,
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
