import assert from "node:assert/strict";
import test from "node:test";

import { formatVariance } from "../src/report.js";

test("formats a deterministic synthetic variance", () => {
  assert.equal(formatVariance(125, 100), "Variance: 25");
});
