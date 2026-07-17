import type {
  ApprovalPolicy,
  ApprovalPolicySource,
  RegistryResource,
  RegistryResourceSource,
} from "./contracts";

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  return `{${Object.entries(value)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`)
    .join(",")}}`;
}

export function contentHashInput(resource: RegistryResource | RegistryResourceSource): unknown {
  const lifecycleFields = new Set(["status", "approval", "createdAt", "updatedAt", "contentHash"]);
  return Object.fromEntries(Object.entries(resource).filter(([key]) => !lifecycleFields.has(key)));
}

export function approvalPolicyHashInput(policy: ApprovalPolicy | ApprovalPolicySource): unknown {
  return Object.fromEntries(Object.entries(policy).filter(([key]) => key !== "contentHash"));
}

export async function sha256Hex(value: unknown): Promise<string> {
  const data = new TextEncoder().encode(canonicalJson(value));
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hasValidContentHash(resource: RegistryResource): Promise<boolean> {
  return (await sha256Hex(contentHashInput(resource))) === resource.contentHash;
}
