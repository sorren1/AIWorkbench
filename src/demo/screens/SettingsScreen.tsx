import { mcpServers } from "../data/fixtures";
import { SETTINGS_VIEWS } from "../state/deepLinks";
import { useApp } from "../state/store";
import { Icon } from "../../shared/Icon";
import {
  Badge,
  Banner,
  Btn,
  Card,
  CardHead,
  Check,
  Field,
  Tabs,
  Toggle,
  tabDomId,
  tabPanelDomId,
  type TabDefinition,
} from "../components/primitives";

/* ============================================================
   AI Delivery Workbench — Screen: Settings
   Enterprise integration console (all simulated / disabled).
   ============================================================ */
function SimBadge() {
  return (
    <Badge tone="warn" icon="circle-dot">
      Simulated
    </Badge>
  );
}

function FieldRO({
  label,
  value,
  mono,
  hint,
}: {
  readonly label: string;
  readonly value: string;
  readonly mono?: boolean;
  readonly hint?: string;
}) {
  return (
    <Field label={label} hint={hint}>
      <input className={"wb-input" + (mono ? " wb-input--mono" : "")} value={value} readOnly />
    </Field>
  );
}

export function isValidBranchPattern(pattern: string): boolean {
  return (
    pattern.startsWith("feature/") &&
    pattern.includes("{issueKey}") &&
    pattern.includes("{slug}") &&
    !/\s/.test(pattern)
  );
}

