import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, open } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const lintableExtension = /\.(?:[cm]?[jt]s|[jt]sx)$/iu;

function normalizedRepositoryPath(path: string): string {
  const normalized = path.replaceAll("\\", "/");
  if (
    normalized.length === 0 ||
    isAbsolute(normalized) ||
    normalized.split("/").some((segment) => segment === "..")
  ) {
    throw new Error(`Git returned an unsafe tracked path: ${path}`);
  }
  return normalized;
}

export async function trackedSourcePaths(root: string): Promise<string[]> {
  const { stdout } = await execFileAsync("git", ["ls-files", "--cached", "-z"], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  const candidates = [
    ...new Set(stdout.split("\0").filter(Boolean).map(normalizedRepositoryPath)),
  ].sort();
  const present: string[] = [];
  for (const path of candidates) {
    const metadata = await lstat(resolve(root, path)).catch((error: unknown) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    });
    if (!metadata) continue;
    if (!metadata.isFile()) {
      throw new Error(`Tracked-source inventory accepts only regular files: ${path}`);
    }
    present.push(path);
  }
  return present;
}

export function lintableTrackedSourcePaths(paths: readonly string[]): string[] {
  return paths.filter((path) => lintableExtension.test(path)).sort();
}

export async function trackedSourceDigest(
  root: string,
  paths: readonly string[],
  excludedPaths: ReadonlySet<string> = new Set(),
): Promise<string> {
  const hash = createHash("sha256");
  for (const path of paths) {
    if (excludedPaths.has(path)) continue;
    const handle = await open(resolve(root, path), "r");
    try {
      hash.update(path);
      hash.update("\0");
      hash.update(await handle.readFile());
      hash.update("\0");
    } finally {
      await handle.close();
    }
  }
  return hash.digest("hex");
}
