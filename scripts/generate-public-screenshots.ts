import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";

const root = resolve(import.meta.dirname, "..");
const host = "127.0.0.1";
const port = 4176;
const baseUrl = `http://${host}:${port}`;
const outputDirectory = resolve(root, "public", "assets", "screenshots");
const outputPath = resolve(outputDirectory, "workbench-overview.png");
const viteBinary = resolve(root, "node_modules", "vite", "bin", "vite.js");

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
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
    deviceScaleFactor: 1,
    colorScheme: "light",
    reducedMotion: "reduce",
  });
  await page.goto(`${baseUrl}/demo/`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { level: 1, name: "Work Queue" }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({
    content:
      "*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;caret-color:transparent!important}",
  });
  await page.screenshot({
    path: outputPath,
    fullPage: true,
    animations: "disabled",
  });
  process.stdout.write(`Generated ${outputPath}\n`);
} catch (error) {
  const detail = previewError.trim();
  if (detail) process.stderr.write(`${detail}\n`);
  throw error;
} finally {
  await browser?.close();
  preview.kill();
}
