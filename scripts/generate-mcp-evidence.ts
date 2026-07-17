import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { format, resolveConfig } from "prettier";

import { registrySnapshot } from "../src/demo/control-plane/registry/generated";
import { authorizeRegistryAction } from "../src/demo/authorization/authorizeAction";
import {
  addApprovalRequest,
  createBoundApprovalRequest,
  decideApprovalRequest,
} from "../src/demo/authorization/approvalProtocol";
import { personaById } from "../src/demo/authorization/personas";
import { sha256Hex } from "../src/demo/control-plane/registry/canonical";
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
  const patchArguments = {
    path: "src/report.js",
    expected: "return `Variance: ${actual - budget}`;",
    replacement:
      'const difference = actual - budget;\n  const direction = difference >= 0 ? "over" : "under";\n  return `Variance: ${Math.abs(difference)} ${direction}`;',
  };
  const approvedChangeTargets = ["src/**"];
  const contextPackDigest = await sha256Hex({
    fixture: "toy-repository",
    classification: "SYNTHETIC_PUBLIC_FIXTURE",
  });
  const requestedAt = "2026-07-17T13:00:00.000Z";
  const action = await authorizeRegistryAction({
    snapshot: registrySnapshot,
    persona: personaById("synthetic-implementer"),
    stageId: "implement",
    toolId: "tool.repository.patch.controlled",
    targetPaths: [patchArguments.path],
    approvedChangeTargets,
    networkAccess: false,
    evidenceFinalized: false,
    effectiveSubject: "synthetic-toy-repository",
    runId: "run.generated.mcp-evidence",
    sessionId: "session.generated.mcp-evidence",
    now: requestedAt,
    expiresAt: "2026-07-17T13:15:00.000Z",
    decisionId: "decision.generated.mcp-evidence.patch",
  });
  const created = await createBoundApprovalRequest({
    requestId: "approval.generated.mcp-evidence.patch",
    identity: action.request.identity,
    decision: action.decision,
    tool: {
      id: action.request.tool.id,
      version: action.request.tool.version,
      contentHash: action.request.tool.contentHash,
    },
    stage: "implement",
    argumentsValue: patchArguments,
    targetPaths: [patchArguments.path],
    changeTargetDigest: await sha256Hex(approvedChangeTargets),
    contextPackDigest,
    requestedAt,
  });
  const pendingStore = addApprovalRequest({ version: 1, requests: {}, events: [] }, created);
  const policy = action.decision.matchedPolicy;
  if (!policy) throw new Error("Generated patch action did not resolve an approval policy.");
  const approvedStore = await decideApprovalRequest({
    store: pendingStore,
    requestId: created.request.requestId,
    status: "APPROVED",
    actor: personaById("synthetic-code-reviewer"),
    reason: "Synthetic fixture diff is limited to the declared change target.",
    decidedAt: "2026-07-17T13:00:05.000Z",
    policy,
  });
  const approvalRequest = approvedStore.requests[created.request.requestId];
  if (!approvalRequest) throw new Error("Generated approval state lost its request.");
  const session = await startToyMcpSession({
    toyRepositoryRoot: disposable.root,
    stageId: "implement",
    approvedToolIds,
    authorization: {
      personaId: "synthetic-implementer",
      effectiveSubject: "synthetic-toy-repository",
      runId: "run.generated.mcp-evidence",
      sessionId: "session.generated.mcp-evidence",
      now: "2026-07-17T13:00:06.000Z",
      approvedChangeTargets,
      contextPackDigest,
    },
    approvalRequest,
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
    const patch = await session.callApprovedTool(
      "tool.repository.patch.controlled",
      patchArguments,
    );
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
