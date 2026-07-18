import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

import type { ReleaseSummary } from "./supply-chain/contracts";
import { trackedSourceDigest, trackedSourcePaths } from "./trackedSourceInventory";

const root = resolve(import.meta.dirname, "..");
const summaryPath = resolve(root, ".security-reports/release-summary.json");
const configuredNpmCli = process.env.npm_execpath;
if (!configuredNpmCli)
  throw new Error("npm_execpath is required for the workspace-reuse regression.");
const npmCli: string = configuredNpmCli;

async function command(script: string, args: readonly string[] = []): Promise<void> {
  await new Promise<void>((accept, reject) => {
    const child = spawn(process.execPath, [npmCli, "run", script, "--", ...args], {
      cwd: root,
      env: process.env,
      stdio: ["ignore", "inherit", "inherit"],
      shell: false,
      windowsHide: true,
    });
    child.once("error", reject);
    child.once("close", (code: number | null) => {
      if (code === 0) accept();
      else reject(new Error(`${script} failed with exit ${code ?? "unknown"}.`));
    });
  });
}

async function summary(): Promise<ReleaseSummary> {
  return JSON.parse(await readFile(summaryPath, "utf8")) as ReleaseSummary;
}

function stableOutcome(value: ReleaseSummary): string {
  return JSON.stringify({
    schemaVersion: value.schemaVersion,
    source: value.source,
    controls: value.controls,
    artifacts: value.artifacts.map(({ kind, name }) => ({ kind, name })),
    suppressions: value.suppressions,
    runtimeImages: value.runtimeImages,
  });
}

function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const paths = await trackedSourcePaths(root);
const currentTreeDigest = await trackedSourceDigest(
  root,
  paths,
  new Set(["public/security/release-summary.json"]),
);
let baseline = await summary().catch(() => null);
if (!baseline || baseline.source.treeDigest !== currentTreeDigest) {
  await command("security:supply-chain");
  baseline = await summary();
}
const cleanOutcome = stableOutcome(baseline);

await command("test:e2e", ["--project=chromium", "tests/e2e/security.spec.ts"]);
await access(resolve(root, "playwright-report/index.html"));
await access(resolve(root, "test-results/.last-run.json"));
await command("security:supply-chain");

const reused = await summary();
const reusedOutcome = stableOutcome(reused);
if (cleanOutcome !== reusedOutcome) {
  throw new Error(
    `Supply-chain results changed after Playwright artifacts were generated: ${digest(cleanOutcome)} != ${digest(reusedOutcome)}.`,
  );
}
process.stdout.write(
  `Tracked-source supply-chain outcome remained identical after Playwright: ${digest(reusedOutcome)}.\n`,
);
