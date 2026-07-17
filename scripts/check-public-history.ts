import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const intendedEmail = "89358652+sorren1@users.noreply.github.com";

// Assemble the retired organization token without storing the searchable value in this graph.
const retiredOrganizationToken = String.fromCharCode(
  105,
  110,
  115,
  105,
  103,
  104,
  116,
  115,
  111,
  102,
  116,
  119,
  97,
  114,
  101,
);

function git(args: readonly string[], allowedStatuses: readonly number[] = [0]): string {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  const status = result.status ?? 1;
  if (!allowedStatuses.includes(status)) {
    throw new Error(`git ${args[0] ?? "command"} failed with exit ${status}.`);
  }
  return result.stdout;
}

function nonemptyLines(value: string): readonly string[] {
  return value.split(/\r?\n/u).filter(Boolean);
}

const failures: string[] = [];
const reachableCommits = new Set(nonemptyLines(git(["rev-list", "--all"])));

for (const line of nonemptyLines(git(["log", "--all", "--format=%H|%ae|%ce"]))) {
  const [commit, authorEmail, committerEmail] = line.split("|");
  if (authorEmail !== intendedEmail || committerEmail !== intendedEmail) {
    failures.push(`${commit ?? "unknown commit"}: unexpected author or committer address`);
  }
}

const tagLines = nonemptyLines(
  git(["for-each-ref", "--format=%(refname)|%(objecttype)|%(taggeremail)", "refs/tags"]),
);
for (const line of tagLines) {
  const [ref, objectType, rawTaggerEmail] = line.split("|");
  const taggerEmail = rawTaggerEmail?.replace(/^<|>$/gu, "");
  if (objectType !== "tag") failures.push(`${ref ?? "unknown tag"}: tag is not annotated`);
  if (taggerEmail !== intendedEmail) {
    failures.push(`${ref ?? "unknown tag"}: unexpected tagger address`);
  }
}

const retiredLower = retiredOrganizationToken.toLocaleLowerCase();
const refMetadata = git([
  "for-each-ref",
  "--format=%(refname)%00%(contents)",
  "refs/heads",
  "refs/remotes",
  "refs/tags",
]);
if (refMetadata.toLocaleLowerCase().includes(retiredLower)) {
  failures.push("A ref name or annotated-tag message contains the retired organization token.");
}
const commitMessages = git(["log", "--all", "--format=%B%x00"]);
if (commitMessages.toLocaleLowerCase().includes(retiredLower)) {
  failures.push("A reachable commit message contains the retired organization token.");
}

for (const commit of reachableCommits) {
  const paths = git(["ls-tree", "-r", "--name-only", commit]);
  if (paths.toLocaleLowerCase().includes(retiredLower)) {
    failures.push(`${commit}: a reachable path contains the retired organization token`);
  }
  const grepResult = spawnSync(
    "git",
    ["grep", "-I", "-i", "-l", "-F", retiredOrganizationToken, commit, "--"],
    { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  if (grepResult.error) throw grepResult.error;
  if (grepResult.status === 0) {
    const matchedPaths = nonemptyLines(grepResult.stdout)
      .map((entry) => entry.slice(entry.indexOf(":") + 1))
      .join(", ");
    failures.push(`${commit}: retired organization token in ${matchedPaths}`);
  } else if (grepResult.status !== 1) {
    throw new Error(`git grep failed for ${commit} with exit ${grepResult.status ?? "unknown"}.`);
  }
}

const provenancePatterns = [
  /sourceCommit(?:\\?["'])?\s*:\s*\\?["']([a-f0-9]{40})/gu,
  /baseCommit(?:\\?["'])?\s*:\s*\\?["']([a-f0-9]{40})/gu,
  /delivery\.source\.commit(?:\\?["'])?\s*:\s*\\?["']([a-f0-9]{40})/gu,
  /^- Source commit:\s*`?([a-f0-9]{40})/gimu,
  /^- source commit\s*`([a-f0-9]{40})/gimu,
  /^- Release baseline:.*?`([a-f0-9]{40})/gimu,
  /^- Deployment configuration commit:\s*`([a-f0-9]{40})/gimu,
  /^- Audited base commit:\s*`([a-f0-9]{40})/gimu,
  /resolves to commit\s*`([a-f0-9]{40})/gimu,
] as const;
const provenanceReferences = new Map<string, Set<string>>();
const trackedPaths = git(["ls-files", "-z", "--cached", "--others", "--exclude-standard"])
  .split("\0")
  .filter(Boolean);
for (const relativePath of trackedPaths) {
  const contents = await readFile(resolve(root, relativePath)).catch((error: unknown) => {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw error;
  });
  if (!contents) continue;
  if (contents.includes(0)) continue;
  const text = contents.toString("utf8");
  for (const pattern of provenancePatterns) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const commit = match[1];
      if (!commit) continue;
      const paths = provenanceReferences.get(commit) ?? new Set<string>();
      paths.add(relativePath.replaceAll("\\", "/"));
      provenanceReferences.set(commit, paths);
    }
  }
}

for (const [commit, paths] of provenanceReferences) {
  if (!reachableCommits.has(commit)) {
    failures.push(`Unreachable generated provenance commit ${commit} in ${[...paths].join(", ")}`);
  }
}

if (failures.length > 0) {
  throw new Error(`Public history policy failed:\n${failures.join("\n")}`);
}

process.stdout.write(
  `Public history policy passed for ${reachableCommits.size} commits, ${tagLines.length} annotated tags, and ${provenanceReferences.size} reachable provenance commits.\n`,
);