export function SettingsScreen() {
  const { state, actions } = useApp();
  const S = state.settings;
  const tab = SETTINGS_VIEWS.find((view) => view === state.subview) ?? "jira";
  const toast = (title: string, message: string) => actions.toast("success", title, message);

  const tabs: TabDefinition[] = [
    { id: "jira", label: "Jira", icon: "scroll-text" },
    { id: "github", label: "GitHub", icon: "git-branch" },
    { id: "ai", label: "AI Provider", icon: "sparkles" },
    { id: "mcp", label: "MCP Servers", icon: "network" },
    { id: "stack", label: "Reference Stack", icon: "cpu" },
    { id: "gov", label: "Governance", icon: "shield-check" },
  ];
  const guardrails: { label: string; on: boolean; sub: string }[] = [
    {
      label: "Human approval required before PR",
      on: true,
      sub: "Enforced — AI never opens a PR unattended.",
    },
    { label: "Auto-merge allowed", on: false, sub: "Disabled — merges require human action." },
    {
      label: "Auto-production deploy allowed",
      on: false,
      sub: "Disabled — no unattended production actions.",
    },
  ];

  return (
    <div className="wb-page wb-page-wide">
      <div className="wb-page-head">
        <div>
          <div className="eyebrow wb-mb-8">
            <Icon name="sliders" size={13} /> Enterprise integration console
          </div>
          <h1 className="wb-page-title">Settings</h1>
          <div className="wb-page-desc">
            Vendor-neutral adapter boundaries shown through one illustrative Jira, GitHub, Angular,
            .NET, Oracle, and MCP-style reference stack. Every identifier, configuration value,
            connection result, duration, and count is a synthetic fixture.
          </div>
        </div>
      </div>

      <Banner tone="warn" title="Demo mode" icon="lock">
        All adapters are simulated. Connection tests, syncs, and validations return deterministic
        synthetic fixtures. No credentials are accepted and no external systems are contacted.
      </Banner>

      <div className="wb-mt-16">
        <Tabs
          id="settings"
          ariaLabel="Integration settings"
          tabs={tabs}
          active={tab}
          onChange={actions.setSubview}
        />
      </div>

      <div
        className="wb-mt-16"
        id={tabPanelDomId("settings")}
        role="tabpanel"
        aria-labelledby={tabDomId("settings", tab)}
        tabIndex={0}
      >
        {tab === "jira" && (
          <Card className="wb-u-max-w-720px">
            <CardHead icon="scroll-text" title="Jira connection" actions={<SimBadge />} />
            <div className="wb-card-body wb-stack">
              <div className="wb-grid wb-grid-2">
                <FieldRO label="Jira base URL" value={S.jira.baseUrl} mono />
                <FieldRO label="Project key" value={S.jira.projectKey} mono />
                <FieldRO label="Query mode" value={S.jira.queryMode} />
                <FieldRO label="Connection status" value={S.jira.status} />
              </div>
              <Field label="JQL">
                <textarea
                  className="wb-input wb-input--mono"
                  rows={2}
                  value={S.jira.jql}
                  readOnly
                />
              </Field>
              <div className="wb-flex wb-u-gap-8px">
                <Btn
                  variant="primary"
                  icon="link"
                  onClick={() =>
                    toast("Simulated connection result", "Synthetic duration fixture: 142ms.")
                  }
                >
                  Test connection (simulated)
                </Btn>
                <Btn
                  variant="secondary"
                  icon="refresh-cw"
                  onClick={() =>
                    toast("Synthetic sync result", "10 synthetic issues loaded from project FIN.")
                  }
                >
                  Sync issues (simulated)
                </Btn>
              </div>
            </div>
          </Card>
        )}

        {tab === "github" && (
          <Card className="wb-u-max-w-760px">
            <CardHead icon="git-branch" title="GitHub connection" actions={<SimBadge />} />
            <div className="wb-card-body wb-stack">
              <div className="wb-grid wb-grid-2">
                <FieldRO label="Organization" value={S.github.org} mono />
                <FieldRO label="PR target branch" value={S.github.prTarget} mono />
                <FieldRO label="Branch pattern" value={S.github.branchPattern} mono />
                <FieldRO label="Connection status" value={S.github.status} />
              </div>
              <div className="wb-field">
                <div className="wb-label">
                  Repository map
                  <span className="wb-label-hint">{S.github.repos.length} repos</span>
                </div>
                <div className="wb-card wb-card--flat wb-u-overflow-hidden">
                  {S.github.repos.map((r) => (
                    <div
                      key={r.name}
                      className="wb-flex wb-divided-row wb-u-gap-10px wb-u-p-10px-14px"
                    >
                      <Icon name="folder" size={15} className="wb-muted" />
                      <span className="wb-mono wb-text-sm wb-strong wb-u-flex-1">{r.name}</span>
                      <span className="wb-muted wb-text-sm">{r.role}</span>
                      <Badge tone="neutral" icon="git-branch">
                        {r.default}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="wb-flex wb-wrap wb-u-gap-8px">
                <Btn
                  variant="primary"
                  icon="link"
                  onClick={() =>
                    toast(
                      "Simulated connection result",
                      "Synthetic organization fixture: synthetic-delivery-lab.",
                    )
                  }
                >
                  Test connection (simulated)
                </Btn>
                <Btn
                  variant="secondary"
                  icon="refresh-cw"
                  onClick={() =>
                    toast("Synthetic refresh result", "3 synthetic repositories mapped.")
                  }
                >
                  Refresh repositories (simulated)
                </Btn>
                <Btn
                  variant="secondary"
                  icon="check-circle"
                  onClick={() => {
                    const valid = isValidBranchPattern(S.github.branchPattern);
                    actions.toast(
                      valid ? "success" : "error",
                      valid ? "Branch pattern valid" : "Branch pattern invalid",
                      valid
                        ? "Local validation accepted feature/{issueKey}-{slug}."
                        : "The local pattern must start with feature/ and contain {issueKey} and {slug} with no whitespace.",
                    );
                  }}
                >
                  Validate branch pattern locally
                </Btn>
              </div>
            </div>
          </Card>
        )}

        {tab === "ai" && (
          <div className="wb-stack wb-u-max-w-720px">
            <Card>
              <CardHead icon="sparkles" title="AI provider settings" actions={<SimBadge />} />
              <div className="wb-card-body wb-grid wb-grid-2">
                <FieldRO label="Primary implementation agent" value={S.ai.primary} />
                <FieldRO label="Secondary implementation agent" value={S.ai.secondary} />
                <FieldRO label="Design assistant" value={S.ai.design} />
                <FieldRO label="Max run duration" value={S.ai.maxRun} />
              </div>
            </Card>
            <Card>
              <CardHead icon="shield-check" title="Autonomy guardrails" sub="Locked in demo mode" />
              <div className="wb-card-body wb-card-body--tight">
                {guardrails.map(({ label, on, sub }) => (
                  <div key={label} className="wb-between wb-divided-row wb-u-p-13px-16px">
                    <div>
                      <div className="wb-text-sm wb-strong">{label}</div>
                      <div className="wb-muted wb-u-text-12px">{sub}</div>
                    </div>
                    <div className="wb-flex wb-u-gap-8px">
                      <Toggle on={on} disabled label={label} />
                      <Icon name="lock" size={13} className="wb-muted" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {tab === "mcp" && (
          <div className="wb-grid wb-grid-2">
            {mcpServers.map((m) => (
              <Card key={m.name}>
                <div className="wb-card-body">
                  <div className="wb-flex wb-u-gap-10px">
                    <span className="wb-u-w-34px wb-u-h-34px wb-u-radius-radius-md wb-u-bg-bg-inset wb-u-color-accent wb-u-display-inline-flex wb-u-items-center wb-u-justify-center wb-u-flex-none">
                      <Icon name={m.icon} size={17} />
                    </span>
                    <div className="wb-u-flex-1">
                      <div className="wb-strong wb-u-text-13-5px">{m.name}</div>
                    </div>
                    <SimBadge />
                  </div>
                  <p className="wb-secondary wb-text-sm wb-mt-12 wb-u-leading-1-5">{m.purpose}</p>
                  <div className="wb-mt-12 wb-u-text-12px">
                    <div className="eyebrow wb-u-mb-5px">Data boundary</div>
                    <div className="wb-secondary wb-text-sm">{m.boundary}</div>
                  </div>
                  <hr className="wb-divider wb-u-m-12px-0" />
                  <div className="wb-u-display-grid wb-u-cols-1fr-1fr wb-u-gap-12px">
                    <div>
                      <div className="eyebrow wb-u-mb-6px">Allowed</div>
                      <div className="wb-flex-col wb-u-gap-5px">
                        {m.allowed.map((o) => (
                          <span key={o} className="wb-flex wb-u-gap-6px">
                            <Icon name="check" size={12} className="wb-u-color-safe" />
                            <span className="wb-mono wb-u-text-11px">{o}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="eyebrow wb-u-mb-6px">Disallowed</div>
                      <div className="wb-flex-col wb-u-gap-5px">
                        {m.disallowed.map((o) => (
                          <span key={o} className="wb-flex wb-u-gap-6px">
                            <Icon name="x" size={12} className="wb-u-color-danger" />
                            <span className="wb-mono wb-u-text-11px">{o}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {tab === "stack" && (
          <Card className="wb-u-max-w-620px">
            <CardHead
              icon="cpu"
              title="Illustrative reference stack"
              sub="One synthetic adapter profile, not a prescribed environment"
            />
            <div className="wb-card-body wb-card-body--tight">
              {Object.entries(S.stack).map(([k, v]) => (
                <div key={k} className="wb-between wb-divided-row wb-u-p-13px-16px">
                  <span className="wb-text-sm wb-secondary">{k}</span>
                  <span className="wb-mono wb-strong wb-text-sm">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "gov" && (
          <Card className="wb-u-max-w-720px">
            <CardHead
              icon="shield-check"
              title="Governance settings"
              actions={
                <Badge tone="safe" icon="check">
                  {S.governance.filter((g) => g.on).length}/{S.governance.length} on
                </Badge>
              }
            />
            <div className="wb-card-body wb-card-body--tight">
              {S.governance.map((g) => (
                <div key={g.id} className="wb-between wb-divided-row wb-u-p-13px-16px">
                  <div className="wb-flex wb-u-gap-10px">
                    <Check
                      on={g.on}
                      label={g.label}
                      onChange={() => actions.toggleGov(g.id)}
                      {...(g.locked === undefined ? {} : { disabled: g.locked })}
                    />
                  </div>
                  {g.locked && (
                    <Badge tone="neutral" icon="lock">
                      Locked
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <div className="wb-card-foot">
              <Icon name="info" size={14} className="wb-muted" />
              <span className="wb-text-sm wb-muted">
                These rules shape how every AI delivery run is governed. Toggling them updates local
                demo state only.
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
