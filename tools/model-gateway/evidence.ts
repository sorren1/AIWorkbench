import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { z } from "zod";

import { executionBudgetSchema } from "../local-sandbox/budgets";
import { sha256Bytes } from "../local-sandbox/security";
import { modelCatalogSnapshotSchema, MODEL_GATEWAY_VALIDATED_LABEL } from "./contracts";
import { gatewayTraceArtifactSchema } from "./telemetry";

const hashSchema = z.string().regex(/^[a-f0-9]{64}$/);

export const modelGatewayEvidenceSchema = z.object({
  schemaVersion: z.literal(1),
  classification: z.literal("LOCAL_SYNTHETIC_MODEL_GATEWAY_EVIDENCE"),
  validationLabel: z.literal(MODEL_GATEWAY_VALIDATED_LABEL),
  generatedAt: z.iso.datetime(),
  sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
  runId: z.string().min(1),
  issueId: z.literal("TOY-101"),
  gateway: z.object({
    kind: z.literal("LITELLM_LOCAL"),
    implementation: z.literal("LiteLLM"),
    implementationVersion: z.literal("1.92.0"),
    credentialAlias: z.string().min(1),
    credentialRevoked: z.literal(true),
  }),
  policy: z.object({
    id: z.string().min(1),
    version: z.string().min(1),
    contentHash: hashSchema,
    preferredModelId: z.string().min(1),
    fallbackOrder: z.array(z.string().min(1)),
    independentReview: z.object({ required: z.boolean(), exercised: z.boolean() }),
  }),
  catalog: modelCatalogSnapshotSchema,
  calls: z.array(
    z.object({
      attempt: z.number().int().positive(),
      providerId: z.string().min(1),
      requestedModelId: z.string().min(1),
      responseModelId: z.string().min(1),
      latencyMs: z.number().nonnegative(),
      inputTokens: z.number().int().nonnegative(),
      outputTokens: z.number().int().nonnegative(),
      tokenMeasurement: z.enum(["ACTUAL_PROVIDER_REPORTED", "ESTIMATED"]),
      costUsd: z.number().nonnegative(),
      costMeasurement: z.enum(["ACTUAL_PROVIDER_REPORTED", "ESTIMATED"]),
      pricingSource: z.object({
        id: z.string().min(1),
        version: z.string().min(1),
        effectiveAt: z.iso.datetime().nullable(),
      }),
      outputSha256: hashSchema,
      outputCharacterCount: z.number().int().nonnegative(),
      fallback: z.boolean(),
    }),
  ),
  budget: z.object({
    policy: executionBudgetSchema,
    result: z.object({
      outcome: z.enum(["WITHIN_BUDGET", "WARNING", "STOPPED"]),
      stopReason: z.string().nullable(),
    }),
  }),
  trace: z.object({ traceId: z.string().regex(/^[a-f0-9]{32}$/), artifactSha256: hashSchema }),
});

export type ModelGatewayEvidence = z.infer<typeof modelGatewayEvidenceSchema>;

export async function writeGatewayEvidence(input: {
  readonly root: string;
  readonly evidence: ModelGatewayEvidence;
  readonly trace: z.infer<typeof gatewayTraceArtifactSchema>;
}): Promise<{ readonly evidencePath: string; readonly tracePath: string }> {
  const base = resolve(input.root, "evidence/generated");
  const evidencePath = resolve(base, `model-gateway-${input.evidence.runId}.json`);
  const tracePath = resolve(base, `model-gateway-trace-${input.evidence.runId}.json`);
  await mkdir(dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, `${JSON.stringify(input.evidence, null, 2)}\n`, "utf8");
  await writeFile(tracePath, `${JSON.stringify(input.trace, null, 2)}\n`, "utf8");
  return { evidencePath, tracePath };
}

export async function validateGatewayEvidenceFile(path: string): Promise<ModelGatewayEvidence> {
  const raw = await readFile(path, "utf8");
  const evidence = modelGatewayEvidenceSchema.parse(JSON.parse(raw) as unknown);
  const tracePath = resolve(dirname(path), `model-gateway-trace-${evidence.runId}.json`);
  const traceRaw = await readFile(tracePath, "utf8");
  const trace = gatewayTraceArtifactSchema.parse(JSON.parse(traceRaw) as unknown);
  if (
    trace.traceId !== evidence.trace.traceId ||
    sha256Bytes(traceRaw) !== evidence.trace.artifactSha256
  ) {
    throw new Error("Gateway trace binding is invalid.");
  }
  return evidence;
}

export async function latestValidatedGatewayEvidence(
  root: string,
): Promise<ModelGatewayEvidence | null> {
  const base = resolve(root, "evidence/generated");
  const names = await readdir(base).catch(() => []);
  const candidates = names
    .filter((name) => /^model-gateway-(?!trace-).+\.json$/.test(name))
    .sort()
    .reverse();
  for (const name of candidates) {
    const path = resolve(base, name);
    try {
      return await validateGatewayEvidenceFile(path);
    } catch {
      // Ignore invalid candidates so they can never drive a public validation claim.
    }
  }
  return null;
}
