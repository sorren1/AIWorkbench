import { execFile } from "node:child_process";
import { resolve } from "node:path";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

import { registrySnapshot } from "../src/demo/control-plane/registry/generated";
import { LiteLlmModelGateway } from "../tools/model-gateway/liteLlmGateway";
import { runModelGateway } from "../tools/model-gateway/runner";

const enabled =
  process.env.MODEL_GATEWAY_LIVE_TEST === "1" &&
  Boolean(process.env.LITELLM_MASTER_KEY_FILE || process.env.LITELLM_MASTER_KEY) &&
  Boolean(process.env.MODEL_GATEWAY_BASE_URL);

describe.skipIf(!enabled)("LiteLLM opt-in live integration", () => {
  it("vends a scoped key, invokes an allowed alias, and verifies cleanup", async () => {
    const root = resolve(import.meta.dirname, "..");
    const policy = registrySnapshot.modelPolicies.find(
      (candidate) => candidate.id === "model.policy.local-gateway-opt-in",
    );
    const agent = registrySnapshot.agents.find(
      (candidate) => candidate.id === "agent.implementation",
    );
    if (!policy || !agent) throw new Error("Live gateway fixtures are missing.");
    const git = await promisify(execFile)("git", ["rev-parse", "HEAD"], {
      cwd: root,
      windowsHide: true,
    });
    const gateway = LiteLlmModelGateway.fromEnvironment(root);
    const result = await runModelGateway({
      gateway,
      profile: "live",
      policy,
      agent,
      runId: `live-test-${Date.now()}`,
      sourceCommit: git.stdout.trim(),
    });
    expect(result.evidence?.validationLabel).toBe("validated local gateway integration");
    expect(result.credentialRevoked).toBe(true);
    expect((await gateway.cleanupInterruptedRuns()).failed).toBe(0);
  });
});
