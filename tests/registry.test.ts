import { describe, expect, it } from "vitest";

import {
  approvalPolicyHashInput,
  hasValidContentHash,
  sha256Hex,
} from "../src/demo/control-plane/registry/canonical";
import type { AgentCard, RegistrySnapshot } from "../src/demo/control-plane/registry/contracts";
import { registrySnapshot } from "../src/demo/control-plane/registry/generated";
import {
  canTransitionRegistryStatus,
  isExecutionManifestCurrent,
  resolveStageExecutionManifest,
  reviseAgentCard,
  transitionRegistryResource,
} from "../src/demo/control-plane/registry/lifecycle";
import {
  validateAgentCard,
  validateApprovalPolicy,
  validateMemoryPolicy,
  validateModelPolicy,
  validateToolDescriptor,
} from "../src/demo/control-plane/registry/validation";

const APPROVAL = {
  approvedBy: "Synthetic independent reviewer",
  approvedAt: "2026-07-16T21:00:00.000Z",
  approvalPolicyId: "policy.registry.separation-of-duties",
  decisionRecordId: "decision.synthetic.test-approval",
} as const;

describe("versioned agent and tool registry", () => {
  it("validates every generated record through its JSON Schema", () => {
    expect(registrySnapshot.agents.every((resource) => validateAgentCard(resource).valid)).toBe(
      true,
    );
    expect(registrySnapshot.tools.every((resource) => validateToolDescriptor(resource).valid)).toBe(
      true,
    );
    expect(
      registrySnapshot.modelPolicies.every((resource) => validateModelPolicy(resource).valid),
    ).toBe(true);
    expect(
      registrySnapshot.memoryPolicies.every((resource) => validateMemoryPolicy(resource).valid),
    ).toBe(true);
    expect(
      registrySnapshot.approvalPolicies.every((resource) => validateApprovalPolicy(resource).valid),
    ).toBe(true);

    const malformed = { ...registrySnapshot.agents[0], maxToolCalls: -1 };
    const validation = validateAgentCard(malformed);
    expect(validation.valid).toBe(false);

    const malformedPolicy = { ...registrySnapshot.approvalPolicies[0], mode: "BYPASS" };
    expect(validateApprovalPolicy(malformedPolicy).valid).toBe(false);
  });

  it("verifies SHA-256 content hashes for every record", async () => {
    const resources = [
      ...registrySnapshot.agents,
      ...registrySnapshot.tools,
      ...registrySnapshot.modelPolicies,
      ...registrySnapshot.memoryPolicies,
    ];
    await expect(Promise.all(resources.map(hasValidContentHash))).resolves.toEqual(
      resources.map(() => true),
    );
    await expect(
      Promise.all(
        registrySnapshot.approvalPolicies.map(
          async (policy) =>
            (await sha256Hex(approvalPolicyHashInput(policy))) === policy.contentHash,
        ),
      ),
    ).resolves.toEqual(registrySnapshot.approvalPolicies.map(() => true));
    const agent = registrySnapshot.agents[0];
    expect(agent).toBeDefined();
    if (!agent) return;
    await expect(
      hasValidContentHash({ ...agent, description: `${agent.description} tampered` }),
    ).resolves.toBe(false);
  });

  it("enforces lifecycle transitions and approval metadata", async () => {
    const approved = registrySnapshot.agents[0];
    expect(approved).toBeDefined();
    if (!approved) return;
    const { approval: _approval, ...draftSource } = approved;
    void _approval;
    const draft: AgentCard = { ...draftSource, status: "DRAFT" };
    expect(canTransitionRegistryStatus("DRAFT", "PENDING_APPROVAL")).toBe(true);
    const pending = transitionRegistryResource(draft, "PENDING_APPROVAL");
    expect(() => transitionRegistryResource(pending, "APPROVED")).toThrow(
      "Approval metadata is required",
    );
    const republished = transitionRegistryResource(pending, "APPROVED", APPROVAL);
    expect(republished.status).toBe("APPROVED");
    await expect(hasValidContentHash(republished)).resolves.toBe(true);
    const deprecated = transitionRegistryResource(republished, "DEPRECATED");
    expect(deprecated.status).toBe("DEPRECATED");
    expect(() => transitionRegistryResource(deprecated, "APPROVED", APPROVAL)).toThrow(
      "Invalid registry transition",
    );
  });

  it("selects only schema-valid, hash-valid, approved resources for a stage", async () => {
    const decision = await resolveStageExecutionManifest(
      registrySnapshot,
      "implement",
      ["tool.repository.file.read", "tool.repository.diff.inspect"],
      "2026-07-16T21:00:00.000Z",
    );
    expect(decision.allowed).toBe(true);
    if (!decision.allowed) return;
    expect(decision.manifest.agent.id).toBe("agent.implementation");
    expect(decision.manifest.tools).toHaveLength(2);

    const blockedTool = registrySnapshot.tools.find(
      (tool) => tool.id === "tool.repository.diff.inspect",
    );
    expect(blockedTool).toBeDefined();
    if (!blockedTool) return;
    const blockedSnapshot: RegistrySnapshot = {
      ...registrySnapshot,
      tools: registrySnapshot.tools.map((tool) =>
        tool.id === blockedTool.id ? { ...tool, status: "DEPRECATED" } : tool,
      ),
    };
    const blocked = await resolveStageExecutionManifest(
      blockedSnapshot,
      "implement",
      [blockedTool.id],
      "2026-07-16T21:00:00.000Z",
    );
    expect(blocked).toMatchObject({ allowed: false, reasonCode: "TOOL_NOT_APPROVED" });
  });

  it("returns a revised version to draft and invalidates the dependent manifest", async () => {
    const decision = await resolveStageExecutionManifest(
      registrySnapshot,
      "spec",
      ["tool.issue.read"],
      "2026-07-16T21:00:00.000Z",
    );
    expect(decision.allowed).toBe(true);
    if (!decision.allowed) return;
    const currentAgent = registrySnapshot.agents.find(
      (agent) => agent.id === decision.manifest.agent.id,
    );
    expect(currentAgent).toBeDefined();
    if (!currentAgent) return;
    const revised = await reviseAgentCard(
      currentAgent,
      { version: "1.1.0", description: "Revised synthetic specification behavior." },
      "2026-07-16T22:00:00.000Z",
    );
    expect(revised.status).toBe("DRAFT");
    expect(revised.approval).toBeUndefined();
    expect(revised.contentHash).not.toBe(currentAgent.contentHash);

    const revisedSnapshot: RegistrySnapshot = {
      ...registrySnapshot,
      agents: registrySnapshot.agents.map((agent) => (agent.id === revised.id ? revised : agent)),
    };
    await expect(isExecutionManifestCurrent(decision.manifest, revisedSnapshot)).resolves.toBe(
      false,
    );
    const rerun = await resolveStageExecutionManifest(
      revisedSnapshot,
      "spec",
      ["tool.issue.read"],
      "2026-07-16T22:00:00.000Z",
    );
    expect(rerun).toMatchObject({ allowed: false, reasonCode: "AGENT_NOT_APPROVED" });
  });

  it("keeps the review assistant structurally unable to grant human approval", () => {
    const review = registrySnapshot.agents.find((agent) => agent.id === "agent.review-assistant");
    expect(review?.description).toContain("cannot grant");
    expect(review?.capabilities).not.toContain("human approval");
    expect(review?.allowedToolIds).not.toContain("tool.repository.patch.controlled");
  });
});
