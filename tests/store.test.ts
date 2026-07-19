import { describe, expect, it } from "vitest";

import { createInitialState, reducer, stageIdx } from "../src/demo/state/store";

describe("workbench reducer", () => {
  it("marks completed downstream stages stale after an upstream redo", () => {
    const initial = createInitialState();
    const issue = initial.issues["FIN-1150"];
    expect(issue).toBeDefined();

    const state = reducer(initial, {
      type: "STALE_FROM",
      key: "FIN-1150",
      fromIdx: stageIdx("implement"),
    });

    expect(state.issues["FIN-1150"]?.s[stageIdx("implement")]).toBe("stale");
    expect(state.issues["FIN-1150"]?.flags.staleDownstream).toBe(true);
    expect(state.issues["FIN-1150"]?.s[stageIdx("verify")]).toBe("stale");
  });

  it("redoing Plan invalidates Change Targets, Implement, Verify, and Review when present", () => {
    const initial = createInitialState();
    const issue = initial.issues["FIN-1150"];
    expect(issue).toBeDefined();
    if (!issue) return;
    initial.issues["FIN-1150"] = { ...issue, s: issue.s.map(() => "done") };

    const state = reducer(initial, {
      type: "INVALIDATE_DOWNSTREAM_AFTER_REDO",
      key: "FIN-1150",
      stageId: "plan",
    });

    expect(state.issues["FIN-1150"]?.s).toEqual([
      "done",
      "done",
      "done",
      "done",
      "stale",
      "stale",
      "stale",
      "stale",
    ]);
  });

  it("does not toggle a governance rule that is locked", () => {
    const initial = createInitialState();
    const locked = initial.settings.governance.find((setting) => setting.locked);
    expect(locked).toBeDefined();

    const state = reducer(initial, { type: "TOGGLE_GOV", id: locked?.id ?? "missing" });

    expect(state.settings.governance.find((setting) => setting.id === locked?.id)?.on).toBe(
      locked?.on,
    );
  });

  it("reset restores an exact deterministic baseline", () => {
    const initial = createInitialState();
    const modified = reducer(initial, { type: "FILTER", patch: { failed: true } });
    const routed = reducer(modified, { type: "ROUTE", route: "trace" });
    expect(reducer(routed, { type: "RESET" })).toEqual(createInitialState());
  });

  it("merges sequential validation results without dropping earlier evidence", () => {
    const initial = createInitialState();
    const first = reducer(initial, {
      type: "VAL",
      key: "FIN-1150",
      patch: {
        scenarios: { "VC-01": "Passed" },
        acceptance: { AC1: "Passed" },
      },
    });
    const second = reducer(first, {
      type: "VAL",
      key: "FIN-1150",
      patch: {
        scenarios: { "VC-02": "Passed" },
        acceptance: { AC2: "Passed" },
      },
    });

    expect(second.valState["FIN-1150"]?.scenarios).toEqual({
      "VC-01": "Passed",
      "VC-02": "Passed",
    });
    expect(second.valState["FIN-1150"]?.acceptance).toEqual({
      AC1: "Passed",
      AC2: "Passed",
    });
  });
});
