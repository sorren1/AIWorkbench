import type { PersonaId, Scope, SyntheticPersona } from "./contracts";

export const PERSONAS = [
  {
    id: "synthetic-implementer",
    name: "Author / Implementer · Synthetic persona",
    shortName: "Author / Implementer",
    description:
      "May read delivery context, write approved targets, and run bounded validation; cannot review or approve its own work.",
    scopes: [
      "issue:read",
      "artifact:read",
      "artifact:write",
      "registry:read",
      "tool:invoke",
      "sandbox:execute",
      "evidence:read",
    ],
  },
  {
    id: "synthetic-code-reviewer",
    name: "Code Reviewer · Synthetic persona",
    shortName: "Code Reviewer",
    description:
      "May inspect diffs and evidence but cannot alter implementation artifacts while reviewing.",
    scopes: [
      "issue:read",
      "artifact:read",
      "registry:read",
      "tool:invoke",
      "diff:review",
      "evidence:read",
    ],
  },
  {
    id: "synthetic-validator",
    name: "Validator / Release Approver · Synthetic persona",
    shortName: "Validator / Release Approver",
    description: "May inspect evidence and make the distinct human validation decision.",
    scopes: [
      "issue:read",
      "artifact:read",
      "registry:read",
      "tool:invoke",
      "sandbox:execute",
      "validation:approve",
      "evidence:read",
    ],
  },
  {
    id: "synthetic-platform-admin",
    name: "Platform Administrator · Synthetic persona",
    shortName: "Platform Administrator",
    description:
      "May manage registry and policy configuration but cannot approve release readiness.",
    scopes: ["registry:read", "registry:manage", "policy:manage", "evidence:read"],
  },
  {
    id: "synthetic-auditor",
    name: "Auditor · Synthetic persona",
    shortName: "Auditor",
    description:
      "Read-only access to public fixtures, evidence, registry records, and approval history.",
    scopes: ["issue:read", "artifact:read", "registry:read", "evidence:read"],
  },
] as const satisfies readonly SyntheticPersona[];

export const DEFAULT_PERSONA_ID: PersonaId = "synthetic-code-reviewer";

export function isScope(value: string): value is Scope {
  return PERSONAS.some((persona) => persona.scopes.some((scope) => scope === value));
}

export function isPersonaId(value: string): value is PersonaId {
  return PERSONAS.some((persona) => persona.id === value);
}

export function personaById(id: PersonaId): SyntheticPersona {
  const persona = PERSONAS.find((candidate) => candidate.id === id);
  if (!persona) throw new Error(`Unknown synthetic persona: ${id}`);
  return persona;
}
