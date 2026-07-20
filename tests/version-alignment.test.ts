import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { meta } from "../src/demo/data/fixtures";

const root = resolve(import.meta.dirname, "..");

function readJson(path: string): Record<string, unknown> {
  return JSON.parse(readFileSync(resolve(root, path), "utf8")) as Record<string, unknown>;
}

describe("public release version", () => {
  it("keeps package, lockfile, manifest, case-study, and demo labels aligned", () => {
    const packageJson = readJson("package.json");
    const packageLock = readJson("package-lock.json");
    const manifest = readJson("public/site.webmanifest");
    const caseStudy = readFileSync(resolve(root, "index.html"), "utf8");
    const version = "1.0.8";

    expect(packageJson.version).toBe(version);
    expect(packageLock.version).toBe(version);
    expect((packageLock.packages as Record<string, Record<string, unknown>>)[""]?.version).toBe(
      version,
    );
    expect(manifest.version).toBe(version);
    expect(meta.version).toBe(version);
    expect(caseStudy).toContain(`AI Delivery Workbench · v${version}`);
  });
});
