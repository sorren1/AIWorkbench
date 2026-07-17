import { useMemo, useState } from "react";

import type {
  AgentCard,
  MemoryPolicy,
  ModelPolicy,
  RegistryResource,
  RegistryStatus,
  ToolDescriptor,
} from "../control-plane/registry/contracts";
import { REGISTRY_STATUSES } from "../control-plane/registry/contracts";
import { registrySnapshot } from "../control-plane/registry/generated";
import { downloadTextFile } from "../utils/browserActions";
import { useApp } from "../state/store";
import { Icon } from "../../shared/Icon";
import {
  Badge,
  Banner,
  Btn,
  Card,
  Tabs,
  tabDomId,
  tabPanelDomId,
  type TabDefinition,
} from "../components/primitives";

type RegistryTab = "agents" | "tools" | "models" | "memory";
type StatusFilter = "ALL" | RegistryStatus;

const RESOURCE_TABS: readonly TabDefinition[] = [
  { id: "agents", label: "Agents", icon: "workflow", count: registrySnapshot.agents.length },
  { id: "tools", label: "Tools", icon: "sliders", count: registrySnapshot.tools.length },
  {
    id: "models",
    label: "Model policies",
    icon: "sparkles",
    count: registrySnapshot.modelPolicies.length,
  },
  {
    id: "memory",
    label: "Memory policies",
    icon: "database",
    count: registrySnapshot.memoryPolicies.length,
  },
];

function parseRegistryTab(value: string): RegistryTab {
  if (value === "tools" || value === "models" || value === "memory") return value;
  return "agents";
}

function parseStatusFilter(value: string): StatusFilter {
  if (value === "ALL") return value;
  return REGISTRY_STATUSES.find((status) => status === value) ?? "ALL";
}

function statusTone(status: RegistryStatus): "neutral" | "accent" | "safe" | "danger" | "warn" {
  switch (status) {
    case "DRAFT":
      return "neutral";
    case "PENDING_APPROVAL":
      return "accent";
    case "APPROVED":
      return "safe";
    case "REJECTED":
      return "danger";
    case "DEPRECATED":
      return "warn";
  }
}

function resourceKey(resource: RegistryResource): string {
  return `${resource.kind}:${resource.id}:${resource.version}`;
}

function resourcesFor(tab: RegistryTab): readonly RegistryResource[] {
  switch (tab) {
    case "agents":
      return registrySnapshot.agents;
    case "tools":
      return registrySnapshot.tools;
    case "models":
      return registrySnapshot.modelPolicies;
    case "memory":
      return registrySnapshot.memoryPolicies;
  }
}

