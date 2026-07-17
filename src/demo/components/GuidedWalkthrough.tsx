import { useEffect, useRef, useState } from "react";

import type { Route } from "../data/types";
import { useApp } from "../state/store";
import { Btn } from "./primitives";

type WalkthroughStep = {
  readonly route: Route;
  readonly issueKey?: string;
  readonly title: string;
  readonly duration: string;
  readonly show: string;
  readonly explain: string;
};

const STEPS: readonly WalkthroughStep[] = [
  {
    route: "queue",
    title: "Start with governed work, not a blank prompt",
    duration: "45 sec",
    show: "Filterable synthetic issues expose lifecycle, risk, failures, and review state.",
    explain:
      "The queue makes workflow state the entry point and keeps every fixture visibly synthetic.",
  },
  {
    route: "issue",
    issueKey: "FIN-1150",
    title: "Follow the eight-stage chain of custody",
    duration: "70 sec",
    show: "Open FIN-1150, inspect stage artifacts, then redo a completed upstream stage.",
    explain: "A redo invalidates downstream work instead of allowing stale success to survive.",
  },
  {
    route: "issue",
    issueKey: "FIN-1150",
    title: "Audit the context before trusting the artifact",
    duration: "60 sec",
    show: "Expand a stage and inspect its Context Manifest: inclusions, exclusions, TTL, policy, estimate, and digest.",
    explain:
      "Deterministic rules make context selection replayable. A selected-record revision changes the digest and marks dependent work stale.",
  },
  {
    route: "artifacts",
    issueKey: "FIN-1150",
    title: "Inspect deterministic handoffs",
    duration: "50 sec",
    show: "Move between intake, specification, plan, targets, provenance, and evidence artifacts.",
    explain:
      "Named artifacts turn transient generation into reviewable handoffs with stage and risk metadata.",
  },
  {
    route: "github",
    issueKey: "FIN-1150",
    title: "Keep the human review gate authoritative",
    duration: "80 sec",
    show: "Try approval before changed-file review, inspect expected versus unexpected files, then record review.",
    explain:
      "Synthetic provider state stays behind normal pull-request controls; the AI does not approve itself.",
  },
  {
    route: "validation",
    issueKey: "FIN-1150",
    title: "Bind evidence to the proposed change",
    duration: "60 sec",
    show: "Inspect the commit reference, acceptance coverage, scenarios, and final tester decision.",
    explain:
      "The fixture models evidence that travels with the change rather than a detached green status.",
  },
  {
    route: "architecture",
    title: "Separate responsibility planes",
    duration: "55 sec",
    show: "Compare control, execution, context, and validation responsibilities and adapter boundaries.",
    explain:
      "The focused control plane governs a coding-agent workflow without becoming a generic agent marketplace.",
  },
  {
    route: "trace",
    title: "Inspect the recorded execution trace and budgets",
    duration: "65 sec",
    show: "Follow the nested waterfall, approval wait, tool calls, repair count, budget thresholds, and evidence hashes.",
    explain:
      "The browser renders validated checked-in telemetry; it never connects to a collector or executes the sandbox.",
  },
];

export function GuidedWalkthrough({ onClose }: { readonly onClose: () => void }) {
  const { actions } = useApp();
  const [stepIndex, setStepIndex] = useState(0);
  const regionRef = useRef<HTMLElement>(null);
  const step = STEPS[stepIndex];

  useEffect(() => {
    regionRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  if (!step) return null;

  const openStep = () => actions.navigate(step.route, step.issueKey);
  const previous = () => setStepIndex((current) => Math.max(0, current - 1));
  const next = () => {
    if (stepIndex === STEPS.length - 1) {
      onClose();
      return;
    }
    const nextIndex = stepIndex + 1;
    const nextStep = STEPS[nextIndex];
    setStepIndex(nextIndex);
    if (nextStep) actions.navigate(nextStep.route, nextStep.issueKey);
  };

  return (
    <section
      ref={regionRef}
      className="wb-walkthrough"
      aria-labelledby="walkthrough-title"
      tabIndex={-1}
    >
      <div className="wb-walkthrough-meta">
        <span className="eyebrow">Guided walkthrough · 5–8 minutes</span>
        <span className="wb-mono wb-muted">
          Step {stepIndex + 1} of {STEPS.length} · {step.duration}
        </span>
      </div>
      <div className="wb-walkthrough-layout">
        <div>
          <h2 id="walkthrough-title">{step.title}</h2>
          <p>
            <strong>Show:</strong> {step.show}
          </p>
          <p className="wb-muted">
            <strong>Explain:</strong> {step.explain}
          </p>
        </div>
        <div className="wb-walkthrough-actions">
          <Btn size="sm" variant="secondary" onClick={openStep}>
            Open this screen
          </Btn>
          <Btn size="sm" variant="ghost" onClick={previous} disabled={stepIndex === 0}>
            Previous
          </Btn>
          <Btn size="sm" variant="primary" onClick={next}>
            {stepIndex === STEPS.length - 1 ? "Finish" : "Next"}
          </Btn>
          <Btn size="sm" variant="ghost" onClick={onClose} aria-label="Close guided walkthrough">
            Close
          </Btn>
        </div>
      </div>
      <div
        className="wb-walkthrough-progress"
        role="progressbar"
        aria-label="Walkthrough progress"
        aria-valuemin={1}
        aria-valuemax={STEPS.length}
        aria-valuenow={stepIndex + 1}
      >
        <span style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }} />
      </div>
    </section>
  );
}
