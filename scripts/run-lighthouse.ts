import { spawn } from "node:child_process";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { chromium } from "@playwright/test";

import {
  LIGHTHOUSE_ROUTES,
  normalizeProductionOrigin,
  summarizeLighthouseResults,
} from "./post-deployment/contracts";

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
const hostedOrigin = process.env.LIGHTHOUSE_BASE_URL
  ? normalizeProductionOrigin(process.env.LIGHTHOUSE_BASE_URL)
  : null;

type LighthouseConfig = {
  ci: {
    collect: {
      staticDistDir?: string;
      url: string[];
    };
    assert: {
      assertMatrix: { matchingUrlPattern: string }[];
    };
  };
};

function escapeRegularExpression(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

async function profileConfig(profile: "desktop" | "mobile"): Promise<string> {
  const trackedConfig = resolve(root, `quality/lighthouse/${profile}.json`);
  if (!hostedOrigin) return trackedConfig;

  const parsed = JSON.parse(await readFile(trackedConfig, "utf8")) as LighthouseConfig;
  if (
    !parsed.ci?.collect ||
    !Array.isArray(parsed.ci.assert?.assertMatrix) ||
    parsed.ci.assert.assertMatrix.length !== LIGHTHOUSE_ROUTES.length
  ) {
    throw new Error(`Lighthouse ${profile} configuration does not cover the required routes.`);
  }
  delete parsed.ci.collect.staticDistDir;
  parsed.ci.collect.url = LIGHTHOUSE_ROUTES.map((path) =>
    new URL(path, `${hostedOrigin}/`).toString(),
  );
  parsed.ci.assert.assertMatrix.forEach((assertion, index) => {
    const url = parsed.ci.collect.url[index];
    if (!url) throw new Error(`Lighthouse ${profile} route ${index} is unavailable.`);
    assertion.matchingUrlPattern = `^${escapeRegularExpression(url)}$`;
  });
  const generatedConfig = resolve(outputRoot, `${profile}-hosted-config.json`);
  await writeFile(generatedConfig, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  return generatedConfig;
}

async function runProfile(profile: "desktop" | "mobile"): Promise<void> {
  const config = await profileConfig(profile);
  const environment: NodeJS.ProcessEnv = {
    ...process.env,
    CHROME_PATH: chromium.executablePath(),
  };
  if (process.env.CI) {
    // GitHub-hosted runners block the downloaded Chromium sandbox with AppArmor.
    // The browser audits only this repository's trusted, local static build.
    environment.LHCI_COLLECT__SETTINGS__CHROME_FLAGS = "--no-sandbox --disable-setuid-sandbox";
  }
  await new Promise<void>((accept, reject) => {
    const child = spawn(executable, ["autorun", "--config", config], {
      cwd: root,
      env: environment,
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
await mkdir(outputRoot, { recursive: true });
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
if (hostedOrigin) summarizeLighthouseResults(summary, hostedOrigin, 0);
process.stdout.write(
  hostedOrigin
    ? `Desktop and mobile Lighthouse assertions passed for ${hostedOrigin}; detailed reports are retained outside the public bundle.\n`
    : "Desktop and mobile Lighthouse assertions passed; reports are local only.\n",
);
