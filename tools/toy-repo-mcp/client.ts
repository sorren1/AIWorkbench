import { resolve } from "node:path";

import Ajv from "ajv";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import {
  getDefaultEnvironment,
  StdioClientTransport,
} from "@modelcontextprotocol/sdk/client/stdio.js";

import { hasValidContentHash } from "../../src/demo/control-plane/registry/canonical";
import type { StageId } from "../../src/demo/data/types";
import { registrySnapshot } from "../../src/demo/control-plane/registry/generated";
import { resolveStageExecutionManifest } from "../../src/demo/control-plane/registry/lifecycle";
import { validateToolDescriptor } from "../../src/demo/control-plane/registry/validation";

const projectRoot = resolve(import.meta.dirname, "../..");
const serverPath = resolve(import.meta.dirname, "server.ts");
const schemaCompiler = new Ajv({ allErrors: true, strict: false });

export type DiscoveredTool = {
  readonly name: string;
  readonly title?: string;
  readonly description?: string;
  readonly inputSchema: Record<string, unknown>;
  readonly outputSchema?: Record<string, unknown>;
  readonly annotations?: Record<string, unknown>;
};

export type SanitizedDiscoveredTool = {
  readonly name: string;
  readonly title: string;
  readonly description: string;
  readonly inputSchema: Record<string, unknown>;
  readonly outputSchema: Record<string, unknown> | null;
  readonly annotations: {
    readonly readOnlyHint: boolean | null;
    readonly destructiveHint: boolean | null;
    readonly idempotentHint: boolean | null;
    readonly openWorldHint: boolean | null;
  };
};

