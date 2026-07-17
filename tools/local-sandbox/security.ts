import { createHash } from "node:crypto";
import { lstat, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import { isAbsolute, relative, resolve, sep } from "node:path";

export type RepositoryFileSnapshot = {
  readonly path: string;
  readonly sha256: string;
  readonly content: string;
};

export type ChangedFileEvidence = {
  readonly path: string;
  readonly beforeSha256: string;
  readonly afterSha256: string;
  readonly beforeContent: string;
  readonly afterContent: string;
};

export function sha256Bytes(value: string | Buffer): string {
  return createHash("sha256").update(value).digest("hex");
}

function portablePath(root: string, path: string): string {
  return relative(root, path).split(sep).join("/");
}

async function walk(root: string, current: string, files: string[]): Promise<void> {
  const entries = await readdir(current, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name));
  for (const entry of entries) {
    const path = resolve(current, entry.name);
    const portable = portablePath(root, path);
    if (portable === ".git" || portable.startsWith(".git/")) continue;
    const status = await lstat(path);
    if (status.isSymbolicLink()) {
      throw new Error(`Sandbox rejected symbolic link: ${portable}`);
    }
    if (status.isDirectory()) await walk(root, path, files);
    else if (status.isFile()) files.push(path);
    else throw new Error(`Sandbox rejected unsupported filesystem entry: ${portable}`);
  }
}

export async function assertNoSymlinks(root: string): Promise<void> {
  await walk(root, root, []);
}

export async function snapshotRepository(root: string): Promise<readonly RepositoryFileSnapshot[]> {
  const files: string[] = [];
  await walk(root, root, files);
  const snapshots = await Promise.all(
    files.map(async (path) => {
      const content = await readFile(path, "utf8");
      return { path: portablePath(root, path), sha256: sha256Bytes(content), content };
    }),
  );
  return snapshots.sort((left, right) => left.path.localeCompare(right.path));
}

function isWithin(root: string, candidate: string): boolean {
  const path = relative(root, candidate);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== ".." && !isAbsolute(path));
}

export async function resolveControlledPath(
  root: string,
  requestedPath: string,
  allowedPaths: readonly string[],
): Promise<string> {
  if (
    requestedPath.length === 0 ||
    requestedPath.includes("\\") ||
    requestedPath.startsWith("/") ||
    requestedPath.split("/").some((part) => part === "" || part === "." || part === "..")
  ) {
    throw new Error(`Sandbox rejected unsafe path: ${requestedPath}`);
  }
  if (!allowedPaths.includes(requestedPath)) {
    throw new Error(`Sandbox rejected path outside approved change targets: ${requestedPath}`);
  }
  const canonicalRoot = await realpath(root);
  const candidate = resolve(canonicalRoot, ...requestedPath.split("/"));
  if (!isWithin(canonicalRoot, candidate)) {
    throw new Error(`Sandbox rejected path traversal: ${requestedPath}`);
  }
  const parts = requestedPath.split("/");
  let cursor = canonicalRoot;
  for (const part of parts) {
    cursor = resolve(cursor, part);
    const status = await lstat(cursor);
    if (status.isSymbolicLink())
      throw new Error(`Sandbox rejected symbolic link: ${requestedPath}`);
  }
  const canonicalCandidate = await realpath(candidate);
  if (!isWithin(canonicalRoot, canonicalCandidate)) {
    throw new Error(`Sandbox rejected path escaping the workspace: ${requestedPath}`);
  }
  return canonicalCandidate;
}

export async function applyControlledReplacement(input: {
  readonly root: string;
  readonly path: string;
  readonly allowedPaths: readonly string[];
  readonly expected: string;
  readonly replacement: string;
}): Promise<void> {
  const target = await resolveControlledPath(input.root, input.path, input.allowedPaths);
  const content = await readFile(target, "utf8");
  const matches = content.split(input.expected).length - 1;
  if (matches !== 1) {
    throw new Error(
      `Controlled patch expected exactly one match in ${input.path}; found ${matches}.`,
    );
  }
  await writeFile(target, content.replace(input.expected, input.replacement), "utf8");
  await resolveControlledPath(input.root, input.path, input.allowedPaths);
}

export function changedFiles(
  before: readonly RepositoryFileSnapshot[],
  after: readonly RepositoryFileSnapshot[],
  allowedPaths: readonly string[],
): readonly ChangedFileEvidence[] {
  const beforeByPath = new Map(before.map((file) => [file.path, file]));
  const afterByPath = new Map(after.map((file) => [file.path, file]));
  const allPaths = [...new Set([...beforeByPath.keys(), ...afterByPath.keys()])].sort();
  const changes: ChangedFileEvidence[] = [];
  for (const path of allPaths) {
    const prior = beforeByPath.get(path);
    const next = afterByPath.get(path);
    if (prior?.sha256 === next?.sha256) continue;
    if (!prior || !next)
      throw new Error(`Sandbox rejected unexpected file creation/deletion: ${path}`);
    if (!allowedPaths.includes(path))
      throw new Error(`Sandbox rejected unexpected changed file: ${path}`);
    changes.push({
      path,
      beforeSha256: prior.sha256,
      afterSha256: next.sha256,
      beforeContent: prior.content,
      afterContent: next.content,
    });
  }
  if (changes.length !== 1) {
    throw new Error(
      `Sandbox expected exactly one controlled changed file; found ${changes.length}.`,
    );
  }
  return changes;
}
