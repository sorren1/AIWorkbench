import { readFile, readdir, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const dist = resolve(root, "dist");

async function files(path: string): Promise<readonly string[]> {
  const metadata = await stat(path).catch(() => null);
  if (!metadata) return [];
  if (metadata.isFile()) return [path];
  if (!metadata.isDirectory()) return [];
  const children = await readdir(path);
  return (await Promise.all(children.sort().map((child) => files(resolve(path, child))))).flat();
}

function relativePath(path: string): string {
  return path.replace(`${dist}${sep}`, "").replaceAll(sep, "/");
}

function localTarget(source: string, reference: string): { path: string; fragment: string } | null {
  if (/^(?:https?:|mailto:|tel:|data:|blob:)/i.test(reference)) return null;
  const base = new URL(`https://static.invalid/${relativePath(source)}`);
  const target = new URL(reference, base);
  let targetPath = decodeURIComponent(target.pathname);
  if (targetPath.endsWith("/")) targetPath += "index.html";
  const path = resolve(dist, targetPath.replace(/^\//, ""));
  if (path !== dist && !path.startsWith(`${dist}${sep}`)) {
    throw new Error(`${relativePath(source)} contains a path outside the static build`);
  }
  return { path, fragment: decodeURIComponent(target.hash.replace(/^#/, "")) };
}

const findings: string[] = [];
for (const htmlPath of (await files(dist)).filter((path) => extname(path) === ".html")) {
  const html = await readFile(htmlPath, "utf8");
  const references = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1] ?? "");
  for (const reference of references) {
    if (reference === "#") {
      findings.push(`${relativePath(htmlPath)}: empty fragment link`);
      continue;
    }
    const target = localTarget(htmlPath, reference);
    if (!target) continue;
    const targetContents = await readFile(target.path).catch(() => null);
    if (!targetContents) {
      findings.push(`${relativePath(htmlPath)}: missing ${relativePath(target.path)}`);
      continue;
    }
    if (target.fragment && extname(target.path) === ".html") {
      const targetHtml = targetContents.toString("utf8");
      const escaped = target.fragment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (!new RegExp(`(?:id|name)="${escaped}"`).test(targetHtml)) {
        findings.push(
          `${relativePath(htmlPath)}: missing fragment #${target.fragment} in ${relativePath(target.path)}`,
        );
      }
    }
  }
}

if (findings.length > 0) {
  throw new Error(`Static link validation failed:\n${findings.join("\n")}`);
}
process.stdout.write("Static HTML links and fragments resolve within the production build.\n");
