import Ajv2020, { type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

import agentCardSchema from "./schemas/agent-card.schema.json";
import approvalPolicySchema from "./schemas/approval-policy.schema.json";
import approvalEventSchema from "./schemas/approval-event.schema.json";
import approvalRequestSchema from "./schemas/approval-request.schema.json";
import approvalStoreSchema from "./schemas/approval-store.schema.json";
import commonSchema from "./schemas/common.schema.json";
import contextPackSchema from "./schemas/context-pack.schema.json";
import contextRecordSchema from "./schemas/context-record.schema.json";
import delegatedIdentityEnvelopeSchema from "./schemas/delegated-identity-envelope.schema.json";
import memoryPolicySchema from "./schemas/memory-policy.schema.json";
import modelPolicySchema from "./schemas/model-policy.schema.json";
import stageInputSchema from "./schemas/stage-input.schema.json";
import stageOutputSchema from "./schemas/stage-output.schema.json";
import toolDescriptorSchema from "./schemas/tool-descriptor.schema.json";
import type {
  AgentCard,
  ApprovalPolicy,
  MemoryPolicy,
  ModelPolicy,
  RegistryResource,
  ToolDescriptor,
} from "./contracts";
import type { ApprovalEvent, ApprovalRequest, ApprovalStore } from "../../authorization/contracts";
import type { ContextPack, ContextRecord } from "../../context/contracts";

const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
ajv.addSchema(commonSchema);
ajv.addSchema(contextRecordSchema);
ajv.addSchema(stageInputSchema);
ajv.addSchema(stageOutputSchema);
ajv.addSchema(delegatedIdentityEnvelopeSchema);
ajv.addSchema(approvalRequestSchema);
ajv.addSchema(approvalEventSchema);

const approvalRequestValidator = ajv.getSchema<ApprovalRequest>(approvalRequestSchema.$id);
const approvalEventValidator = ajv.getSchema<ApprovalEvent>(approvalEventSchema.$id);
const contextRecordValidator = ajv.getSchema<ContextRecord>(contextRecordSchema.$id);
if (!approvalRequestValidator || !approvalEventValidator || !contextRecordValidator) {
  throw new Error("Approval protocol schemas failed to register.");
}

const validators = {
  AgentCard: ajv.compile<AgentCard>(agentCardSchema),
  ToolDescriptor: ajv.compile<ToolDescriptor>(toolDescriptorSchema),
  ModelPolicy: ajv.compile<ModelPolicy>(modelPolicySchema),
  MemoryPolicy: ajv.compile<MemoryPolicy>(memoryPolicySchema),
  ApprovalPolicy: ajv.compile<ApprovalPolicy>(approvalPolicySchema),
  ApprovalRequest: approvalRequestValidator,
  ApprovalEvent: approvalEventValidator,
  ApprovalStore: ajv.compile<ApprovalStore>(approvalStoreSchema),
  ContextRecord: contextRecordValidator,
  ContextPack: ajv.compile<ContextPack>(contextPackSchema),
};

export type SchemaValidationResult<T> =
  | { readonly valid: true; readonly value: T }
  | { readonly valid: false; readonly errors: readonly string[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeErrors(errors: ErrorObject[] | null | undefined): readonly string[] {
  return (errors ?? []).map(
    (error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`,
  );
}

function validateWith<T>(
  validator: ValidateFunction<T>,
  value: unknown,
): SchemaValidationResult<T> {
  if (validator(value)) return { valid: true, value };
  return { valid: false, errors: normalizeErrors(validator.errors) };
}

export function validateAgentCard(value: unknown): SchemaValidationResult<AgentCard> {
  return validateWith(validators.AgentCard, value);
}

export function validateToolDescriptor(value: unknown): SchemaValidationResult<ToolDescriptor> {
  return validateWith(validators.ToolDescriptor, value);
}

export function validateModelPolicy(value: unknown): SchemaValidationResult<ModelPolicy> {
  return validateWith(validators.ModelPolicy, value);
}

export function validateMemoryPolicy(value: unknown): SchemaValidationResult<MemoryPolicy> {
  return validateWith(validators.MemoryPolicy, value);
}

export function validateApprovalPolicy(value: unknown): SchemaValidationResult<ApprovalPolicy> {
  return validateWith(validators.ApprovalPolicy, value);
}

export function validateApprovalRequest(value: unknown): SchemaValidationResult<ApprovalRequest> {
  return validateWith(validators.ApprovalRequest, value);
}

export function validateApprovalEvent(value: unknown): SchemaValidationResult<ApprovalEvent> {
  return validateWith(validators.ApprovalEvent, value);
}

export function validateApprovalStore(value: unknown): SchemaValidationResult<ApprovalStore> {
  return validateWith(validators.ApprovalStore, value);
}

export function validateContextRecord(value: unknown): SchemaValidationResult<ContextRecord> {
  return validateWith(validators.ContextRecord, value);
}

export function validateContextPack(value: unknown): SchemaValidationResult<ContextPack> {
  return validateWith(validators.ContextPack, value);
}

export function validateRegistryResource(value: unknown): SchemaValidationResult<RegistryResource> {
  if (!isRecord(value) || typeof value.kind !== "string") {
    return { valid: false, errors: ["/kind must identify a registry resource"] };
  }
  switch (value.kind) {
    case "AgentCard":
      return validateAgentCard(value);
    case "ToolDescriptor":
      return validateToolDescriptor(value);
    case "ModelPolicy":
      return validateModelPolicy(value);
    case "MemoryPolicy":
      return validateMemoryPolicy(value);
    default:
      return { valid: false, errors: [`/kind unsupported value: ${value.kind}`] };
  }
}

export function assertValidRegistryResource(value: unknown): RegistryResource {
  const result = validateRegistryResource(value);
  if (!result.valid)
    throw new Error(`Registry schema validation failed: ${result.errors.join("; ")}`);
  return result.value;
}
