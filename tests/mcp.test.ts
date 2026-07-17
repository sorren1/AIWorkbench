import { access } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { startToyMcpSession, validateDiscoveredToolSchemas } from "../tools/toy-repo-mcp/client";
import { createDisposableToyRepository, isProcessRunning } from "../tools/toy-repo-mcp/workspace";
import { authorizeRegistryAction } from "../src/demo/authorization/authorizeAction";
import {
  addApprovalRequest,
  createBoundApprovalRequest,
  decideApprovalRequest,
} from "../src/demo/authorization/approvalProtocol";
import { personaById } from "../src/demo/authorization/personas";
import { sha256Hex } from "../src/demo/control-plane/registry/canonical";
import { registrySnapshot } from "../src/demo/control-plane/registry/generated";

const READ_TOOLS = ["tool.repository.search", "tool.repository.file.read"] as const;
const CONTEXT_DIGEST = "a".repeat(64);
const APPROVED_TARGETS = ["src/**"] as const;

function authorization(runId: string) {
  return {
    personaId: "synthetic-implementer" as const,
    effectiveSubject: "synthetic-toy-repository",
    runId,
    sessionId: `session.${runId}`,
    now: "2026-07-17T14:00:06.000Z",
    approvedChangeTargets: APPROVED_TARGETS,
    contextPackDigest: CONTEXT_DIGEST,
  };
}

async function approvedPatchRequest(argumentsValue: Record<string, unknown>) {
  const requestedAt = "2026-07-17T14:00:00.000Z";
  const action = await authorizeRegistryAction({
    snapshot: registrySnapshot,
    persona: personaById("synthetic-implementer"),
    stageId: "implement",
    toolId: "tool.repository.patch.controlled",
    targetPaths: ["src/report.js"],
    approvedChangeTargets: APPROVED_TARGETS,
    networkAccess: false,
    evidenceFinalized: false,
    effectiveSubject: "synthetic-toy-repository",
    runId: "run.test.mcp-patch",
    sessionId: "session.run.test.mcp-patch",
    now: requestedAt,
    expiresAt: "2026-07-17T14:15:00.000Z",
    decisionId: "decision.test.mcp-patch",
  });
  const created = await createBoundApprovalRequest({
    requestId: "approval.test.mcp-patch",
    identity: action.request.identity,
    decision: action.decision,
    tool: {
      id: action.request.tool.id,
      version: action.request.tool.version,
      contentHash: action.request.tool.contentHash,
    },
    stage: "implement",
    argumentsValue,
    targetPaths: ["src/report.js"],
    changeTargetDigest: await sha256Hex(APPROVED_TARGETS),
    contextPackDigest: CONTEXT_DIGEST,
    requestedAt,
  });
  const pending = addApprovalRequest({ version: 1, requests: {}, events: [] }, created);
  const policy = action.decision.matchedPolicy;
  if (!policy) throw new Error("Test patch policy missing.");
  const approved = await decideApprovalRequest({
    store: pending,
    requestId: created.request.requestId,
    status: "APPROVED",
    actor: personaById("synthetic-code-reviewer"),
    reason: "Synthetic test patch is bounded to the declared target.",
    decidedAt: "2026-07-17T14:00:05.000Z",
    policy,
  });
  const request = approved.requests[created.request.requestId];
  if (!request) throw new Error("Test approval missing.");
  return request;
}

describe("repository-owned local MCP slice", () => {
  it("discovers schemas through stdio and invokes approved read tools", async () => {
    const disposable = await createDisposableToyRepository();
    const session = await startToyMcpSession({
      toyRepositoryRoot: disposable.root,
      stageId: "implement",
      approvedToolIds: READ_TOOLS,
      authorization: authorization("run.test.discovery"),
    });
    try {
      expect(session.discoveredTools.map((tool) => tool.name).sort()).toEqual([
        "tool.repository.diff.inspect",
        "tool.repository.file.read",
        "tool.repository.patch.controlled",
        "tool.repository.search",
        "tool.sandbox.command",
      ]);
      expect(() => validateDiscoveredToolSchemas(session.discoveredTools)).not.toThrow();
      const search = await session.callApprovedTool("tool.repository.search", {
        query: "formatVariance",
      });
      expect(search.payload.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ path: "src/report.js" })]),
      );
    } finally {
      await session.close();
      await disposable.cleanup();
    }
  });

  it("rejects malformed discovered tool schemas", () => {
    expect(() =>
      validateDiscoveredToolSchemas([{ name: "malformed.synthetic", inputSchema: { type: 42 } }]),
    ).toThrow("Malformed discovered schema");
  });

  it("refuses a discovered tool that the local stage manifest did not approve", async () => {
    const disposable = await createDisposableToyRepository();
    const session = await startToyMcpSession({
      toyRepositoryRoot: disposable.root,
      stageId: "implement",
      approvedToolIds: READ_TOOLS,
      authorization: authorization("run.test.refusal"),
    });
    try {
      expect(
        session.discoveredTools.some((tool) => tool.name === "tool.repository.patch.controlled"),
      ).toBe(true);
      await expect(
        session.callApprovedTool("tool.repository.patch.controlled", {
          path: "src/report.js",
          expected: "Variance",
          replacement: "Changed",
        }),
      ).rejects.toThrow("Local policy denied unapproved discovered tool");
      await expect(
        session.callApprovedTool("tool.repository.file.read", { path: "../package.json" }),
      ).rejects.toThrow("Local path policy denied");
    } finally {
      await session.close();
      await disposable.cleanup();
    }
  });

  it("performs an approved bounded patch, diff, and fixed validation command", async () => {
    const disposable = await createDisposableToyRepository();
    const patchArguments = {
      path: "src/report.js",
      expected: "return `Variance: ${actual - budget}`;",
      replacement: "return `Variance: ${actual - budget}`; // approved synthetic patch",
    };
    const session = await startToyMcpSession({
      toyRepositoryRoot: disposable.root,
      stageId: "implement",
      approvedToolIds: [
        "tool.repository.file.read",
        "tool.repository.patch.controlled",
        "tool.repository.diff.inspect",
        "tool.sandbox.command",
      ],
      authorization: authorization("run.test.mcp-patch"),
      approvalRequest: await approvedPatchRequest(patchArguments),
    });
    try {
      const patch = await session.callApprovedTool(
        "tool.repository.patch.controlled",
        patchArguments,
      );
      expect(patch.payload.changed).toBe(true);
      const diff = await session.callApprovedTool("tool.repository.diff.inspect", {});
      expect(diff.payload.changedPaths).toEqual(["src/report.js"]);
      const validation = await session.callApprovedTool("tool.sandbox.command", {
        command: "validate",
      });
      expect(validation.payload.exitCode).toBe(0);
      expect(validation.evidence.reasonCode).toBe("POLICY_NOTIFY");
    } finally {
      await session.close();
      await disposable.cleanup();
    }
  });

  it("terminates the MCP child process and removes its disposable repository", async () => {
    const disposable = await createDisposableToyRepository();
    const root = disposable.root;
    const session = await startToyMcpSession({
      toyRepositoryRoot: root,
      stageId: "implement",
      approvedToolIds: READ_TOOLS,
      authorization: authorization("run.test.cleanup"),
    });
    const pid = session.pid;
    expect(isProcessRunning(pid)).toBe(true);
    await session.close();
    expect(isProcessRunning(pid)).toBe(false);
    await disposable.cleanup();
    await expect(access(root)).rejects.toThrow();
  });
});
