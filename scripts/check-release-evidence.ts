import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

import { readSupplyChainSummary } from "../src/site/supplyChainEvidence";

const root = resolve(import.meta.dirname, "..");
const requireEvidence = process.argv.includes("--require");
const requireTag = process.argv.includes("--require-tag");

function git(args: readonly string[], allowedStatuses: readonly number[] = [0]): string {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
  });
  if (result.error) throw result.error;
  const status = result.status ?? 1;
  if (!allowedStatuses.includes(status)) {
    throw new Error(`git ${args[0] ?? "command"} failed with exit ${status}.`);
  }
  return result.stdout.trim();
}

const summary = await readSupplyChainSummary(root);
if (!summary) {
  if (requireEvidence || requireTag) {
    throw new Error("A checked-in public release summary is required.");
  }
  process.stdout.write(
    "Release candidate has no checked-in summary; hosted evidence must be added only in its direct child.\n",
  );
  process.exit(0);
}

const head = git(["rev-parse", "HEAD"]);
const parents = git(["show", "-s", "--format=%P", "HEAD"]).split(/\s+/u).filter(Boolean);
if (parents.length !== 1) {
  throw new Error("The evidence commit must have exactly one parent.");
}
const parent = parents[0];
if (!parent) throw new Error("The evidence commit parent could not be resolved.");
if (
  summary.release.auditedCommit !== parent ||
  summary.evidence.parentCommit !== parent ||
  summary.source.baseCommit !== parent
) {
  throw new Error("The checked-in summary does not reference the evidence commit's parent.");
}

const changedPaths = git(["diff-tree", "--no-commit-id", "--name-only", "-r", "HEAD"])
  .split(/\r?\n/u)
  .filter(Boolean);
if (changedPaths.length !== 1 || changedPaths[0] !== "public/security/release-summary.json") {
  throw new Error(
    `Evidence commit ${head} changes paths outside public/security/release-summary.json.`,
  );
}

const codeql = summary.controls.find((control) => control.id === "codeql");
if (
  codeql?.status !== "PASSED" ||
  codeql.findingCount !== 0 ||
  codeql.sourceCommit !== parent ||
  !codeql.evidenceUrl
) {
  throw new Error("Hosted CodeQL evidence is not successful and bound to the audited parent.");
}

const tagRef = `refs/tags/${summary.release.tag}`;
const tagLookup = spawnSync("git", ["show-ref", "--verify", "--quiet", tagRef], {
  cwd: root,
});
if (tagLookup.error) throw tagLookup.error;
if (tagLookup.status !== 0 && tagLookup.status !== 1) {
  throw new Error(`Unable to inspect release tag ${summary.release.tag}.`);
}
const tagExists = tagLookup.status === 0;
if (requireTag && !tagExists) {
  throw new Error(`Required annotated release tag ${summary.release.tag} does not exist.`);
}
if (tagExists) {
  if (git(["cat-file", "-t", tagRef]) !== "tag") {
    throw new Error(`${summary.release.tag} must be an annotated tag.`);
  }
  if (git(["rev-parse", `${tagRef}^{}`]) !== head) {
    throw new Error(`${summary.release.tag} must point to the evidence commit.`);
  }
  const ancestry = spawnSync("git", ["merge-base", "--is-ancestor", parent, `${tagRef}^{}`], {
    cwd: root,
  });
  if (ancestry.status !== 0) {
    throw new Error("The audited evidence parent is not reachable from the release tag.");
  }
}

process.stdout.write(
  `Release evidence policy passed: ${head} changes only the generated summary and references audited parent ${parent}; CodeQL recorded zero findings${tagExists ? `; ${summary.release.tag} is annotated and points to the evidence commit` : ""}.\n`,
);
