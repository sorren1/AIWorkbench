import { validationFor } from "../data/content";
import type { WorkbenchState } from "./store";

export const DEMO_SCENARIOS = [
  {
    id: "baseline",
    label: "Baseline delivery queue",
    description: "The deterministic ten-issue starting state.",
  },
  {
    id: "ready-review",
    label: "Ready for human review",
    description: "FIN-1077 is waiting at the synthetic pull-request review gate.",
  },
  {
    id: "failed-verification",
    label: "Failed verification",
    description: "FIN-1301 exposes failed synthetic validation evidence and blocked progress.",
  },
  {
    id: "stale-downstream",
    label: "Stale after upstream redo",
    description: "FIN-1198 shows downstream implementation and verification invalidation.",
  },
  {
    id: "clean-walkthrough",
    label: "Clean end-to-end walkthrough",
    description: "FIN-1150 provides a complete synthetic chain for the guided tour.",
  },
] as const;

export type DemoScenarioId = (typeof DEMO_SCENARIOS)[number]["id"];

export function isDemoScenarioId(value: string | null): value is DemoScenarioId {
  return DEMO_SCENARIOS.some((scenario) => scenario.id === value);
}

export function applyDemoScenario(
  baseline: WorkbenchState,
  scenarioId: DemoScenarioId,
): WorkbenchState {
  if (scenarioId === "baseline") return { ...baseline, scenarioId };

  if (scenarioId === "ready-review") {
    return {
      ...baseline,
      scenarioId,
      route: "github",
      selectedKey: "FIN-1077",
    };
  }

  if (scenarioId === "failed-verification") {
    return {
      ...baseline,
      scenarioId,
      route: "validation",
      selectedKey: "FIN-1301",
      valState: {
        "FIN-1301": { started: true, decision: "Failed", evidenceStatus: "Failed" },
      },
    };
  }

  if (scenarioId === "stale-downstream") {
    return {
      ...baseline,
      scenarioId,
      route: "issue",
      selectedKey: "FIN-1198",
    };
  }

  const selected = baseline.issues["FIN-1150"];
  if (!selected) return baseline;
  const validation = validationFor(selected);
  const scenarios = Object.fromEntries(
    validation.scenarios.map((scenario) => [scenario.name, "Passed" as const]),
  );
  const acceptance = Object.fromEntries(
    validation.acceptance.map((criterion) => [criterion.id, "Passed" as const]),
  );
  const checklist = Object.fromEntries(
    // The labels are stable synthetic fixture identifiers within this scenario.
    [
      "Changed files compared with change-targets.json",
      "Unexpected evidence file reviewed and scope exception accepted",
      "Tests cover acceptance criteria",
      "No secrets / credentials in diff",
      "Approval gate verified in UI and API",
    ].map((label) => [label, true]),
  );
  return {
    ...baseline,
    scenarioId,
    route: "queue",
    selectedKey: "FIN-1150",
    issues: {
      ...baseline.issues,
      "FIN-1150": {
        ...selected,
        lifecycle: "Review Ready",
        prStatus: "Ready for review",
        s: ["done", "done", "done", "done", "done", "done", "done", "review"],
        flags: { ...selected.flags, hasPR: true, needsReview: true },
      },
    },
    prState: {
      "FIN-1150": { diffReviewed: true, checklist, status: "Ready for review" },
    },
    artifactReviews: {
      "FIN-1150::change-targets.json": "Approved",
    },
    valState: {
      "FIN-1150": {
        started: true,
        evidenceStatus: "Complete",
        decision: "Passed",
        scenarios,
        acceptance,
        accessibility: "Passed",
        security: "Passed",
      },
    },
  };
}
