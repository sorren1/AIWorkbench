import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { basename, resolve } from "node:path";

import { chromium, type Page } from "@playwright/test";

import { isAcceptableScreenshotDifference, pixelDifference } from "./screenshot-diff";

type Capture = {
  readonly filename: string;
  readonly path: string;
  readonly heading: string;
};

const root = resolve(import.meta.dirname, "..");
const host = "127.0.0.1";
const port = 4176;
const baseUrl = `http://${host}:${port}`;
const outputDirectory = resolve(root, "public", "assets", "screenshots");
const mismatchDirectory = resolve(root, ".security-reports", "screenshot-mismatch");
const socialSourcePath = resolve(root, "public", "assets", "social-card.svg");
const socialOutputPath = resolve(root, "public", "assets", "social-card.png");
const viteBinary = resolve(root, "node_modules", "vite", "bin", "vite.js");
const checkMode = process.argv.includes("--check");
const CANONICAL_PIXEL_PLATFORM = "linux";
const screenshotMismatches: string[] = [];

const captures: readonly Capture[] = [
  { filename: "case-study-hero.png", path: "/workbench/", heading: "AI Delivery Workbench" },
  { filename: "workbench-overview.png", path: "/demo/", heading: "Work Queue" },
  {
    filename: "governed-issue-timeline.png",
    path: "/demo/?screen=issue&issue=FIN-1150&scenario=clean-walkthrough",
    heading: "AI Variance Commentary Draft",
  },
  {
    filename: "artifact-review.png",
    path: "/demo/?screen=artifacts&issue=FIN-1150&artifact=spec.md&scenario=clean-walkthrough",
    heading: "Artifacts",
  },
  {
    filename: "changed-file-review.png",
    path: "/demo/?screen=github&issue=FIN-1150&scenario=clean-walkthrough",
    heading: "GitHub / PR readiness",
  },
  {
    filename: "validation-evidence.png",
    path: "/demo/?screen=validation&issue=FIN-1150&scenario=clean-walkthrough",
    heading: "Validation Evidence",
  },
  {
    filename: "architecture.png",
    path: "/demo/?screen=architecture",
    heading: "Architecture",
  },
] as const;

function digest(value: Uint8Array): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

async function writeOrVerify(path: string, value: Uint8Array): Promise<void> {
  if (checkMode) {
    const expected = await readFile(path);
    if (!expected.equals(value)) {
      const difference = pixelDifference(expected, value);
      if (process.platform !== CANONICAL_PIXEL_PLATFORM) {
        if (!Number.isFinite(difference.differingPixels)) {
          throw new Error(`${path} has different dimensions from the generated screenshot.`);
        }
        process.stdout.write(
          `Verified ${path} dimensions on ${process.platform}; exact pixel freshness is enforced on ${CANONICAL_PIXEL_PLATFORM}.\n`,
        );
        return;
      }
      if (!isAcceptableScreenshotDifference(difference)) {
        await mkdir(mismatchDirectory, { recursive: true });
        const mismatchPath = resolve(mismatchDirectory, basename(path));
        await writeFile(mismatchPath, value);
        const message =
          `${path} is stale: committed ${digest(expected)}, generated ${digest(value)}, ` +
          `${difference.differingPixels} pixels differ (maximum channel delta ${difference.maxChannelDelta}). ` +
          `Generated mismatch retained at ${mismatchPath}.`;
        screenshotMismatches.push(message);
        process.stderr.write(`${message}\n`);
        return;
      }
      process.stdout.write(
        `Verified ${path} (${difference.differingPixels} antialias pixels, maximum channel delta ${difference.maxChannelDelta})\n`,
      );
      return;
    }
    process.stdout.write(`Verified ${path} (${digest(value)})\n`);
    return;
  }
  await writeFile(path, value);
  process.stdout.write(`Generated ${path} (${digest(value)})\n`);
}

async function waitForPreview(): Promise<void> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/demo/`);
      if (response.ok) return;
    } catch {
      // The preview process has not opened its socket yet.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 150));
  }
  throw new Error(`Vite preview did not become ready at ${baseUrl}.`);
}

async function stabilize(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => document.documentElement.classList.add("is-visual-test"));
  await page.evaluate(
    () =>
      new Promise<void>((resolveFrame) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolveFrame()));
      }),
  );
}

await mkdir(outputDirectory, { recursive: true });

const preview = spawn(
  process.execPath,
  [viteBinary, "preview", "--host", host, "--port", String(port), "--strictPort"],
  {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  },
);

let previewError = "";
preview.stderr.setEncoding("utf8");
preview.stderr.on("data", (chunk: string) => {
  previewError += chunk;
});

let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null;
try {
  await waitForPreview();
  browser = await chromium.launch({ headless: true });

  for (const capture of captures) {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
      colorScheme: "light",
      reducedMotion: "reduce",
    });
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto(`${baseUrl}${capture.path}`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { level: 1, name: capture.heading }).waitFor();
    await stabilize(page);
    const bytes = await page.screenshot({ animations: "disabled" });
    await writeOrVerify(resolve(outputDirectory, capture.filename), bytes);
    await page.close();
  }

  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  await page.goto(pathToFileURL(socialSourcePath).href, { waitUntil: "load" });
  const socialBytes = await page.screenshot({ animations: "disabled" });
  await writeOrVerify(socialOutputPath, socialBytes);
  await page.close();
  if (screenshotMismatches.length > 0) {
    throw new Error(
      `${screenshotMismatches.length} canonical screenshots are stale. Run npm run screenshots:generate on ${CANONICAL_PIXEL_PLATFORM}.`,
    );
  }
} catch (error) {
  const detail = previewError.trim();
  if (detail) process.stderr.write(`${detail}\n`);
  throw error;
} finally {
  await browser?.close();
  preview.kill();
}