function DetailList({
  items,
  empty = "None declared",
}: {
  readonly items: readonly string[];
  readonly empty?: string;
}) {
  if (items.length === 0) return <p className="wb-muted wb-text-sm">{empty}</p>;
  return (
    <ul className="wb-control-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function SchemaDisclosure({ label, value }: { readonly label: string; readonly value: unknown }) {
  return (
    <details className="wb-control-schema">
      <summary>{label}</summary>
      <pre className="wb-code cr-scroll">{JSON.stringify(value, null, 2)}</pre>
    </details>
  );
}

function AgentDetail({ agent }: { readonly agent: AgentCard }) {
  return (
    <>
      <div className="wb-control-detail-grid">
        <section>
          <h3>Capabilities</h3>
          <DetailList items={agent.capabilities} />
        </section>
        <section>
          <h3>Skills</h3>
          <DetailList items={agent.skills} />
        </section>
        <section>
          <h3>Allowed tools</h3>
          <DetailList items={agent.allowedToolIds} />
        </section>
        <section>
          <h3>Write boundary</h3>
          <DetailList items={agent.allowedWritePaths} empty="No write path allowed" />
        </section>
      </div>
      <div className="wb-control-policy-strip" aria-label="Declared agent policies and budgets">
        <span>Model: {agent.modelPolicyId}</span>
        <span>Memory: {agent.memoryPolicyId}</span>
        <span>{agent.maxToolCalls} tool calls</span>
        <span>{agent.maxRepairAttempts} repair attempts</span>
        <span>{agent.maxDurationMs / 1000}s maximum</span>
        {agent.tokenBudget && (
          <span>
            {agent.tokenBudget.maxInputTokens + agent.tokenBudget.maxOutputTokens} tokens ·
            estimated
          </span>
        )}
        {agent.costBudget && <span>${agent.costBudget.maxEstimatedUsd} ceiling · estimated</span>}
      </div>
      <div className="wb-grid wb-grid-2">
        <SchemaDisclosure label="Input schema reference" value={agent.inputSchema} />
        <SchemaDisclosure label="Output schema reference" value={agent.outputSchema} />
      </div>
    </>
  );
}

function ToolDetail({ tool }: { readonly tool: ToolDescriptor }) {
  return (
    <>
      <div className="wb-control-detail-grid">
        <section>
          <h3>Side effects</h3>
          <DetailList items={tool.sideEffects} />
        </section>
        <section>
          <h3>Required scopes</h3>
          <DetailList items={tool.requiredScopes} />
        </section>
        <section>
          <h3>Allowed stages</h3>
          <DetailList items={tool.allowedStages} />
        </section>
        <section>
          <h3>Filesystem boundary</h3>
          <p className="wb-text-sm wb-strong">{tool.filesystemBoundary.mode}</p>
          <DetailList items={tool.filesystemBoundary.allowedPaths} empty="No filesystem access" />
        </section>
      </div>
      <div className="wb-control-policy-strip" aria-label="Declared tool policy">
        <span>Risk: {tool.riskLevel}</span>
        <span>Timeout: {tool.timeoutMs}ms</span>
        <span>{tool.idempotency}</span>
        <span>Network: {tool.networkRequired ? "required" : "denied"}</span>
        <span>Approval: {tool.approvalPolicyId ?? "not required"}</span>
      </div>
      <div className="wb-grid wb-grid-2">
        <SchemaDisclosure label="Input JSON Schema" value={tool.inputSchema} />
        <SchemaDisclosure label="Output JSON Schema" value={tool.outputSchema} />
      </div>
    </>
  );
}

function ModelDetail({ policy }: { readonly policy: ModelPolicy }) {
  return (
    <div className="wb-control-detail-grid">
      <section>
        <h3>Runtime selection</h3>
        <DetailList
          items={[
            `Category: ${policy.providerCategory}`,
            `Identifier: ${policy.modelIdentifier}`,
            `Reasoning: ${policy.reasoningProfile}`,
            `Temperature: ${policy.temperature ?? "adapter default"}`,
          ]}
        />
      </section>
      <section>
        <h3>Limits and fallback</h3>
        <DetailList
          items={[
            `Maximum tokens: ${policy.maximumTokens}`,
            `Estimated cost ceiling: $${policy.costCeilingUsd}`,
            `Fallback: ${policy.fallbackChain.join(" → ")}`,
            `Live execution: ${policy.liveExecutionEnabled ? "enabled" : "disabled"}`,
          ]}
        />
      </section>
    </div>
  );
}

function MemoryDetail({ policy }: { readonly policy: MemoryPolicy }) {
  return (
    <div className="wb-control-detail-grid">
      <section>
        <h3>Allowed records</h3>
        <DetailList items={policy.allowedRecordTypes} />
      </section>
      <section>
        <h3>Source scopes</h3>
        <DetailList items={policy.sourceScopes} />
      </section>
      <section>
        <h3>Freshness</h3>
        <DetailList
          items={[
            `TTL: ${policy.freshness.maximumAgeSeconds}s`,
            `Stale behavior: ${policy.freshness.staleBehavior}`,
          ]}
        />
      </section>
      <section>
        <h3>Context boundary</h3>
        <DetailList
          items={[
            `Maximum bytes: ${policy.maximumContextBytes}`,
            `Prior-run episodic memory: ${policy.priorRunEpisodicMemoryPermitted ? "permitted" : "denied"}`,
          ]}
        />
      </section>
    </div>
  );
}

function ResourceDetail({ resource }: { readonly resource: RegistryResource }) {
  switch (resource.kind) {
    case "AgentCard":
      return <AgentDetail agent={resource} />;
    case "ToolDescriptor":
      return <ToolDetail tool={resource} />;
    case "ModelPolicy":
      return <ModelDetail policy={resource} />;
    case "MemoryPolicy":
      return <MemoryDetail policy={resource} />;
  }
}

export function ControlPlaneScreen() {
  const { actions } = useApp();
  const [tab, setTab] = useState<RegistryTab>("agents");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [selectedKey, setSelectedKey] = useState("");
  const resources = resourcesFor(tab);
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return resources.filter((resource) => {
      const matchesStatus = status === "ALL" || resource.status === status;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        `${resource.id} ${resource.name} ${resource.description}`
          .toLocaleLowerCase()
          .includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [query, resources, status]);
  const selected =
    filtered.find((resource) => resourceKey(resource) === selectedKey) ?? filtered[0];

  const exportResource = (resource: RegistryResource) => {
    downloadTextFile({
      filename: `${resource.id}-${resource.version}.json`,
      mimeType: "application/json;charset=utf-8",
      contents: `${JSON.stringify(resource, null, 2)}\n`,
    });
    actions.toast(
      "success",
      "Capability record saved locally",
      `${resource.id} ${resource.version} was downloaded as JSON.`,
    );
  };

  return (
    <div className="wb-page wb-page-wide">
      <div className="wb-page-head">
        <div>
          <div className="eyebrow wb-mb-8">
            <Icon name="shield" size={13} /> Stage-bound governance registry
          </div>
          <h1 className="wb-page-title">Control Plane</h1>
          <p className="wb-page-desc">
            Versioned capability contracts for the seven executable delivery stages. The registry is
            checked in, schema-validated, content-hashed, and deliberately not a general-purpose
            agent marketplace.
          </p>
        </div>
        <Btn
          variant="secondary"
          icon="download"
          onClick={() => {
            downloadTextFile({
              filename: "ai-delivery-workbench-registry.json",
              mimeType: "application/json;charset=utf-8",
              contents: `${JSON.stringify(registrySnapshot, null, 2)}\n`,
            });
            actions.toast(
              "success",
              "Registry snapshot saved locally",
              "The generated synthetic registry was downloaded as JSON.",
            );
          }}
        >
          Export registry JSON
        </Btn>
      </div>

      <Banner tone="info" title="Functional local registry · no remote agents" icon="info">
        Approval gating, schema checks, hashes, and static exports are functional in this
        repository. Agent/model execution and enterprise integrations remain simulated. A separate
        optional stdio MCP fixture proves bounded local discovery against a disposable toy
        repository; the public browser never starts that process.
      </Banner>

      <div className="wb-control-links wb-mt-12" aria-label="Generated public registry evidence">
        <a href="../capabilities/agents/index.json">Capability-card index</a>
        <a href="../capabilities/mcp/discovery.json">Local MCP discovery snapshot</a>
        <a href="../capabilities/mcp/invocation-evidence.json">Local MCP invocation evidence</a>
        <a href="../capabilities/schemas/approval-policy.schema.json">Approval policy schema</a>
      </div>

      <div className="wb-mt-16">
        <Tabs
          id="control-registry"
          ariaLabel="Control-plane registry resources"
          tabs={RESOURCE_TABS}
          active={tab}
          onChange={(next) => {
            setTab(parseRegistryTab(next));
            setSelectedKey("");
          }}
        />
      </div>

      <div
        id={tabPanelDomId("control-registry")}
        role="tabpanel"
        aria-labelledby={tabDomId("control-registry", tab)}
        tabIndex={0}
        className="wb-control-panel wb-mt-16"
      >
        <Card>
          <div className="wb-card-body wb-control-filters">
            <label className="wb-field">
              <span className="wb-label">Search this registry view</span>
              <input
                type="search"
                className="wb-input"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Name, ID, or declared purpose"
              />
            </label>
            <label className="wb-field">
              <span className="wb-label">Lifecycle status</span>
              <select
                className="wb-input wb-select"
                value={status}
                onChange={(event) => setStatus(parseStatusFilter(event.target.value))}
              >
                <option value="ALL">All lifecycle states</option>
                {REGISTRY_STATUSES.map((registryStatus) => (
                  <option key={registryStatus} value={registryStatus}>
                    {registryStatus.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <div className="wb-control-layout wb-mt-12">
          <Card>
            <div className="wb-card-body wb-card-body--tight">
              <div className="wb-control-results" aria-live="polite">
                {filtered.length} matching {filtered.length === 1 ? "record" : "records"}
              </div>
              <div className="wb-control-resource-list">
                {filtered.map((resource) => (
                  <button
                    key={resourceKey(resource)}
                    type="button"
                    className={`wb-control-resource${selected && resourceKey(selected) === resourceKey(resource) ? " is-selected" : ""}`}
                    onClick={() => setSelectedKey(resourceKey(resource))}
                    aria-pressed={
                      selected ? resourceKey(selected) === resourceKey(resource) : false
                    }
                  >
                    <span>
                      <strong>{resource.name}</strong>
                      <small className="wb-mono">{resource.id}</small>
                    </span>
                    <span className="wb-control-resource-meta">
                      <Badge tone={statusTone(resource.status)}>{resource.status}</Badge>
                      <small className="wb-mono">v{resource.version}</small>
                    </span>
                  </button>
                ))}
                {filtered.length === 0 && (
                  <p className="wb-muted wb-text-sm wb-control-empty">
                    No registry records match these filters.
                  </p>
                )}
              </div>
            </div>
          </Card>

          <Card>
            {selected ? (
              <div className="wb-card-body wb-stack">
                <div className="wb-between wb-control-detail-head">
                  <div>
                    <div className="wb-flex wb-wrap" style={{ gap: 8 }}>
                      <h2>{selected.name}</h2>
                      <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
                    </div>
                    <p className="wb-secondary wb-text-sm wb-mt-8">{selected.description}</p>
                  </div>
                  <Btn variant="secondary" icon="download" onClick={() => exportResource(selected)}>
                    Export JSON
                  </Btn>
                </div>
                <dl className="wb-control-provenance">
                  <div>
                    <dt>Registry ID</dt>
                    <dd className="wb-mono">{selected.id}</dd>
                  </div>
                  <div>
                    <dt>Approved version</dt>
                    <dd className="wb-mono">{selected.version}</dd>
                  </div>
                  <div>
                    <dt>Content hash</dt>
                    <dd className="wb-mono" title={selected.contentHash}>
                      sha256:{selected.contentHash.slice(0, 16)}…
                    </dd>
                  </div>
                  <div>
                    <dt>Source commit</dt>
                    <dd className="wb-mono" title={selected.sourceCommit}>
                      {selected.sourceCommit.slice(0, 12)}
                    </dd>
                  </div>
                </dl>
                <ResourceDetail resource={selected} />
                <SchemaDisclosure label="Complete registry JSON" value={selected} />
              </div>
            ) : (
              <div className="wb-card-body">
                <p className="wb-muted">Select or search for a registry record to inspect it.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
