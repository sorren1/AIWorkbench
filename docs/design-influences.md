# Public design influences

Status: active provenance record
Last reviewed: 2026-07-16

## Purpose and clean-room method

This register records public material that informed the portfolio plan so the boundary between industry concepts and this repository's original implementation remains inspectable.

For AWS Labs Loom, review was limited to the public project README and public AWS Open Source Blog description. Loom implementation source files, components, schemas, screenshots, copy, and AWS-specific product UI were not used. For standards, only public specifications and documentation were consulted. No employer/client material was consulted, and the existing prohibition on previous-employer code, prompts, schemas, screenshots, names, or confidential implementation details remains in force.

The repository may reuse standard-defined wire names only where needed for interoperability. Its product copy, domain types, fixtures, policy reason codes, information architecture, and visual design will be written independently.

## AWS Labs Loom

- **Public project or standard consulted:** [AWS Labs Loom public README](https://github.com/awslabs/loom) and [AWS Open Source Blog introduction](https://aws.amazon.com/blogs/opensource/building-secure-ai-agents-at-scale-introducing-loom-for-aws/).
- **High-level concept considered:** enterprise agents benefit from registry lifecycle, scoped authorization, persona-aware tool boundaries, human approval for sensitive tool calls, model routing controls, usage visibility, and trace inspection.
- **Independently implemented here:** an original stage-bound registry, capability-card model, persona/action policy evaluator, approval event journal, provider-neutral runtime-policy contract, budget evidence, and trace waterfall tied only to the AI Delivery Workbench coding stages.
- **Deliberately not adopted:** Loom's source code, components, copy, schemas, screenshots, visual information architecture, AWS-specific UI, deployment topology, broad agent catalog, multi-agent service network, or AWS service integration. A full AWS account deployment; Cognito, ECS, RDS, VPC, and PrivateLink infrastructure; and a generic multi-tenant marketplace are out of scope.
- **Copy confirmation:** no Loom source code or UI assets were copied. No Loom project copy or project-specific schema will be reproduced.

## OpenTelemetry and GenAI semantic conventions

- **Public project or standard consulted:** [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/) and the current [OpenTelemetry GenAI semantic-conventions repository](https://github.com/open-telemetry/semantic-conventions-genai).
- **High-level concept considered:** traces use parent/child spans, stable context propagation, common span kinds/attributes, and GenAI-specific operations for agent invocation, inference, retrieval, tool execution, and usage. The GenAI conventions are evolving, so emitted conventions need an explicit pinned version.
- **Independently implemented here:** a small workbench trace domain, an OTLP/HTTP JSON export adapter, privacy-preserving governance attributes in a project namespace, deterministic compatibility fixtures, and an accessible local waterfall/table view.
- **Deliberately not adopted:** a hosted collector, vendor observability backend, production sampling/retention platform, capture of prompt/context/tool bodies by default, or every optional GenAI attribute.
- **Copy confirmation:** no OpenTelemetry source code or UI assets were copied. Standard wire/attribute names may be emitted only as required for compatibility; the viewer and governance model are original.

## Model Context Protocol

- **Public project or standard consulted:** the official [MCP server overview](https://modelcontextprotocol.io/specification/2025-06-18/server/index), [tools specification](https://modelcontextprotocol.io/specification/2025-06-18/server/tools), [resources specification](https://modelcontextprotocol.io/specification/2025-06-18/server/resources), and [authorization specification](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization).
- **High-level concept considered:** tools and resources are distinct capabilities; tool definitions declare input/output shape; resource metadata can inform context choice; clients must apply authorization and human-approval safeguards rather than trusting tool metadata.
- **Independently implemented here:** bounded local tool registry records, risk classes, allow/deny/approval policy, context-pack source metadata, and simulated MCP adapters that are always labeled as external simulations.
- **Deliberately not adopted:** an MCP server/client runtime, OAuth flow, network transport, remote discovery, automatic trust of server annotations, live tool invocation, or a generic tool directory.
- **Copy confirmation:** no MCP implementation source or UI assets were copied. Protocol-defined names are referenced only when a future adapter requires interoperability; the workbench manifests and UI are original.

## CycloneDX

- **Public project or standard consulted:** [CycloneDX specification overview](https://cyclonedx.org/specification/overview/) and [CycloneDX JSON reference](https://cyclonedx.org/docs/1.7/json/).
- **High-level concept considered:** a machine-readable bill of materials can identify components, dependencies, tool provenance, and the revision represented by a supply-chain artifact.
- **Independently implemented here:** CI generation and retention of a CycloneDX JSON SBOM plus a small workbench evidence envelope that links the generated artifact, digest, tool version, source revision, status, and findings summary.
- **Deliberately not adopted:** a full software-composition-analysis platform, vulnerability database, hosted BOM service, AI/ML BOM claims, or a custom reimplementation of the CycloneDX schema.
- **Copy confirmation:** no CycloneDX implementation source or UI assets were copied. The official schema will be consumed by pinned tooling rather than copied into product source; the evidence presentation is original.

## Maintenance rule

Before implementation adopts another public project's material design concept, add an entry with the five fields above. Standards used solely through a pinned tool still need an entry when they materially shape a public compatibility claim. Reference links and standard versions must be rechecked during the implementation phase because public documentation and evolving specifications can change.
