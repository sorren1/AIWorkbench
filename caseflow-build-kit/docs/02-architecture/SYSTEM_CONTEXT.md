# System Context

```mermaid
flowchart LR
    Analyst[Resolution Analyst]
    Approver[Finance Approver]
    Support[Support / Customer Success]
    FDE[FDE / Implementation Engineer]
    CRM[Synthetic CRM]
    Ops[Synthetic Finance + Operations]
    Policy[Versioned Policy Repository]
    CData[CData Connect AI]
    API[Local CaseFlow Service]
    UI[Static CaseFlow Interview UI]
    Evidence[Sanitized Evidence Bundle]

    Analyst --> UI
    Approver --> UI
    Support --> UI
    FDE --> API
    CRM --> CData
    Ops --> CData
    Policy --> CData
    CData --> API
    API --> Evidence
    Evidence --> UI
```

## Trust boundaries

1. Public browser: synthetic replay only.
2. Local CaseFlow service: trusted development environment with ignored secrets.
3. CData cloud: authenticated connectivity boundary.
4. Source systems: synthetic accounts controlled by the owner.
5. Optional LLM provider: receives only the minimum normalized evidence needed for explanation drafting.

## Key invariant

No browser visitor can cause a CData query, model call, source write, or local command execution.
