import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

type LighthouseManifestEntry = {
  readonly url: string;
  readonly summary: Readonly<Record<string, number>>;
};

const root = resolve(import.meta.dirname, "..");
const outputRoot = resolve(root, ".lighthouseci");
const executable = resolve(
  root,
  "node_modules/.bin",
  process.platform === "win32" ? "lhci.cmd" : "lhci",
);

async function runProfile(profile: "desktop" | "mobile"): Promise<void> {
  const config = resolve(root, `quality/lighthouse/${profile}.json`);
  await new Promise<void>((accept, reject) => {
    const child = spawn(executable, ["autorun", "--config", config], {
      cwd: root,
      env: { ...process.env, CHROME_PATH: chromium.executablePath() },
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) accept();
      else reject(new Error(`Lighthouse ${profile} audit exited with code ${code ?? "unknown"}`));
    });
  });
}

await rm(outputRoot, { force: true, recursive: true });
await runProfile("desktop");
await runProfile("mobile");

const summary: Record<string, readonly LighthouseManifestEntry[]> = {};
for (const profile of ["desktop", "mobile"] as const) {
  const manifest = JSON.parse(
    await readFile(resolve(outputRoot, profile, "manifest.json"), "utf8"),
  ) as readonly LighthouseManifestEntry[];
  summary[profile] = manifest.map(({ url, summary: scores }) => ({ url, summary: scores }));
}
await mkdir(outputRoot, { recursive: true });
await writeFile(
  resolve(outputRoot, "summary.json"),
  `${JSON.stringify(summary, null, 2)}\n`,
  "utf8",
);
process.stdout.write("Desktop and mobile Lighthouse assertions passed; reports are local only.\n");