export type InvocationPolicyEvidence = {
  readonly toolId: string;
  readonly registryVersion: string;
  readonly registryContentHash: string;
  readonly stageId: Exclude<StageId, "seed">;
  readonly decision: "ALLOW";
  readonly reasonCode: "APPROVED_TOOL_IN_APPROVED_STAGE_MANIFEST";
  readonly approvalPolicyId: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nullableBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function validateDiscoveredToolSchemas(tools: readonly DiscoveredTool[]): void {
  for (const tool of tools) {
    try {
      schemaCompiler.compile(tool.inputSchema);
      if (tool.outputSchema) schemaCompiler.compile(tool.outputSchema);
    } catch (error) {
      const message = error instanceof Error ? error.message : "unknown schema error";
      throw new Error(`Malformed discovered schema for ${tool.name}: ${message}`, {
        cause: error,
      });
    }
  }
}

export function sanitizeDiscovery(
  tools: readonly DiscoveredTool[],
): readonly SanitizedDiscoveredTool[] {
  return tools
    .map((tool) => ({
      name: tool.name,
      title: tool.title ?? tool.name,
      description: tool.description ?? "No protocol description supplied.",
      inputSchema: tool.inputSchema,
      outputSchema: tool.outputSchema ?? null,
      annotations: {
        readOnlyHint: nullableBoolean(tool.annotations?.readOnlyHint),
        destructiveHint: nullableBoolean(tool.annotations?.destructiveHint),
        idempotentHint: nullableBoolean(tool.annotations?.idempotentHint),
        openWorldHint: nullableBoolean(tool.annotations?.openWorldHint),
      },
    }))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function pathAllowed(requestedPath: string, patterns: readonly string[]): boolean {
  const normalized = requestedPath.replaceAll("\\", "/");
  return patterns.some((pattern) =>
    pattern.endsWith("/**") ? normalized.startsWith(pattern.slice(0, -2)) : normalized === pattern,
  );
}

export type ToyMcpSession = {
  readonly pid: number;
  readonly discoveredTools: readonly DiscoveredTool[];
  callApprovedTool: (
    toolId: string,
    args: Record<string, unknown>,
  ) => Promise<{
    readonly payload: Record<string, unknown>;
    readonly evidence: InvocationPolicyEvidence;
  }>;
  close: () => Promise<void>;
};

export async function startToyMcpSession(options: {
  readonly toyRepositoryRoot: string;
  readonly stageId: Exclude<StageId, "seed">;
  readonly approvedToolIds: readonly string[];
  readonly grantedApprovalPolicyIds: readonly string[];
}): Promise<ToyMcpSession> {
  const manifestDecision = await resolveStageExecutionManifest(
    registrySnapshot,
    options.stageId,
    options.approvedToolIds,
    "2026-07-16T20:00:00.000Z",
  );
  if (!manifestDecision.allowed) {
    throw new Error(
      `MCP process denied: ${manifestDecision.reasonCode} (${manifestDecision.detail})`,
    );
  }

  const writeDescriptor = registrySnapshot.tools.find(
    (tool) => tool.id === "tool.repository.patch.controlled",
  );
  const writeEnabled =
    options.approvedToolIds.includes("tool.repository.patch.controlled") &&
    writeDescriptor?.approvalPolicyId !== null &&
    writeDescriptor?.approvalPolicyId !== undefined &&
    options.grantedApprovalPolicyIds.includes(writeDescriptor.approvalPolicyId);

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ["--import", "tsx", serverPath],
    cwd: projectRoot,
    stderr: "pipe",
    env: {
      ...getDefaultEnvironment(),
      WB_TOY_REPO_ROOT: options.toyRepositoryRoot,
      WB_TOY_REPO_WRITE_ENABLED: writeEnabled ? "true" : "false",
    },
  });
  const client = new Client({
    name: "ai-delivery-workbench-local-control-plane",
    version: "1.0.0",
  });
  try {
    await client.connect(transport);
    const listing = await client.listTools();
    const discoveredTools: DiscoveredTool[] = listing.tools.map((tool) => ({
      name: tool.name,
      ...(tool.title ? { title: tool.title } : {}),
      ...(tool.description ? { description: tool.description } : {}),
      inputSchema: tool.inputSchema,
      ...(tool.outputSchema ? { outputSchema: tool.outputSchema } : {}),
      ...(tool.annotations ? { annotations: tool.annotations } : {}),
    }));
    validateDiscoveredToolSchemas(discoveredTools);
    const pid = transport.pid;
    if (pid === null) throw new Error("The MCP stdio transport did not expose a child process.");

    return {
      pid,
      discoveredTools,
      callApprovedTool: async (toolId, args) => {
        const discovered = discoveredTools.find((tool) => tool.name === toolId);
        if (!discovered) throw new Error(`MCP tool was not discovered: ${toolId}`);
        if (!options.approvedToolIds.includes(toolId)) {
          throw new Error(`Local policy denied unapproved discovered tool: ${toolId}`);
        }
        const descriptor = registrySnapshot.tools.find((tool) => tool.id === toolId);
        const descriptorValidation = validateToolDescriptor(descriptor);
        if (!descriptorValidation.valid) {
          throw new Error(`Local registry descriptor is absent or invalid: ${toolId}`);
        }
        const approvedDescriptor = descriptorValidation.value;
        if (
          approvedDescriptor.status !== "APPROVED" ||
          !(await hasValidContentHash(approvedDescriptor))
        ) {
          throw new Error(`Local registry descriptor is not executable: ${toolId}`);
        }
        if (!approvedDescriptor.allowedStages.includes(options.stageId)) {
          throw new Error(`Local policy denied ${toolId} for stage ${options.stageId}.`);
        }
        if (
          approvedDescriptor.approvalPolicyId &&
          !options.grantedApprovalPolicyIds.includes(approvedDescriptor.approvalPolicyId)
        ) {
          throw new Error(`Local policy requires approval ${approvedDescriptor.approvalPolicyId}.`);
        }
        const validateArguments = schemaCompiler.compile(approvedDescriptor.inputSchema);
        if (!validateArguments(args)) {
          throw new Error(`Local registry input schema denied arguments for ${toolId}.`);
        }
        if (
          typeof args.path === "string" &&
          approvedDescriptor.filesystemBoundary.allowedPaths.length > 0 &&
          !pathAllowed(args.path, approvedDescriptor.filesystemBoundary.allowedPaths)
        ) {
          throw new Error(`Local path policy denied ${args.path} for ${toolId}.`);
        }
        const response = await client.callTool({ name: toolId, arguments: args });
        if (response.isError || !isRecord(response.structuredContent)) {
          throw new Error(`MCP tool failed or returned no structured content: ${toolId}`);
        }
        return {
          payload: response.structuredContent,
          evidence: {
            toolId,
            registryVersion: approvedDescriptor.version,
            registryContentHash: approvedDescriptor.contentHash,
            stageId: options.stageId,
            decision: "ALLOW",
            reasonCode: "APPROVED_TOOL_IN_APPROVED_STAGE_MANIFEST",
            approvalPolicyId: approvedDescriptor.approvalPolicyId,
          },
        };
      },
      close: async () => {
        await client.close();
      },
    };
  } catch (error) {
    await client.close().catch(() => undefined);
    throw error;
  }
}
