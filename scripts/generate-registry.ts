import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { format, resolveConfig } from "prettier";

import {
  approvalPolicyHashInput,
  canonicalJson,
  contentHashInput,
} from "../src/demo/control-plane/registry/canonical";
import type {
  ApprovalPolicy,
  ApprovalPolicySource,
  RegistryResource,
  RegistryResourceSource,
  RegistrySnapshot,
} from "../src/demo/control-plane/registry/contracts";
import {
  agentCardSources,
  approvalPolicySources,
  memoryPolicySources,
  modelPolicySources,
  registryGeneratedAt,
  toolDescriptorSources,
} from "../src/demo/control-plane/registry/fixtures";
import {
  assertValidRegistryResource,
  validateApprovalPolicy,
  validateContextRecord,
} from "../src/demo/control-plane/registry/validation";
import { personaById } from "../src/demo/authorization/personas";
import type { ContextRecord, ContextRecordSource } from "../src/demo/context/contracts";
import { contextRecordSources } from "../src/demo/context/fixtures";
import {
  CONTEXT_TAGS_BY_STAGE,
  DEMO_CONTEXT_CREATED_AT,
  personaForContextStage,
} from "../src/demo/context/rules";
import { contextRecordHashInput, selectContextPack } from "../src/demo/context/selector";
import { stageDefs } from "../src/demo/data/fixtures";

const root = resolve(import.meta.dirname, "..");
const checkOnly = process.argv.includes("--check");
const prettierConfig = (await resolveConfig(resolve(root, "package.json"))) ?? {};

async function formatFile(contents: string, parser: "json" | "typescript"): Promise<string> {
  return format(contents, { ...prettierConfig, parser });
}

async function jsonFile(value: unknown): Promise<string> {
  return formatFile(JSON.stringify(value), "json");
}

function withHash(source: RegistryResourceSource): RegistryResource {
  const contentHash = createHash("sha256")
    .update(canonicalJson(contentHashInput(source)))
    .digest("hex");
  return assertValidRegistryResource({ ...source, contentHash });
}

function withPolicyHash(source: ApprovalPolicySource): ApprovalPolicy {
  const contentHash = createHash("sha256")
    .update(canonicalJson(approvalPolicyHashInput(source)))
    .digest("hex");
  const result = validateApprovalPolicy({ ...source, contentHash });
  if (!result.valid) {
    throw new Error(`Approval policy schema validation failed: ${result.errors.join("; ")}`);
  }
  return result.value;
}

function withContextHash(source: ContextRecordSource): ContextRecord {
  const contentHash = createHash("sha256")
    .update(canonicalJson(contextRecordHashInput(source)))
    .digest("hex");
  const result = validateContextRecord({ ...source, contentHash });
  if (!result.valid) {
    throw new Error(`Context record schema validation failed: ${result.errors.join("; ")}`);
  }
  return result.value;
}

const snapshot: RegistrySnapshot = {
  schemaVersion: 4,
  generatedAt: registryGeneratedAt,
  classification: "SYNTHETIC_PUBLIC_PORTFOLIO_FIXTURE",
  agents: agentCardSources.map(withHash).filter((item) => item.kind === "AgentCard"),
  tools: toolDescriptorSources.map(withHash).filter((item) => item.kind === "ToolDescriptor"),
  modelPolicies: modelPolicySources.map(withHash).filter((item) => item.kind === "ModelPolicy"),
  memoryPolicies: memoryPolicySources.map(withHash).filter((item) => item.kind === "MemoryPolicy"),
  approvalPolicies: approvalPolicySources.map(withPolicyHash),
};

