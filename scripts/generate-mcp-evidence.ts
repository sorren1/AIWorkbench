import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { format, resolveConfig } from "prettier";

import { registrySnapshot } from "../src/demo/control-plane/registry/generated";
import { sanitizeDiscovery, startToyMcpSession } from "../tools/toy-repo-mcp/client";
import { createDisposableToyRepository } from "../tools/toy-repo-mcp/workspace";

const root = resolve(import.meta.dirname, "..");
const checkOnly = process.argv.includes("--check");
const prettierConfig = (await resolveConfig(resolve(root, "package.json"))) ?? {};

async function jsonFile(value: unknown): Promise<string> {
  return format(JSON.stringify(value), { ...prettierConfig, parser: "json" });
}
const disposable = await createDisposableToyRepository();

try {
  const approvedToolIds = [
    "tool.repository.search",
    "tool.repository.file.read",
    "tool.repository.patch.controlled",
    "tool.sandbox.command",
    "tool.repository.diff.inspect",
  ] as const;
  const session = await startToyMcpSession({
    toyRepositoryRoot: disposable.root,
    stageId: "implement",
    approvedToolIds,
    grantedApprovalPolicyIds: [
      "policy.tool.bounded-write-human-approval",
      "policy.tool.local-process-approval",
    ],
  });

  try {
    const invocations = [];
    const search = await session.callApprovedTool("tool.repository.search", {
      query: "formatVariance",
    });
    invocations.push({
      ...search.evidence,
      sanitizedResult: {
        matchCount: Array.isArray(search.payload.matches) ? search.payload.matches.length : 0,
      },
    });
    const read = await session.callApprovedTool("tool.repository.file.read", {
      path: "src/report.js",
    });
    invocations.push({
      ...read.evidence,
      sanitizedResult: { path: read.payload.path, contentIncluded: false },
    });
    const patch = await session.callApprovedTool("tool.repository.patch.controlled", {
      path: "src/report.js",
      expected: "return `Variance: ${actual - budget}`;",
      replacement: "return `Variance: ${actual - budget}`; // controlled synthetic patch",
    });
    invocations.push({
      ...patch.evidence,
      sanitizedResult: { path: patch.payload.path, changed: patch.payload.changed },
    });
    const diff = await session.callApprovedTool("tool.repository.diff.inspect", {});
    invocations.push({
      ...diff.evidence,
      sanitizedResult: {
        changedPaths: diff.payload.changedPaths,
        diffBodyIncluded: false,
      },
    });
    const validation = await session.callApprovedTool("tool.sandbox.command", {
      command: "validate",
    });
    invocations.push({
      ...validation.evidence,
      sanitizedResult: { exitCode: validation.payload.exitCode, outputIncluded: false },
    });

    const discovery = {
      schemaVersion: 1,
      classification: "SYNTHETIC_PUBLIC_LOCAL_MCP_EVIDENCE",
      protocol: "Model Context Protocol",
      sdk: { package: "@modelcontextprotocol/sdk", version: "1.29.0" },
      transport: "stdio",
      server: { name: "ai-delivery-workbench-toy-repository", version: "1.0.0" },
      boundary:
        "Functional local discovery against a disposable synthetic toy repository; the public browser never starts or connects to this process.",
      tools: sanitizeDiscovery(session.discoveredTools),
    };
    const evidence = {
      schemaVersion: 1,
      classification: "SYNTHETIC_PUBLIC_LOCAL_MCP_EVIDENCE",
      executionMode: "FUNCTIONAL_LOCAL_STDIO",
      externalNetworkCalls: 0,
      temporaryRepository: true,
      registrySnapshot: {
        generatedAt: registrySnapshot.generatedAt,
        classification: registrySnapshot.classification,
      },
      invocations,
      disclosure:
        "This evidence proves one bounded local MCP slice. External enterprise MCP integrations remain simulated; this is not a production-readiness claim.",
    };
    const outputs = new Map([
      ["public/capabilities/mcp/discovery.json", await jsonFile(discovery)],
      ["public/capabilities/mcp/invocation-evidence.json", await jsonFile(evidence)],
    ]);
    let different = false;
    for (const [relativePath, contents] of outputs) {
      const path = resolve(root, relativePath);
      if (checkOnly) {
        const current = await readFile(path, "utf8").catch(() => "");
        if (current !== contents) {
          different = true;
          process.stderr.write(`Generated MCP evidence is stale: ${relativePath}\n`);
        }
      } else {
        await mkdir(dirname(path), { recursive: true });
        await writeFile(path, contents, "utf8");
      }
    }
    if (different) process.exitCode = 1;
  } finally {
    await session.close();
  }
} finally {
  await disposable.cleanup();
}
