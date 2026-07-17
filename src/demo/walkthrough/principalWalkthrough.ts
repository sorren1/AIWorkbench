import type { Route } from "../data/types";

export const PRINCIPAL_WALKTHROUGH_ID = "principal";

export type PrincipalWalkthroughStepId =
  | "thesis"
  | "workflow"
  | "capabilities"
  | "context-manifest"
  | "sandbox-replay"
  | "approval-pause"
  | "reviewer-decision"
  | "duty-boundaries"
  | "evidence-bundle"
  | "trace-budgets"
  | "readiness-gates"
  | "boundaries-provenance";

export type PrincipalWalkthroughStep = {
  readonly id: PrincipalWalkthroughStepId;
  readonly route: Route;
  readonly issueKey?: string;
  readonly durationSeconds: number;
  readonly title: string;
  readonly show: string;
  readonly explain: string;
  readonly query?: Readonly<Record<string, string>>;
};

export const PRINCIPAL_WALKTHROUGH_STEPS: readonly PrincipalWalkthroughStep[] = [
  {
    id: "thesis",
    route: "queue",
    durationSeconds: 35,
    title: "Govern delivery, not just generation",
    show: "Start from the case-study thesis and its functional-versus-simulated boundary.",
    explain:
      "The product question is who may act, with which context and tools, under which human gates, and with what evidence—not whether a model can emit code.",
  },
  {
    id: "workflow",
    route: "issue",
    issueKey: "FIN-1077",
    durationSeconds: 40,
    title: "Follow one synthetic issue through deterministic stages",
    show: "Inspect FIN-1077 from Seed through PR Review and note what each stage emits or blocks.",
    explain:
      "Upstream changes invalidate dependent outputs instead of allowing stale success to survive. The issue is synthetic; the reducer and guard behavior are functional.",
    query: { stage: "review" },
  },
  {
    id: "capabilities",
    route: "control-plane",
    durationSeconds: 50,
    title: "Resolve the exact Agent Card and Tool Descriptor",
    show: "Inspect Implementation Agent, then the Controlled patch application tool.",
    explain:
      "Approved versions bind write paths, model and context policy, approval requirements, timeouts, tool-call limits, repair limits, and estimated ceilings before a run starts.",
    query: { registry: "agents", resource: "agent.implementation" },
  },
  {
    id: "context-manifest",
    route: "issue",
    issueKey: "FIN-1077",
    durationSeconds: 45,
    title: "Audit the context before trusting the artifact",
    show: "Open Implement and inspect included and excluded records, source, TTL, estimate, and digest.",
    explain:
      "Selection is deterministic, not vector retrieval. Stale, revoked, unauthorized, incompatible, and over-budget records remain visible with reasons.",
    query: { stage: "implement", context: "manifest" },
  },
  {
    id: "sandbox-replay",
    route: "trace",
    durationSeconds: 35,
    title: "Replay a validated real local sandbox recording",
    show: "Confirm the recorded run ID, Local Docker provider, exact source commit, and tested-tree binding.",
    explain:
      "The browser reads checked-in validated evidence. It does not start Docker, accept visitor code, or connect to a telemetry backend.",
    query: { traceFocus: "run" },
  },
  {
    id: "approval-pause",
    route: "approvals",
    durationSeconds: 40,
    title: "Pause the high-risk controlled patch",
    show: "Create the bounded approval replay and inspect WAITING_FOR_APPROVAL, the target path, and bound hashes.",
    explain:
      "This browser-local replay invokes the same policy domain used by the CLI. It records the pause and decision but never executes the patch.",
    query: { approvalReplay: "controlled-patch" },
  },
  {
    id: "reviewer-decision",
    route: "approvals",
    durationSeconds: 40,
    title: "Make the human decision as Code Reviewer",
    show: "Switch to Code Reviewer, inspect the synthetic diff, enter a reason, and approve the bound request.",
    explain:
      "The AI Review Assistant is not an approver. The explicit synthetic human persona owns the decision, and approval alone does not execute the action.",
    query: { approvalReplay: "controlled-patch" },
  },
  {
    id: "duty-boundaries",
    route: "approvals",
    durationSeconds: 25,
    title: "Verify separation of duties in domain logic",
    show: "Read the eligibility matrix for the requester, Code Reviewer, and Platform Administrator.",
    explain:
      "The requester is rejected for self-approval; the administrator is outside the required persona/scope; only the distinct reviewer is eligible.",
    query: { approvalReplay: "controlled-patch" },
  },
  {
    id: "evidence-bundle",
    route: "approvals",
    durationSeconds: 45,
    title: "Resume the replay into recorded validation evidence",
    show: "Choose Replay recorded validated outcome, then inspect the JSON, Markdown, trace, diff, hashes, and cleanup receipt.",
    explain:
      "This transition opens the separate Docker-backed recording for the same repository-owned patch fixture. Its evidence truthfully records a preapproved fixture, not the browser decision.",
    query: { approvalReplay: "controlled-patch" },
  },
  {
    id: "trace-budgets",
    route: "trace",
    durationSeconds: 30,
    title: "Read the waterfall, budgets, and intentional absences",
    show: "Identify agent, tool, approval, sandbox, validation, and evidence spans; inspect durations, retries, and thresholds.",
    explain:
      "There is no model.call span because this run is deterministic and uses no model. Token and model cost are exact zero; measured time and exact counters are labeled separately.",
    query: { traceFocus: "waterfall" },
  },
  {
    id: "readiness-gates",
    route: "github",
    issueKey: "FIN-1077",
    durationSeconds: 20,
    title: "Keep PR and validation gates authoritative",
    show: "Inspect changed-file review, required checks, reviewer state, and release-readiness gates.",
    explain:
      "These GitHub and Jira records and writes are synthetic/simulated. The local guard logic is functional, and AI never marks its own change release-ready.",
  },
  {
    id: "boundaries-provenance",
    route: "architecture",
    durationSeconds: 15,
    title: "End on production boundaries and provenance",
    show: "Name the missing production identity, durable approvals, secrets, isolation, and incident controls; then close on the clean-room statement.",
    explain:
      "The public prototype is independently implemented from synthetic/public material. The approved professional-context statement remains separate from prototype evidence.",
  },
] as const;

