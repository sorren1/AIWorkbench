import { contentHashInput, hasValidContentHash, sha256Hex } from "./canonical";
import type {
  AgentCard,
  ApprovalMetadata,
  RegistryDecision,
  RegistryReference,
  RegistryResource,
  RegistrySnapshot,
  RegistryStatus,
  StageExecutionManifest,
  ToolDescriptor,
} from "./contracts";
import {
  validateAgentCard,
  validateMemoryPolicy,
  validateModelPolicy,
  validateToolDescriptor,
} from "./validation";
import type { StageId } from "../../data/types";

const TRANSITIONS: Readonly<Record<RegistryStatus, readonly RegistryStatus[]>> = {
  DRAFT: ["PENDING_APPROVAL"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: ["DEPRECATED"],
  REJECTED: ["DRAFT"],
  DEPRECATED: [],
};

export function canTransitionRegistryStatus(
  current: RegistryStatus,
  next: RegistryStatus,
): boolean {
  return TRANSITIONS[current].includes(next);
}

export function transitionRegistryResource(
  resource: RegistryResource,
  next: RegistryStatus,
  approval?: ApprovalMetadata,
): RegistryResource {
  if (!canTransitionRegistryStatus(resource.status, next)) {
    throw new Error(`Invalid registry transition: ${resource.status} -> ${next}`);
  }
  if (next === "APPROVED" && !approval) {
    throw new Error("Approval metadata is required for APPROVED resources.");
  }
  switch (resource.kind) {
    case "AgentCard": {
      if (next === "APPROVED" && approval) return { ...resource, status: next, approval };
      const { approval: _approval, ...withoutApproval } = resource;
      void _approval;
      return { ...withoutApproval, status: next };
    }
    case "ToolDescriptor": {
      if (next === "APPROVED" && approval) return { ...resource, status: next, approval };
      const { approval: _approval, ...withoutApproval } = resource;
      void _approval;
      return { ...withoutApproval, status: next };
    }
    case "ModelPolicy": {
      if (next === "APPROVED" && approval) return { ...resource, status: next, approval };
      const { approval: _approval, ...withoutApproval } = resource;
      void _approval;
      return { ...withoutApproval, status: next };
    }
    case "MemoryPolicy": {
      if (next === "APPROVED" && approval) return { ...resource, status: next, approval };
      const { approval: _approval, ...withoutApproval } = resource;
      void _approval;
      return { ...withoutApproval, status: next };
    }
  }
}

export async function reviseAgentCard(
  resource: AgentCard,
  changes: Partial<
    Pick<AgentCard, "version" | "description" | "allowedToolIds" | "allowedWritePaths">
  >,
  updatedAt: string,
): Promise<AgentCard> {
  const { approval: _approval, contentHash: _contentHash, ...source } = resource;
  void _approval;
  void _contentHash;
  const revisedSource = { ...source, ...changes, status: "DRAFT" as const, updatedAt };
  return { ...revisedSource, contentHash: await sha256Hex(contentHashInput(revisedSource)) };
}

function reference(resource: RegistryResource): RegistryReference {
  return { id: resource.id, version: resource.version, contentHash: resource.contentHash };
}

async function approvedAndValid(resource: RegistryResource): Promise<boolean> {
  if (resource.status !== "APPROVED") return false;
  return hasValidContentHash(resource);
}

function deny(
  reasonCode: Exclude<RegistryDecision, { allowed: true }>["reasonCode"],
  detail: string,
) {
  return { allowed: false as const, reasonCode, detail };
}

export async function resolveStageExecutionManifest(
  snapshot: RegistrySnapshot,
  stageId: Exclude<StageId, "seed">,
  requestedToolIds: readonly string[],
  resolvedAt: string,
): Promise<RegistryDecision> {
  const agent = snapshot.agents.find((candidate) => candidate.stageId === stageId);
  if (!agent) return deny("AGENT_NOT_FOUND", `No agent is registered for ${stageId}.`);
  if (!validateAgentCard(agent).valid) return deny("AGENT_SCHEMA_INVALID", agent.id);
  if (!(await hasValidContentHash(agent))) return deny("AGENT_HASH_INVALID", agent.id);
  if (agent.status !== "APPROVED") return deny("AGENT_NOT_APPROVED", agent.id);
  if (agent.stageId !== stageId) return deny("STAGE_MISMATCH", agent.id);

  const tools: ToolDescriptor[] = [];
  for (const toolId of requestedToolIds) {
    if (!agent.allowedToolIds.includes(toolId)) {
      return deny("TOOL_NOT_ALLOWED_FOR_AGENT", toolId);
    }
    const tool = snapshot.tools.find((candidate) => candidate.id === toolId);
    if (!tool) return deny("TOOL_NOT_FOUND", toolId);
    if (!validateToolDescriptor(tool).valid) return deny("TOOL_SCHEMA_INVALID", toolId);
    if (!(await hasValidContentHash(tool))) return deny("TOOL_HASH_INVALID", toolId);
    if (tool.status !== "APPROVED") return deny("TOOL_NOT_APPROVED", toolId);
    if (!tool.allowedStages.includes(stageId)) return deny("TOOL_NOT_ALLOWED_FOR_STAGE", toolId);
    tools.push(tool);
  }

  const model = snapshot.modelPolicies.find((policy) => policy.id === agent.modelPolicyId);
  if (!model || !validateModelPolicy(model).valid || !(await approvedAndValid(model))) {
    return deny("MODEL_POLICY_NOT_APPROVED", agent.modelPolicyId);
  }
  const memory = snapshot.memoryPolicies.find((policy) => policy.id === agent.memoryPolicyId);
  if (!memory || !validateMemoryPolicy(memory).valid || !(await approvedAndValid(memory))) {
    return deny("MEMORY_POLICY_NOT_APPROVED", agent.memoryPolicyId);
  }

  const manifest: StageExecutionManifest = {
    manifestVersion: 1,
    stageId,
    agent: reference(agent),
    tools: tools.map(reference),
    modelPolicy: reference(model),
    memoryPolicy: reference(memory),
    resolvedAt,
  };
  return { allowed: true, reasonCode: "APPROVED_MANIFEST_RESOLVED", manifest };
}

export async function isExecutionManifestCurrent(
  manifest: StageExecutionManifest,
  snapshot: RegistrySnapshot,
): Promise<boolean> {
  const resources = [
    ...snapshot.agents,
    ...snapshot.tools,
    ...snapshot.modelPolicies,
    ...snapshot.memoryPolicies,
  ];
  const refs = [manifest.agent, ...manifest.tools, manifest.modelPolicy, manifest.memoryPolicy];
  for (const ref of refs) {
    const current = resources.find((resource) => resource.id === ref.id);
    if (
      !current ||
      current.version !== ref.version ||
      current.contentHash !== ref.contentHash ||
      !(await approvedAndValid(current))
    ) {
      return false;
    }
  }
  return true;
}

export function registryContentForHash(resource: RegistryResource): unknown {
  return contentHashInput(resource);
}
