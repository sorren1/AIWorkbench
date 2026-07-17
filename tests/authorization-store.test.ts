import { describe, expect, it } from "vitest";

import {
  AUTHORIZATION_STORAGE_KEY,
  clearBrowserAuthorizationState,
  createBaselineAuthorizationState,
  readBrowserAuthorizationState,
  writeBrowserAuthorizationState,
} from "../src/demo/authorization/browserStore";

describe("versioned browser authorization persistence", () => {
  it("persists persona and deterministic approval state across reloads", () => {
    const baseline = createBaselineAuthorizationState();
    writeBrowserAuthorizationState(localStorage, {
      ...baseline,
      personaId: "synthetic-validator",
    });
    expect(readBrowserAuthorizationState(localStorage).personaId).toBe("synthetic-validator");
    clearBrowserAuthorizationState(localStorage);
    expect(readBrowserAuthorizationState(localStorage)).toEqual(baseline);
  });

  it("fails closed on malformed or unknown storage versions", () => {
    localStorage.setItem(
      AUTHORIZATION_STORAGE_KEY,
      JSON.stringify({ version: 2, personaId: "root" }),
    );
    expect(readBrowserAuthorizationState(localStorage)).toEqual(createBaselineAuthorizationState());
  });
});
