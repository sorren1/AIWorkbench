import { useMemo, useState } from "react";

import {
  APPROVAL_STATUSES,
  type ApprovalRequest,
  type ApprovalStatus,
} from "../authorization/contracts";
import {
  transitionApprovalRequest,
  validateApprovalForResume,
  verifyApprovalEventLog,
} from "../authorization/approvalProtocol";
import { isPersonaId, personaById } from "../authorization/personas";
import { registrySnapshot } from "../control-plane/registry/generated";
import { useApp } from "../state/store";
import { Icon } from "../../shared/Icon";
import { Badge, Banner, Btn, Card } from "../components/primitives";

type StatusFilter = "ALL" | ApprovalStatus;

function statusTone(status: ApprovalStatus): "accent" | "safe" | "danger" | "warn" | "neutral" {
  switch (status) {
    case "PENDING":
      return "accent";
    case "APPROVED":
      return "safe";
    case "REJECTED":
      return "danger";
    case "EXPIRED":
      return "warn";
    case "INVALIDATED":
      return "neutral";
  }
}

function shortHash(value: string): string {
  return `sha256:${value.slice(0, 12)}…`;
}

function policyFor(request: ApprovalRequest) {
  return registrySnapshot.approvalPolicies.find(
    (policy) =>
      policy.id === request.policy.id &&
      policy.version === request.policy.version &&
      policy.contentHash === request.policy.contentHash,
  );
}