export const PRINCIPAL_WALKTHROUGH_DURATION_SECONDS = PRINCIPAL_WALKTHROUGH_STEPS.reduce(
  (total, step) => total + step.durationSeconds,
  0,
);

export function principalWalkthroughStepAt(stepIndex: number): PrincipalWalkthroughStep {
  const step = PRINCIPAL_WALKTHROUGH_STEPS[stepIndex];
  if (!step) throw new Error(`Unknown principal walkthrough step index: ${stepIndex}.`);
  return step;
}

export function principalWalkthroughStepIndex(value: string | null): number {
  const byId = PRINCIPAL_WALKTHROUGH_STEPS.findIndex((step) => step.id === value);
  if (byId >= 0) return byId;
  const oneBased = Number.parseInt(value ?? "1", 10);
  return Number.isInteger(oneBased) &&
    oneBased >= 1 &&
    oneBased <= PRINCIPAL_WALKTHROUGH_STEPS.length
    ? oneBased - 1
    : 0;
}

export function configurePrincipalWalkthroughUrl(currentUrl: URL, stepIndex: number): URL {
  const step = principalWalkthroughStepAt(stepIndex);
  const url = new URL(currentUrl.toString());
  url.searchParams.set("walkthrough", PRINCIPAL_WALKTHROUGH_ID);
  url.searchParams.set("tourStep", step.id);
  if (step.route === "queue") url.searchParams.delete("screen");
  else url.searchParams.set("screen", step.route);
  if (step.issueKey) url.searchParams.set("issue", step.issueKey);
  else url.searchParams.delete("issue");
  for (const parameter of [
    "stage",
    "context",
    "registry",
    "resource",
    "approvalReplay",
    "traceFocus",
  ]) {
    url.searchParams.delete(parameter);
  }
  for (const [key, value] of Object.entries(step.query ?? {})) {
    url.searchParams.set(key, value);
  }
  url.searchParams.delete("tour");
  return url;
}
