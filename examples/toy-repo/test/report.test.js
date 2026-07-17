import assert from "node:assert/strict";
import test from "node:test";

import { formatVariance } from "../src/report.js";

test("labels a positive synthetic variance as over budget", () => {
  assert.equal(formatVariance(125, 100), "Variance: 25 over");
});

test("labels a negative synthetic variance as under budget", () => {
  assert.equal(formatVariance(75, 100), "Variance: 25 under");
});