export function ApprovalInboxScreen() {
  const { state, actions } = useApp();
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [selectedId, setSelectedId] = useState("");
  const [reason, setReason] = useState("");
  const persona = personaById(state.personaId);
  const requests = useMemo(
    () =>
      Object.values(state.approvalStore.requests)
        .filter((request) => status === "ALL" || request.status === status)
        .sort((left, right) => right.requestedAt.localeCompare(left.requestedAt)),
    [state.approvalStore.requests, status],
  );
  const selected = requests.find((request) => request.requestId === selectedId) ?? requests[0];
  const selectedPolicy = selected ? policyFor(selected) : undefined;
  const missingApproverScopes = selectedPolicy
    ? selectedPolicy.requiredApproverScopes.filter(
        (scope) => !persona.scopes.some((candidate) => candidate === scope),
      )
    : [];
  const requiredApproverPersonas: readonly string[] =
    selectedPolicy?.requiredApproverPersonas ?? [];
  const personaAllowed = selectedPolicy
    ? requiredApproverPersonas.includes(persona.id) && missingApproverScopes.length === 0
    : false;
  const selfApprovalBlocked = Boolean(
    selected && selectedPolicy?.forbidSelfApproval && selected.requesterActor === persona.id,
  );

  const decide = async (decision: "APPROVED" | "REJECTED") => {
    if (!selected) return;
    try {
      await actions.decideApproval(selected.requestId, decision, reason, new Date().toISOString());
      setReason("");
      actions.toast(
        decision === "APPROVED" ? "success" : "warn",
        `Approval ${decision.toLocaleLowerCase()}`,
        `${selected.requestId} was recorded in the browser-local append-only event history.`,
      );
    } catch (error) {
      actions.toast(
        "error",
        "Decision blocked",
        error instanceof Error ? error.message : "The policy engine rejected this decision.",
      );
    }
  };

  const resume = async () => {
    if (!selected || !selectedPolicy) return;
    if (!(await verifyApprovalEventLog(state.approvalStore.events))) {
      actions.toast(
        "error",
        "Approval journal invalid",
        "The browser-local append-only event hash chain no longer validates.",
      );
      return;
    }
    const approver =
      selected.decisionActor && isPersonaId(selected.decisionActor)
        ? personaById(selected.decisionActor)
        : null;
    const result = validateApprovalForResume({
      request: selected,
      binding: selected.binding,
      policy: selectedPolicy,
      approver,
      now: new Date().toISOString(),
    });
    if (!result.allowed) {
      const approvalStore = await transitionApprovalRequest({
        store: state.approvalStore,
        requestId: selected.requestId,
        status: "INVALIDATED",
        actor: state.personaId,
        reason: result.detail,
        timestamp: new Date().toISOString(),
      });
      actions.setApprovalStore(approvalStore);
      actions.toast("error", "Resume denied", result.detail);
      return;
    }
    if (selected.tool.id === "tool.workflow.release-readiness") {
      actions.setPR(selected.effectiveSubject, {
        status: "Approved — validation",
        reviewer: "approved",
        approvedForValidation: true,
      });
      actions.patchIssue(selected.effectiveSubject, { prStatus: "Approved for validation" });
      actions.toast(
        "success",
        "Bound approval consumed",
        "The exact browser-local release-readiness transition was resumed after hash revalidation.",
      );
      actions.navigate("validation", selected.effectiveSubject);
      return;
    }
    actions.toast(
      "info",
      "Approval remains bound",
      "This request can be consumed only by the documented local sandbox resume command.",
    );
  };

  return (
    <div className="wb-page wb-page-wide">
      <div className="wb-page-head">
        <div>
          <div className="eyebrow wb-mb-8">
            <Icon name="shield-check" size={13} /> Durable local decision records
          </div>
          <h1 className="wb-page-title">Approval Inbox</h1>
          <p className="wb-page-desc">
            Review hash-bound requests as explicit synthetic personas. Requests and append-only
            decision events persist locally across reloads; they are not authenticated enterprise
            identities or shared production approvals.
          </p>
        </div>
      </div>

      <Banner tone="info" title={`Viewing as ${persona.shortName}`} icon="key">
        {persona.description} Effective scopes are intersected with the agent, tool, stage, and
        resource boundaries before policy evaluation.
      </Banner>

      <Card className="wb-mt-16">
        <div className="wb-card-body wb-control-filters">
          <label className="wb-field">
            <span className="wb-label">Approval state</span>
            <select
              className="wb-input wb-select"
              value={status}
              onChange={(event) => {
                const value = event.currentTarget.value;
                setStatus(
                  value === "ALL"
                    ? "ALL"
                    : (APPROVAL_STATUSES.find((item) => item === value) ?? "ALL"),
                );
                setSelectedId("");
              }}
            >
              <option value="ALL">All states</option>
              {APPROVAL_STATUSES.map((approvalStatus) => (
                <option key={approvalStatus} value={approvalStatus}>
                  {approvalStatus}
                </option>
              ))}
            </select>
          </label>
          <div className="wb-control-policy-strip" aria-label="Approval inbox counts">
            {APPROVAL_STATUSES.map((approvalStatus) => (
              <span key={approvalStatus}>
                {approvalStatus}:{" "}
                {
                  Object.values(state.approvalStore.requests).filter(
                    (request) => request.status === approvalStatus,
                  ).length
                }
              </span>
            ))}
          </div>
        </div>
      </Card>

      <div className="wb-control-layout wb-mt-12">
        <Card>
          <div className="wb-card-body wb-card-body--tight">
            <div className="wb-control-results" aria-live="polite">
              {requests.length} matching {requests.length === 1 ? "request" : "requests"}
            </div>
            <div className="wb-control-resource-list">
              {requests.map((request) => (
                <button
                  type="button"
                  key={request.requestId}
                  className={`wb-control-resource${selected?.requestId === request.requestId ? " is-selected" : ""}`}
                  onClick={() => setSelectedId(request.requestId)}
                  aria-pressed={selected?.requestId === request.requestId}
                >
                  <span>
                    <strong>{request.tool.id}</strong>
                    <small className="wb-mono">{request.requestId}</small>
                  </span>
                  <Badge tone={statusTone(request.status)}>{request.status}</Badge>
                </button>
              ))}
              {requests.length === 0 && (
                <div className="wb-control-empty wb-stack-sm">
                  <p className="wb-muted wb-text-sm">No approval requests match this state.</p>
                  <Btn variant="secondary" onClick={() => actions.navigate("github", "FIN-1150")}>
                    Open synthetic PR review
                  </Btn>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Card>
          {selected ? (
            <div className="wb-card-body wb-stack">
              <div className="wb-between wb-wrap">
                <div>
                  <div className="wb-flex wb-wrap" style={{ gap: 8 }}>
                    <h2>Approval request</h2>
                    <Badge tone={statusTone(selected.status)}>{selected.status}</Badge>
                  </div>
                  <p className="wb-mono wb-muted wb-mt-8">{selected.requestId}</p>
                </div>
                <Badge tone="neutral">Functional browser-local record</Badge>
              </div>

              <dl className="wb-control-provenance">
                <div>
                  <dt>Requester</dt>
                  <dd>{personaById(selected.requesterActor).shortName}</dd>
                </div>
                <div>
                  <dt>Effective subject</dt>
                  <dd className="wb-mono">{selected.effectiveSubject}</dd>
                </div>
                <div>
                  <dt>Agent</dt>
                  <dd className="wb-mono">
                    {selected.agent.id}@{selected.agent.version}
                  </dd>
                </div>
                <div>
                  <dt>Tool</dt>
                  <dd className="wb-mono">
                    {selected.tool.id}@{selected.tool.version}
                  </dd>
                </div>
                <div>
                  <dt>Policy</dt>
                  <dd className="wb-mono">
                    {selected.policy.id}@{selected.policy.version}
                  </dd>
                </div>
                <div>
                  <dt>Arguments</dt>
                  <dd className="wb-mono" title={selected.proposedToolArgumentsHash}>
                    {shortHash(selected.proposedToolArgumentsHash)}
                  </dd>
                </div>
                <div>
                  <dt>Change targets</dt>
                  <dd className="wb-mono" title={selected.binding.changeTargetDigest}>
                    {shortHash(selected.binding.changeTargetDigest)}
                  </dd>
                </div>
                <div>
                  <dt>Context pack</dt>
                  <dd className="wb-mono" title={selected.binding.contextPackDigest}>
                    {shortHash(selected.binding.contextPackDigest)}
                  </dd>
                </div>
              </dl>

              <section>
                <h3>Target paths</h3>
                <ul className="wb-control-list">
                  {selected.targetPaths.length > 0 ? (
                    selected.targetPaths.map((path) => (
                      <li key={path} className="wb-mono">
                        {path}
                      </li>
                    ))
                  ) : (
                    <li>No filesystem target</li>
                  )}
                </ul>
              </section>

              {selected.status === "PENDING" && (
                <div className="wb-stack-sm">
                  {!personaAllowed || selfApprovalBlocked ? (
                    <Banner tone="warn" title="Decision unavailable for this persona" icon="lock">
                      {selfApprovalBlocked
                        ? `${selectedPolicy?.id} forbids self-approval.`
                        : `Policy ${selectedPolicy?.id ?? "unavailable"} requires ${selectedPolicy?.requiredApproverPersonas.join(", ") || "an authorized persona"}${missingApproverScopes.length > 0 ? ` with scope ${missingApproverScopes.join(", ")}` : ""}.`}
                    </Banner>
                  ) : (
                    <Banner
                      tone="safe"
                      title="Persona satisfies approver policy"
                      icon="shield-check"
                    >
                      The decision is still bound to the exact arguments, versions, target digest,
                      and context digest shown above.
                    </Banner>
                  )}
                  <label className="wb-field">
                    <span className="wb-label">Decision reason</span>
                    <textarea
                      className="wb-input"
                      rows={3}
                      value={reason}
                      onChange={(event) => setReason(event.currentTarget.value)}
                    />
                  </label>
                  <div className="wb-flex wb-wrap" style={{ gap: 8 }}>
                    <Btn
                      variant="primary"
                      icon="shield-check"
                      disabled={!personaAllowed || selfApprovalBlocked}
                      onClick={() => void decide("APPROVED")}
                    >
                      Approve bound request
                    </Btn>
                    <Btn
                      variant="danger"
                      icon="x"
                      disabled={!personaAllowed || selfApprovalBlocked}
                      onClick={() => void decide("REJECTED")}
                    >
                      Reject request
                    </Btn>
                  </div>
                </div>
              )}

              {selected.status === "APPROVED" && (
                <div className="wb-stack-sm">
                  <Banner tone="safe" title="Approved, pending exact resume" icon="check-circle">
                    Approval does not execute the action. Resume revalidates every bound hash and
                    the approver's current authority.
                  </Banner>
                  <Btn variant="primary" icon="play" onClick={() => void resume()}>
                    Resume bound local action
                  </Btn>
                </div>
              )}

              {selected.decisionActor && (
                <p className="wb-text-sm wb-secondary">
                  Decision by {personaById(selected.decisionActor).shortName}:{" "}
                  {selected.decisionReason}
                </p>
              )}

              <details className="wb-control-schema">
                <summary>Complete approval JSON</summary>
                <pre className="wb-code cr-scroll">{JSON.stringify(selected, null, 2)}</pre>
              </details>
            </div>
          ) : (
            <div className="wb-card-body">
              <p className="wb-muted">Select a request to inspect its bound evidence.</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
