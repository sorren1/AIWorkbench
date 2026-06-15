/* ============================================================
   AI Delivery Workbench — UI primitives
   Reusable building blocks composed across all screens.
   ============================================================ */
const { Icon } = window;
const _D = window.WBData;

/* ---------- Buttons ---------- */
function Btn({ variant = "secondary", size, icon, iconRight, children, className = "", ...rest }) {
  const cls = ["wb-btn", "wb-btn--" + variant, size ? "wb-btn--" + size : "", className].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {icon && <Icon name={icon} size={size === "sm" ? 14 : 16} className="wb-ico" />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === "sm" ? 14 : 16} className="wb-ico" />}
    </button>
  );
}
function IconBtn({ icon, size, className = "", title, ...rest }) {
  const cls = ["wb-btn", "wb-btn--secondary", "wb-btn--icon", size ? "wb-btn--" + size : "", className].filter(Boolean).join(" ");
  return <button className={cls} title={title} aria-label={title} {...rest}><Icon name={icon} size={size === "sm" ? 15 : 17} /></button>;
}

/* ---------- Badges ---------- */
function Badge({ tone = "neutral", icon, dot, children, className = "" }) {
  return (
    <span className={"wb-badge wb-badge--" + tone + " " + className}>
      {dot && <span className="wb-badge-dot" />}
      {icon && <Icon name={icon} size={12} />}
      {children}
    </span>
  );
}

function StatusBadge({ status, size = 12 }) {
  const m = _D.statusMap[status] || _D.statusMap.none;
  const running = status === "run";
  return (
    <span className={"wb-badge wb-badge--" + m.tone + (running ? " wb-badge--running" : "")}>
      <Icon name={m.icon} size={size} className={running ? "wb-spin" : ""} />
      {m.label}
    </span>
  );
}

function RiskBadge({ risk }) {
  const m = _D.riskMap[risk] || _D.riskMap.Low;
  return <Badge tone={m.tone} icon={m.icon}>{risk} risk</Badge>;
}

function LifecycleBadge({ value }) {
  const tone = _D.lifecycleTone[value] || "neutral";
  return <Badge tone={tone} dot>{value}</Badge>;
}

function SurfaceBadge({ value }) {
  const icon = _D.surfaceIcon[value] || "box";
  return <Badge tone="neutral" icon={icon}>{value}</Badge>;
}

