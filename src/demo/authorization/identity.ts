import type { RegistryReference } from "../control-plane/registry/contracts";
import type { DelegatedIdentityEnvelope, SyntheticPersona } from "./contracts";

export function createDelegatedIdentityEnvelope(options: {
  readonly persona: SyntheticPersona;
  readonly agent: RegistryReference;
  readonly effectiveSubject: string;
  readonly runId: string;
  readonly sessionId: string;
  readonly policyDecisionId: string;
  readonly now: string;
  readonly expiresAt: string;
}): DelegatedIdentityEnvelope {
  return {
    envelopeVersion: 1,
    initiatingHumanActor: options.persona.id,
    effectiveSubject: options.effectiveSubject,
    executingAgent: options.agent,
    grantedScopes: options.persona.scopes,
    delegationChain: [
      {
        delegator: options.persona.id,
        delegate: `${options.agent.id}@${options.agent.version}`,
        grantedScopes: options.persona.scopes,
        delegatedAt: options.now,
        expiresAt: options.expiresAt,
      },
    ],
    runId: options.runId,
    sessionId: options.sessionId,
    expiresAt: options.expiresAt,
    policyDecisionId: options.policyDecisionId,
  };
}
