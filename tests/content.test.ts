import { describe, expect, it } from "vitest";

import { artifactsFor, buildStages, prFor, validationFor } from "../src/demo/data/content";
import { issues, stageDefs } from "../src/demo/data/fixtures";

describe("synthetic workbench content", () => {
  it("builds a complete, deterministic view model for every issue", () => {
    for (const issue of issues) {
      expect(buildStages(issue)).toHaveLength(stageDefs.length);
      expect(
        artifactsFor(issue).every((artifact) => artifact.id.startsWith(`${issue.key}::`)),
      ).toBe(true);
      expect(prFor(issue).branch).toBe(issue.branch);
      expect(validationFor(issue).acceptance.length).toBeGreaterThan(0);
    }
  });
});
