import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { validatePostDeploymentSummary } from "./contracts";

const root = resolve(import.meta.dirname, "../..");
const pathArgument = process.argv.slice(2).find((argument) => !argument.startsWith("--"));
const summaryPath = pathArgument
  ? resolve(root, pathArgument)
  : resolve(root, ".security-reports/post-deployment/post-deployment-summary.json");
const requireHosted = process.argv.includes("--require-hosted");

const input = JSON.parse(await readFile(summaryPath, "utf8")) as unknown;
const summary = validatePostDeploymentSummary(input, { requireHosted });
process.stdout.write(
  `Post-deployment summary ${summary.overall}: ${summary.releaseTag} ${summary.deployedCommit} at ${summary.canonicalOrigin}; workflow ${summary.workflow.runId}.\n`,
);
