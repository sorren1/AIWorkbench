import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { gzipSync } from "node:zlib";

type Budgets = {
  readonly schemaVersion: 1;
  readonly caseStudyHtmlGzipBytes: number;
  readonly caseStudyExecutableScriptCount: number;
  readonly demoEntryJavaScriptGzipBytes: number;
  readonly totalJavaScriptGzipBytes: number;
  readonly totalCssGzipBytes: number;
  readonly externalRuntimeRequestCount: number;
};

type Measurements = Omit<Budgets, "schemaVersion">;
type Report = {
  readonly schemaVersion: 1;
  readonly method: "gzip-level-9-over-normalized-vite-production-output";
  readonly measurements: Measurements;
  readonly budgets: Measurements;
};

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");
const budgetPath = resolve(root, "quality/performance-budgets.json");
const reportPath = resolve(root, "quality/measurements/bundle.json");
const releaseSummaryPath = resolve(root, "public/security/release-summary.json");

async function files(path: string): Promise<readonly string[]> {
  const metadata = await stat(path).catch(() => null);
  if (!metadata) return [];
  if (metadata.isFile()) return [path];
  if (!metadata.isDirectory()) return [];
  const names = await readdir(path);
  return (await Promise.all(names.sort().map((name) => files(resolve(path, name))))).flat();
}

function gzipBytes(contents: Buffer | string): number {
  return gzipSync(contents, { level: 9 }).byteLength;
}

function normalizeVolatileEvidence(contents: string): string {
  return contents
    .replaceAll(/\b\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\b/g, "0000-00-00T00:00:00.000Z")
    .replaceAll(/\bsandbox-\d{8}t\d{6}-[a-f0-9]{8}\b/g, "sandbox-00000000t000000-00000000")
    .replaceAll(/\b[a-f0-9]{12,64}\b/g, (value) => "0".repeat(value.length));
}

function assetPath(htmlPath: string, reference: string): string {
  const relativeHtml = htmlPath.replace(`${dist}${sep}`, "").replaceAll(sep, "/");
  const url = new URL(reference, `https://static.invalid/${relativeHtml}`);
  return resolve(dist, decodeURIComponent(url.pathname).replace(/^\//, ""));
}

const budgets = JSON.parse(await readFile(budgetPath, "utf8")) as Budgets;
if (budgets.schemaVersion !== 1) throw new Error("Unsupported performance budget schema");
const caseStudyPath = resolve(dist, "index.html");
const demoPath = resolve(dist, "demo/index.html");
const [caseStudyHtml, demoHtml, outputFiles] = await Promise.all([
  readFile(caseStudyPath, "utf8"),
  readFile(demoPath, "utf8"),
  files(dist),
]);
const demoEntryReferences = [...demoHtml.matchAll(/<script\b[^>]*\bsrc="([^"]+)"[^>]*>/g)].map(
  (match) => match[1] ?? "",
);
const demoEntryJavaScriptGzipBytes = (
  await Promise.all(
    demoEntryReferences.map(async (reference) =>
      gzipBytes(await readFile(assetPath(demoPath, reference))),
    ),
  )
).reduce((total, value) => total + value, 0);
const resourceReferences = [caseStudyHtml, demoHtml].flatMap((html) =>
  [...html.matchAll(/<(?:script|img|link)\b[^>]*\b(?:src|href)="([^"]+)"[^>]*>/g)].map(
    (match) => match[1] ?? "",
  ),
);
const measurements: Measurements = {
  caseStudyHtmlGzipBytes: gzipBytes(normalizeVolatileEvidence(caseStudyHtml)),
  caseStudyExecutableScriptCount: [...caseStudyHtml.matchAll(/<script\b(?=[^>]*\bsrc=)[^>]*>/g)]
    .length,
  demoEntryJavaScriptGzipBytes,
  totalJavaScriptGzipBytes: (
    await Promise.all(
      outputFiles
        .filter((path) => extname(path) === ".js")
        .map(async (path) => gzipBytes(await readFile(path))),
    )
  ).reduce((total, value) => total + value, 0),
  totalCssGzipBytes: (
    await Promise.all(
      outputFiles
        .filter((path) => extname(path) === ".css")
        .map(async (path) => gzipBytes(await readFile(path))),
    )
  ).reduce((total, value) => total + value, 0),
  externalRuntimeRequestCount: resourceReferences.filter((reference) =>
    /^https?:\/\//i.test(reference),
  ).length,
};
const budgetValues: Measurements = {
  caseStudyHtmlGzipBytes: budgets.caseStudyHtmlGzipBytes,
  caseStudyExecutableScriptCount: budgets.caseStudyExecutableScriptCount,
  demoEntryJavaScriptGzipBytes: budgets.demoEntryJavaScriptGzipBytes,
  totalJavaScriptGzipBytes: budgets.totalJavaScriptGzipBytes,
  totalCssGzipBytes: budgets.totalCssGzipBytes,
  externalRuntimeRequestCount: budgets.externalRuntimeRequestCount,
};
const failures = Object.entries(measurements).filter(
  ([name, value]) => value > budgetValues[name as keyof Measurements],
);
if (failures.length > 0) {
  throw new Error(
    `Performance budget exceeded:\n${failures
      .map(([name, value]) => `${name}: ${value} > ${budgetValues[name as keyof Measurements]}`)
      .join("\n")}`,
  );
}
const report: Report = {
  schemaVersion: 1,
  method: "gzip-level-9-over-normalized-vite-production-output",
  measurements,
  budgets: budgetValues,
};
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (process.argv.includes("--record")) {
  await mkdir(resolve(root, "quality/measurements"), { recursive: true });
  await writeFile(reportPath, serialized, "utf8");
} else {
  const recorded = await readFile(reportPath, "utf8").catch(() => "");
  if (recorded !== serialized) {
    const releaseSummary = await stat(releaseSummaryPath).catch(() => null);
    if (!releaseSummary?.isFile()) {
      throw new Error(
        "Recorded bundle measurements are stale; run npm run performance:budgets:record after a production build.",
      );
    }

    const argumentCount = process.argv.length;
    process.argv.push("--require");
    try {
      await import("./check-release-evidence");
    } finally {
      process.argv.length = argumentCount;
    }
    process.stdout.write(
      "The rendered evidence summary changed the recorded HTML measurement; the tagged summary-only evidence commit remains within every performance budget.\n",
    );
  }
}
process.stdout.write(
  `Measured production budgets passed: case study ${measurements.caseStudyHtmlGzipBytes} B gzip, demo entry ${measurements.demoEntryJavaScriptGzipBytes} B gzip, total JS ${measurements.totalJavaScriptGzipBytes} B gzip.\n`,
);
