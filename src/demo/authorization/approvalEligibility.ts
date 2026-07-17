import type { ApprovalRequest, SyntheticPersona } from "./contracts";
import type { ApprovalPolicy } from "../control-plane/registry/contracts";

export type ApprovalEligibilityReason =
  | "ELIGIBLE_DISTINCT_REVIEWER"
  | "SELF_APPROVAL_FORBIDDEN"
  | "PERSONA_NOT_ALLOWED"
  | "MISSING_APPROVER_SCOPE";

export type ApprovalEligibility = {
  readonly allowed: boolean;
  readonly reasonCode: ApprovalEligibilityReason;
  readonly detail: string;
  readonly missingScopes: readonly string[];
};

export function evaluateApprovalEligibility(options: {
  readonly request: ApprovalRequest;
  readonly policy: ApprovalPolicy;
  readonly persona: SyntheticPersona;
}): ApprovalEligibility {
  if (options.policy.forbidSelfApproval && options.request.requesterActor === options.persona.id) {
    return {
      allowed: false,
      reasonCode: "SELF_APPROVAL_FORBIDDEN",
      detail: `Self-approval is forbidden by ${options.policy.id}.`,
      missingScopes: [],
    };
  }
  if (!options.policy.requiredApproverPersonas.includes(options.persona.id)) {
    return {
      allowed: false,
      reasonCode: "PERSONA_NOT_ALLOWED",
      detail: `${options.persona.shortName} is not an allowed approver for ${options.policy.id}.`,
      missingScopes: [],
    };
  }
  const missingScopes = options.policy.requiredApproverScopes.filter(
    (scope) => !options.persona.scopes.some((candidate) => candidate === scope),
  );
  if (missingScopes.length > 0) {
    return {
      allowed: false,
      reasonCode: "MISSING_APPROVER_SCOPE",
      detail: `Approver is missing scope: ${missingScopes.join(", ")}.`,
      missingScopes,
    };
  }
  return {
    allowed: true,
    reasonCode: "ELIGIBLE_DISTINCT_REVIEWER",
    detail: "Distinct persona and required approver scopes satisfy this policy.",
    missingScopes: [],
  };
}