/* ---------- Cards ---------- */
function Card({ className = "", flat, children, ...rest }) {
  return <div className={"wb-card " + (flat ? "wb-card--flat " : "") + className} {...rest}>{children}</div>;
}
function CardHead({ icon, title, sub, actions }) {
  return (
    <div className="wb-card-head">
      <div>
        <div className="wb-card-title">{icon && <Icon name={icon} size={16} className="wb-th-ico" />}{title}</div>
        {sub && <div className="wb-card-sub" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
      {actions && <div className="wb-spacer" />}
      {actions}
    </div>
  );
}
function StatTile({ label, icon, value, meta, metaTone }) {
  return (
    <Card className="wb-stat">
      <div className="wb-stat-label">{icon && <Icon name={icon} size={13} />}{label}</div>
      <div className="wb-stat-value">{value}</div>
      {meta && <div className="wb-stat-meta" style={metaTone ? { color: "var(--" + metaTone + ")" } : null}>{meta}</div>}
    </Card>
  );
}

/* ---------- Form controls ---------- */
function Field({ label, hint, children }) {
  return (
    <label className="wb-field">
      {label && <span className="wb-label">{label}{hint && <span className="wb-label-hint">{hint}</span>}</span>}
      {children}
    </label>
  );
}
function Input(props) { return <input className={"wb-input " + (props.mono ? "wb-input--mono " : "")} {...props} />; }
function SelectField({ value, onChange, options, ...rest }) {
  return (
    <div className="wb-select">
      <select value={value} onChange={onChange} {...rest}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <Icon name="chevrons-up-down" size={15} className="wb-select-ico" />
    </div>
  );
}
function Toggle({ on, onClick, disabled, label }) {
  return (
    <div className={"wb-toggle" + (on ? " is-on" : "") + (disabled ? " is-disabled" : "")} onClick={disabled ? null : onClick} role="switch" aria-checked={!!on}>
      <span className="wb-toggle-track"><span className="wb-toggle-knob" /></span>
      {label && <span style={{ fontSize: 13 }}>{label}</span>}
    </div>
  );
}
function Check({ on, onClick, label, sub, disabled }) {
  return (
    <div className={"wb-check" + (on ? " is-on" : "")} onClick={disabled ? null : onClick} style={disabled ? { opacity: 0.55, cursor: "not-allowed" } : null}>
      <span className="wb-check-box"><Icon name="check" size={13} strokeWidth={2.5} /></span>
      <span><span className="wb-check-label">{label}</span>{sub && <span className="wb-check-sub" style={{ display: "block" }}>{sub}</span>}</span>
    </div>
  );
}

/* ---------- Tabs ---------- */
function Tabs({ tabs, active, onChange }) {
  return (
    <div className="wb-tabs">
      {tabs.map((t) => (
        <div key={t.id} className={"wb-tab" + (active === t.id ? " is-active" : "")} onClick={() => onChange(t.id)}>
          {t.icon && <Icon name={t.icon} size={15} />}{t.label}
          {t.count != null && <span className="wb-tab-count">{t.count}</span>}
        </div>
      ))}
    </div>
  );
}

/* ---------- Misc ---------- */
function Avatar({ name, sm }) {
  const initials = name && name !== "—"
    ? name.split(/[ .]/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("")
    : "—";
  return <span className={"wb-avatar" + (sm ? " wb-avatar--sm" : "")}>{initials}</span>;
}
function Banner({ tone = "info", icon, title, children }) {
  const defIcon = { info: "info", warn: "alert-triangle", safe: "check-circle", danger: "alert-circle", neutral: "info" }[tone];
  return (
    <div className={"wb-banner wb-banner--" + tone}>
      <Icon name={icon || defIcon} size={17} className="wb-banner-ico" />
      <div>{title && <div className="wb-banner-title">{title}</div>}<div className="wb-secondary" style={{ color: "inherit" }}>{children}</div></div>
    </div>
  );
}
function Kv({ rows }) {
  return (
    <dl className="wb-kv">
      {rows.map(([k, v], i) => <React.Fragment key={i}><dt>{k}</dt><dd>{v}</dd></React.Fragment>)}
    </dl>
  );
}
function Progress({ value, tone }) {
  return <div className="wb-progress"><div className={"wb-progress-bar" + (tone ? " wb-progress-bar--" + tone : "")} style={{ width: Math.max(0, Math.min(100, value)) + "%" }} /></div>;
}
function EmptyState({ icon = "folder", title, children, action }) {
  return (
    <div className="wb-empty">
      <div className="wb-empty-ico"><Icon name={icon} size={22} /></div>
      <div style={{ fontWeight: 600, color: "var(--text-secondary)", fontSize: 14 }}>{title}</div>
      {children && <div style={{ marginTop: 6, fontSize: 13, maxWidth: 380, margin: "6px auto 0" }}>{children}</div>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

/* ---------- Artifact renderers ---------- */
function escapeHtml(s) { return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function highlightJSON(src) {
  let s = escapeHtml(src);
  s = s.replace(/("(?:\\.|[^"\\])*"(\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?)/g, (m) => {
    let cls = "tok-num";
    if (/^"/.test(m)) cls = /:\s*$/.test(m) ? "tok-key" : "tok-str";
    else if (/true|false|null/.test(m)) cls = "tok-kw";
    return '<span class="' + cls + '">' + m + "</span>";
  });
  return s;
}
function CodeView({ name, lang, body }) {
  if (lang === "json") {
    return <div className="wb-code-body" dangerouslySetInnerHTML={{ __html: highlightJSON(body) }} />;
  }
  return <div className="wb-code-body">{body}</div>;
}

// minimal inline markdown -> react nodes
function inlineMd(text, keyBase) {
  const nodes = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, m, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const tok = m[0];
    if (tok.startsWith("**")) nodes.push(<strong key={keyBase + "-" + (i++)}>{tok.slice(2, -2)}</strong>);
    else nodes.push(<code key={keyBase + "-" + (i++)}>{tok.slice(1, -1)}</code>);
    last = m.index + tok.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}
function MarkdownView({ body }) {
  const lines = body.split("\n");
  const out = [];
  let i = 0, key = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^#\s/.test(line)) { out.push(<h1 key={key++}>{inlineMd(line.slice(2), "h" + key)}</h1>); i++; continue; }
    if (/^##\s/.test(line)) { out.push(<h2 key={key++}>{inlineMd(line.slice(3), "h" + key)}</h2>); i++; continue; }
    if (/^###\s/.test(line)) { out.push(<h2 key={key++} style={{ fontSize: 13.5 }}>{inlineMd(line.slice(4), "h" + key)}</h2>); i++; continue; }
    if (/^(-{3,}|\*{3,})\s*$/.test(line)) { out.push(<hr key={key++} />); i++; continue; }
    if (/^>\s/.test(line)) { out.push(<div key={key++} className="wb-banner wb-banner--neutral" style={{ marginBottom: 10 }}><Icon name="info" size={15} className="wb-banner-ico" /><div>{inlineMd(line.slice(2), "q" + key)}</div></div>); i++; continue; }
    if (/^\|/.test(line)) {
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i]); i++; }
      const cells = (r) => r.split("|").slice(1, -1).map((c) => c.trim());
      const header = cells(rows[0]);
      const bodyRows = rows.slice(2).map(cells);
      out.push(
        <div key={key++} className="wb-table-wrap" style={{ margin: "4px 0 14px", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)" }}>
          <table className="wb-table"><thead><tr>{header.map((h, x) => <th key={x}>{h}</th>)}</tr></thead>
            <tbody>{bodyRows.map((r, y) => <tr key={y} style={{ cursor: "default" }}>{r.map((c, x) => <td key={x}>{inlineMd(c, "c" + y + x)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      continue;
    }
    if (/^[-*]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s/.test(lines[i])) { items.push(lines[i].slice(2)); i++; }
      out.push(<ul key={key++}>{items.map((it, x) => <li key={x}>{inlineMd(it, "li" + key + x)}</li>)}</ul>);
      continue;
    }
    if (line.trim() === "") { i++; continue; }
    // paragraph (gather until blank)
    const para = [line]; i++;
    while (i < lines.length && lines[i].trim() !== "" && !/^[#>|\-*]/.test(lines[i])) { para.push(lines[i]); i++; }
    out.push(<p key={key++}>{inlineMd(para.join(" "), "p" + key)}</p>);
  }
  return <div className="wb-md">{out}</div>;
}

Object.assign(window, {
  Btn, IconBtn, Badge, StatusBadge, RiskBadge, LifecycleBadge, SurfaceBadge,
  Card, CardHead, StatTile, Field, Input, SelectField, Toggle, Check, Tabs,
  Avatar, Banner, Kv, Progress, EmptyState, CodeView, MarkdownView,
});
