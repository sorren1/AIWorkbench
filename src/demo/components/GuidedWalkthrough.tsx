import { useEffect, useRef } from "react";

import { recordedWalkthroughEvidence } from "../observability/recordedSummary.generated";
import { useApp } from "../state/store";
import { copyText } from "../utils/browserActions";
import {
  PRINCIPAL_WALKTHROUGH_DURATION_SECONDS,
  PRINCIPAL_WALKTHROUGH_STEPS,
} from "../walkthrough/principalWalkthrough";
import { Btn } from "./primitives";

function formatDuration(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function WalkthroughArchitectureDiagram() {
  return (
    <figure
      className="wb-walkthrough-architecture"
      aria-labelledby="walkthrough-architecture-caption"
    >
      <ol>
        <li>
          <strong>Issue + stage</strong>
          <span>deterministic workflow</span>
        </li>
        <li>
          <strong>Run manifest</strong>
          <span>agent · tool · context · budget</span>
        </li>
        <li>
          <strong>Human gate</strong>
          <span>distinct scoped reviewer</span>
        </li>
        <li>
          <strong>Local execution</strong>
          <span>allow-listed disposable sandbox</span>
        </li>
        <li>
          <strong>Evidence + trace</strong>
          <span>tested tree · receipts · spans</span>
        </li>
        <li>
          <strong>PR readiness</strong>
          <span>human-controlled transition</span>
        </li>
      </ol>
      <figcaption id="walkthrough-architecture-caption">
        The seven-minute path follows one authorization and evidence chain. The public browser
        replays checked-in execution evidence; only the explicit local CLI can run the sandbox.
      </figcaption>
    </figure>
  );
}

export function GuidedWalkthrough({
  stepIndex,
  onStepChange,
  onStartApprovalReplay,
  onClose,
}: {
  readonly stepIndex: number;
  readonly onStepChange: (stepIndex: number) => void;
  readonly onStartApprovalReplay: () => Promise<void>;
  readonly onClose: () => void;
}) {
  const { actions } = useApp();
  const regionRef = useRef<HTMLElement>(null);
  const step = PRINCIPAL_WALKTHROUGH_STEPS[stepIndex];

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

  const previous = () => onStepChange(Math.max(0, stepIndex - 1));
  const next = () => {
    if (stepIndex === PRINCIPAL_WALKTHROUGH_STEPS.length - 1) {
      onClose();
      return;
    }
    onStepChange(stepIndex + 1);
  };
  const copyStepLink = async () => {
    try {
      await copyText(window.location.href);
      actions.toast("success", "Walkthrough link copied", `${step.id} can be reopened directly.`);
    } catch (error) {
      actions.toast(
        "error",
        "Could not copy walkthrough link",
        error instanceof Error ? error.message : "Clipboard access failed.",
      );
    }
  };

  return (
    <section
      ref={regionRef}
      className="wb-walkthrough"
      aria-labelledby="walkthrough-title"
      tabIndex={-1}
      data-tour-step={step.id}
    >
      <div className="wb-walkthrough-meta">
        <span className="eyebrow">Principal walkthrough · 7 minutes</span>
        <span className="wb-mono wb-muted">
          Step {stepIndex + 1} of {PRINCIPAL_WALKTHROUGH_STEPS.length} ·{" "}
          {formatDuration(step.durationSeconds)}
          {" / "}
          {formatDuration(PRINCIPAL_WALKTHROUGH_DURATION_SECONDS)}
        </span>
      </div>
      <div className="wb-walkthrough-layout">
        <div>
          <h2 id="walkthrough-title">{step.title}</h2>
          <p>
            <strong>Show:</strong> {step.show}
          </p>
          <p className="wb-muted">
            <strong>Why it matters:</strong> {step.explain}
          </p>
          {step.id === "sandbox-replay" && recordedWalkthroughEvidence && (
            <p className="wb-walkthrough-proof">
              Recorded run <code>{recordedWalkthroughEvidence.runId}</code> · source commit{" "}
              <code>{recordedWalkthroughEvidence.sourceCommit}</code> ·{" "}
              {recordedWalkthroughEvidence.sandboxProvider}
            </p>
          )}
        </div>
        <div className="wb-walkthrough-actions">
          <Btn size="sm" variant="secondary" onClick={() => onStepChange(stepIndex)}>
            Open this step
          </Btn>
          {step.id === "approval-pause" && (
            <Btn
              size="sm"
              variant="primary"
              icon="shield-check"
              onClick={() => void onStartApprovalReplay()}
            >
              Create high-risk approval replay
            </Btn>
          )}
          <Btn size="sm" variant="ghost" icon="link" onClick={() => void copyStepLink()}>
            Copy step link
          </Btn>
          <Btn size="sm" variant="ghost" onClick={previous} disabled={stepIndex === 0}>
            Previous
          </Btn>
          <Btn size="sm" variant="primary" onClick={next}>
            {stepIndex === PRINCIPAL_WALKTHROUGH_STEPS.length - 1 ? "Finish" : "Next"}
          </Btn>
          <Btn size="sm" variant="ghost" onClick={onClose} aria-label="Close guided walkthrough">
            Close
          </Btn>
        </div>
      </div>
      {step.id === "thesis" && <WalkthroughArchitectureDiagram />}
      {step.id === "boundaries-provenance" && (
        <p className="wb-walkthrough-links">
          Finish with the case study’s{" "}
          <a href="../#production-boundaries">productionization boundaries</a> and{" "}
          <a href="../#clean-room">clean-room/provenance statement</a>.
        </p>
      )}
      <div
        className="wb-walkthrough-progress"
        role="progressbar"
        aria-label="Walkthrough progress"
        aria-valuemin={1}
        aria-valuemax={PRINCIPAL_WALKTHROUGH_STEPS.length}
        aria-valuenow={stepIndex + 1}
      >
        <span
          style={{ width: `${((stepIndex + 1) / PRINCIPAL_WALKTHROUGH_STEPS.length) * 100}%` }}
        />
      </div>
    </section>
  );
}
