import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { extname, relative, resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");

function trackedMarkdownFiles(): readonly string[] {
  const output = execFileSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "--", "*.md"],
    { cwd: root, encoding: "utf8" },
  );
  return [...new Set(output.split(/\r?\n/).filter(Boolean))]
    .filter((path) => existsSync(resolve(root, path)))
    .sort();
}

function repositoryPath(path: string): string {
  return relative(root, path).split(sep).join("/");
}

function githubSlug(text: string): string {
  return text
    .replace(/<[^>]*>/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function headingSlugs(markdown: string): ReadonlySet<string> {
  const slugs = new Set<string>();
  const seen = new Map<string, number>();
  let inFence = false;
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^#{1,6}\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match?.[1]) continue;
    const base = githubSlug(match[1]);
    if (!base) continue;
    const duplicate = seen.get(base) ?? 0;
    seen.set(base, duplicate + 1);
    slugs.add(duplicate === 0 ? base : `${base}-${duplicate}`);
  }
  return slugs;
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

type MarkdownReference = {
  readonly path: string;
  readonly fragment: string;
};

function localReference(source: string, rawReference: string): MarkdownReference | null {
  const unwrapped =
    rawReference.startsWith("<") && rawReference.endsWith(">")
      ? rawReference.slice(1, -1)
      : rawReference;
  if (/^(?:https?:|mailto:|tel:|data:|blob:)/i.test(unwrapped)) return null;
  const [rawPath = "", rawFragment = ""] = unwrapped.split("#", 2);
  const targetPath = decode(rawPath);
  const path = targetPath.startsWith("/")
    ? resolve(root, targetPath.replace(/^[/\\]+/, ""))
    : resolve(source, "..", targetPath || ".");
  if (path !== root && !path.startsWith(`${root}${sep}`)) {
    throw new Error(`reference escapes the repository: ${rawReference}`);
  }
  return { path, fragment: decode(rawFragment) };
}

const findings: string[] = [];
let referenceCount = 0;
const markdownPaths = trackedMarkdownFiles();

for (const sourceRelative of markdownPaths) {
  const source = resolve(root, sourceRelative);
  const markdown = await readFile(source, "utf8");
  const references = [
    ...markdown.matchAll(/!?\[[^\]]*]\((<[^>]+>|[^\s)]+)(?:\s+["'][^"']*["'])?\)/g),
  ];
  for (const match of references) {
    const rawReference = match[1] ?? "";
    referenceCount += 1;
    if (rawReference === "#") {
      findings.push(`${sourceRelative}: empty fragment link`);
      continue;
    }
    let target: MarkdownReference | null;
    try {
      target = localReference(source, rawReference);
    } catch (error) {
      findings.push(`${sourceRelative}: ${(error as Error).message}`);
      continue;
    }
    if (!target) continue;
    const metadata = await stat(target.path).catch(() => null);
    if (!metadata) {
      findings.push(`${sourceRelative}: missing ${repositoryPath(target.path)}`);
      continue;
    }
    if (target.fragment && metadata.isFile() && extname(target.path).toLowerCase() === ".md") {
      const targetMarkdown = await readFile(target.path, "utf8");
      if (!headingSlugs(targetMarkdown).has(githubSlug(target.fragment))) {
        findings.push(
          `${sourceRelative}: missing fragment #${target.fragment} in ${repositoryPath(target.path)}`,
        );
      }
    }
  }
}

if (findings.length > 0) {
  throw new Error(`Documentation link validation failed:\n${findings.join("\n")}`);
}

process.stdout.write(
  `Validated ${referenceCount} Markdown links across ${markdownPaths.length} tracked documents.\n`,
);