const contextRecords = contextRecordSources.map(withContextHash);
const representativeCandidates = contextRecords.filter(
  (record) => !record.id.startsWith("context.issue.fin-") || record.id === "context.issue.fin-1150",
);
const representativePacks = await Promise.all(
  stageDefs.map(async ({ id: stageId }) => {
    const agent =
      stageId === "seed"
        ? null
        : (snapshot.agents.find((candidate) => candidate.stageId === stageId) ?? null);
    const memoryPolicyId = agent?.memoryPolicyId ?? "memory.policy.issue-bounded";
    const memoryPolicy = snapshot.memoryPolicies.find(
      (candidate) => candidate.id === memoryPolicyId,
    );
    if (!memoryPolicy) throw new Error(`Missing representative memory policy: ${memoryPolicyId}`);
    const persona = personaById(personaForContextStage(stageId));
    return selectContextPack({
      runId: "run.browser.fin-1150",
      stageId,
      agent,
      memoryPolicy,
      persona,
      candidates: representativeCandidates,
      requiredTags: CONTEXT_TAGS_BY_STAGE[stageId],
      createdAt: DEMO_CONTEXT_CREATED_AT,
    });
  }),
);

const schemaNames = [
  "common.schema.json",
  "agent-card.schema.json",
  "tool-descriptor.schema.json",
  "model-policy.schema.json",
  "memory-policy.schema.json",
  "context-record.schema.json",
  "context-pack.schema.json",
  "stage-input.schema.json",
  "stage-output.schema.json",
  "approval-policy.schema.json",
  "delegated-identity-envelope.schema.json",
  "approval-request.schema.json",
  "approval-event.schema.json",
  "approval-store.schema.json",
] as const;

const outputs = new Map<string, string>();
const generatedTypeScript = await formatFile(
  `/* Generated by npm run registry:generate. Do not edit directly. */\nimport type { RegistrySnapshot } from "./contracts";\n\nexport const registrySnapshot = ${JSON.stringify(snapshot, null, 2)} as const satisfies RegistrySnapshot;\n`,
  "typescript",
);
outputs.set("src/demo/control-plane/registry/generated.ts", generatedTypeScript);
outputs.set(
  "src/demo/context/generated.ts",
  await formatFile(
    `/* Generated by npm run registry:generate. Do not edit directly. */\nimport type { ContextRecord } from "./contracts";\n\nexport const contextRecords = ${JSON.stringify(contextRecords, null, 2)} as const satisfies readonly ContextRecord[];\n`,
    "typescript",
  ),
);
outputs.set("public/capabilities/registry.json", await jsonFile(snapshot));
outputs.set("public/capabilities/context/records.json", await jsonFile(contextRecords));
outputs.set("public/capabilities/context/packs.json", await jsonFile(representativePacks));
outputs.set(
  "public/capabilities/agents/index.json",
  await jsonFile({
    schemaVersion: 1,
    classification: snapshot.classification,
    cards: snapshot.agents.map((agent) => ({
      id: agent.id,
      version: agent.version,
      contentHash: agent.contentHash,
      href: `/capabilities/agents/${agent.id}.json`,
    })),
  }),
);
for (const agent of snapshot.agents) {
  outputs.set(`public/capabilities/agents/${agent.id}.json`, await jsonFile(agent));
}
outputs.set(
  "public/capabilities/policies/index.json",
  await jsonFile({
    schemaVersion: 1,
    classification: snapshot.classification,
    policies: snapshot.approvalPolicies.map((policy) => ({
      id: policy.id,
      version: policy.version,
      contentHash: policy.contentHash,
      href: `/capabilities/policies/${policy.id}.json`,
    })),
  }),
);
for (const policy of snapshot.approvalPolicies) {
  outputs.set(`public/capabilities/policies/${policy.id}.json`, await jsonFile(policy));
}
for (const schemaName of schemaNames) {
  const schema = await readFile(
    resolve(root, "src/demo/control-plane/registry/schemas", schemaName),
    "utf8",
  );
  outputs.set(`public/capabilities/schemas/${schemaName}`, await formatFile(schema, "json"));
}

let different = false;
for (const [relativePath, contents] of outputs) {
  const path = resolve(root, relativePath);
  if (checkOnly) {
    const current = await readFile(path, "utf8").catch(() => "");
    if (current !== contents) {
      different = true;
      process.stderr.write(`Generated registry artifact is stale: ${relativePath}\n`);
    }
  } else {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents, "utf8");
  }
}

if (different) process.exitCode = 1;
