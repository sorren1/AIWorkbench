# ADR-003 — Purpose-Specific Application Tools

- **Status:** Accepted
- **Decision:** The local CaseFlow service exposes narrow operations such as `collect_resolution_evidence` and `apply_approved_resolution`. Universal Query MCP tools remain available for engineering discovery and controlled investigation. Actual Connect AI Toolkits are optional and capability-probed.
- **Reason:** Consequential actions need business semantics, authorization, idempotency, and workflow guards that should not be delegated to arbitrary SQL generation.
