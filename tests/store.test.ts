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
    expect(state.issues["FIN-1150"]?.s[stageIdx("verify")]).toBe("ready");
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
});
