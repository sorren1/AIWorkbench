import { access } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import { startToyMcpSession, validateDiscoveredToolSchemas } from "../tools/toy-repo-mcp/client";
import { createDisposableToyRepository, isProcessRunning } from "../tools/toy-repo-mcp/workspace";

const READ_TOOLS = ["tool.repository.search", "tool.repository.file.read"] as const;

describe("repository-owned local MCP slice", () => {
  it("discovers schemas through stdio and invokes approved read tools", async () => {
    const disposable = await createDisposableToyRepository();
    const session = await startToyMcpSession({
      toyRepositoryRoot: disposable.root,
      stageId: "implement",
      approvedToolIds: READ_TOOLS,
      grantedApprovalPolicyIds: [],
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
      grantedApprovalPolicyIds: [],
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
    const session = await startToyMcpSession({
      toyRepositoryRoot: disposable.root,
      stageId: "implement",
      approvedToolIds: [
        "tool.repository.file.read",
        "tool.repository.patch.controlled",
        "tool.repository.diff.inspect",
        "tool.sandbox.command",
      ],
      grantedApprovalPolicyIds: [
        "policy.tool.bounded-write-human-approval",
        "policy.tool.local-process-approval",
      ],
    });
    try {
      const patch = await session.callApprovedTool("tool.repository.patch.controlled", {
        path: "src/report.js",
        expected: "return `Variance: ${actual - budget}`;",
        replacement: "return `Variance: ${actual - budget}`; // approved synthetic patch",
      });
      expect(patch.payload.changed).toBe(true);
      const diff = await session.callApprovedTool("tool.repository.diff.inspect", {});
      expect(diff.payload.changedPaths).toEqual(["src/report.js"]);
      const validation = await session.callApprovedTool("tool.sandbox.command", {
        command: "validate",
      });
      expect(validation.payload.exitCode).toBe(0);
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
      grantedApprovalPolicyIds: [],
    });
    const pid = session.pid;
    expect(isProcessRunning(pid)).toBe(true);
    await session.close();
    expect(isProcessRunning(pid)).toBe(false);
    await disposable.cleanup();
    await expect(access(root)).rejects.toThrow();
  });
});
