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
import type { StageExecutionManifest } from "../../src/demo/control-plane/registry/contracts";
import {
  validateApprovalRequest,
  validateToolDescriptor,
} from "../../src/demo/control-plane/registry/validation";
import { authorizeRegistryAction } from "../../src/demo/authorization/authorizeAction";
import {
  proposedArgumentsHash,
  validateApprovalForResume,
} from "../../src/demo/authorization/approvalProtocol";
import type { ApprovalRequest, PersonaId } from "../../src/demo/authorization/contracts";
import { isPersonaId, personaById } from "../../src/demo/authorization/personas";
import { sha256Hex } from "../../src/demo/control-plane/registry/canonical";

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
  readonly reasonCode: "POLICY_ALLOW" | "POLICY_NOTIFY" | "BOUND_APPROVAL_CURRENT";
  readonly approvalPolicyId: string | null;
  readonly initiatingActor: PersonaId;
  readonly policyDecisionId: string;
  readonly contextPackDigest: string;
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
  readonly executionManifest: StageExecutionManifest;
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
  readonly authorization: {
    readonly personaId: PersonaId;
    readonly effectiveSubject: string;
    readonly runId: string;
    readonly sessionId: string;
    readonly now: string;
    readonly approvedChangeTargets: readonly string[];
    readonly contextPackDigest: string;
  };
  readonly approvalRequest?: ApprovalRequest;
}): Promise<ToyMcpSession> {
  const manifestDecision = await resolveStageExecutionManifest(
    registrySnapshot,
    options.stageId,
    options.approvedToolIds,
    options.authorization.contextPackDigest,
    "2026-07-16T20:00:00.000Z",
  );
  if (!manifestDecision.allowed) {
    throw new Error(
      `MCP process denied: ${manifestDecision.reasonCode} (${manifestDecision.detail})`,
    );
  }

  const writeEnabled =
    options.approvedToolIds.includes("tool.repository.patch.controlled") &&
    options.approvalRequest?.tool.id === "tool.repository.patch.controlled" &&
    options.approvalRequest.status === "APPROVED";

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
      executionManifest: manifestDecision.manifest,
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
        if (!isPersonaId(options.authorization.personaId))
          throw new Error("Local authorization persona is invalid.");
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
        const actionNow = options.authorization.now;
        const action = await authorizeRegistryAction({
          snapshot: registrySnapshot,
          persona: personaById(options.authorization.personaId),
          stageId: options.stageId,
          toolId,
          targetPaths: typeof args.path === "string" ? [args.path] : [],
          approvedChangeTargets: options.authorization.approvedChangeTargets,
          networkAccess: approvedDescriptor.networkRequired,
          evidenceFinalized: false,
          effectiveSubject: options.authorization.effectiveSubject,
          runId: options.authorization.runId,
          sessionId: options.authorization.sessionId,
          now: actionNow,
          expiresAt: new Date(Date.parse(actionNow) + 15 * 60 * 1000).toISOString(),
          decisionId: `decision.${options.authorization.runId}.${toolId.replaceAll(".", "-")}`,
        });
        let reasonCode: InvocationPolicyEvidence["reasonCode"];
        if (action.decision.mode === "REQUIRE_APPROVAL") {
          const approval = options.approvalRequest;
          const policy = action.decision.matchedPolicy;
          if (!approval || !policy) {
            throw new Error(`Local policy requires a bound approval for ${toolId}.`);
          }
          const approvalValidation = validateApprovalRequest(approval);
          if (!approvalValidation.valid) {
            throw new Error("Local approval request failed JSON Schema validation.");
          }
          const approver =
            approval.decisionActor && isPersonaId(approval.decisionActor)
              ? personaById(approval.decisionActor)
              : null;
          const resume = validateApprovalForResume({
            request: approval,
            binding: {
              proposedArgumentsHash: await proposedArgumentsHash(args),
              agent: action.request.identity.executingAgent,
              tool: {
                id: approvedDescriptor.id,
                version: approvedDescriptor.version,
                contentHash: approvedDescriptor.contentHash,
              },
              changeTargetDigest: await sha256Hex(options.authorization.approvedChangeTargets),
              contextPackDigest: options.authorization.contextPackDigest,
            },
            policy,
            approver,
            now: actionNow,
          });
          if (!resume.allowed) {
            throw new Error(
              `Local approval denied on resume: ${resume.reasonCode} (${resume.detail})`,
            );
          }
          reasonCode = resume.reasonCode;
        } else if (!action.decision.allowed) {
          throw new Error(
            `Local policy denied ${toolId}: ${action.decision.reasonCode} (${action.decision.explanation})`,
          );
        } else {
          reasonCode =
            action.decision.reasonCode === "POLICY_NOTIFY" ? "POLICY_NOTIFY" : "POLICY_ALLOW";
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
            reasonCode,
            approvalPolicyId: approvedDescriptor.approvalPolicyId,
            initiatingActor: options.authorization.personaId,
            policyDecisionId: action.decision.decisionId,
            contextPackDigest: options.authorization.contextPackDigest,
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
