# Package Tree

```text
caseflow-build-kit/
├── contracts
│   ├── config
│   │   └── mode-contract.json
│   ├── events
│   │   └── event-catalog.json
│   ├── openapi
│   │   └── caseflow.openapi.yaml
│   ├── schemas
│   │   ├── approval-record.schema.json
│   │   ├── audit-event.schema.json
│   │   ├── claim-record.schema.json
│   │   ├── evidence-packet.schema.json
│   │   ├── execution-record.schema.json
│   │   ├── live-evidence-manifest.schema.json
│   │   ├── resolution-proposal.schema.json
│   │   └── support-handoff.schema.json
│   ├── tools
│   │   └── tool-registry.json
│   └── ui
│       └── stage-route-contract.json
├── deliverables
│   ├── captures
│   │   └── README.md
│   ├── completion-reports
│   │   └── README.md
│   ├── design
│   │   └── README.md
│   ├── evidence-spikes
│   │   └── README.md
│   ├── interview
│   │   └── README.md
│   └── README.md
├── docs
│   ├── 00-product
│   │   ├── CUSTOMER_PROBLEM.md
│   │   ├── DEMO_SCENARIO.md
│   │   ├── NON_GOALS.md
│   │   ├── PERSONAS.md
│   │   ├── PRODUCT_BRIEF.md
│   │   └── SUCCESS_METRICS.md
│   ├── 01-discovery
│   │   ├── ACCEPTANCE_CRITERIA.md
│   │   ├── ASSUMPTION_LOG.md
│   │   ├── DISCOVERY_QUESTION_BANK.md
│   │   ├── ENGAGEMENT_BRIEF.md
│   │   ├── PHASED_ROLLOUT.md
│   │   └── SOURCE_AUTHORITY_MATRIX.md
│   ├── 02-architecture
│   │   ├── ADR-001-static-public-local-live.md
│   │   ├── ADR-002-relational-facts-rag-policy.md
│   │   ├── ADR-003-application-tools.md
│   │   ├── ADR-004-cross-source-saga.md
│   │   ├── CONTAINER_COMPONENT_ARCHITECTURE.md
│   │   ├── DATA_FLOW.md
│   │   ├── LIVE_REPLAY_MODES.md
│   │   ├── SYSTEM_CONTEXT.md
│   │   └── WORKFLOW_STATE_MACHINE.md
│   ├── 03-security
│   │   ├── AUTHORIZATION_MATRIX.md
│   │   ├── CLEAN_ROOM.md
│   │   ├── PRIVACY_AND_PII.md
│   │   ├── SAFE_WRITE_MODEL.md
│   │   ├── SECRET_HANDLING.md
│   │   ├── SECURITY_MODEL.md
│   │   └── THREAT_MODEL.md
│   ├── 04-data
│   │   ├── DOMAIN_MODEL.md
│   │   ├── GOLD_CASES.md
│   │   ├── POLICY_MODEL.md
│   │   ├── QUERY_CATALOG.md
│   │   ├── SOURCE_MODELS.md
│   │   └── SYNTHETIC_DATA_DICTIONARY.md
│   ├── 05-cdata
│   │   ├── AGENT_SCAFFOLD_SETUP.md
│   │   ├── CLI_SETUP.md
│   │   ├── CONNECT_AI_SKILLS_SETUP.md
│   │   ├── CONNECTION_PROFILES.md
│   │   ├── DEVELOPER_EDITION_SETUP.md
│   │   ├── LIVE_VALIDATION_RUNBOOK.md
│   │   ├── MCP_SETUP.md
│   │   ├── PYTHON_SDK_SETUP.md
│   │   ├── QUOTA_BUDGET.md
│   │   └── TROUBLESHOOTING.md
│   ├── 06-frontend
│   │   ├── ACCESSIBILITY.md
│   │   ├── CLAUDE_DESIGN_HANDOFF.md
│   │   ├── DESIGN_SYSTEM.md
│   │   ├── INFORMATION_ARCHITECTURE.md
│   │   ├── RESPONSIVE.md
│   │   ├── STAGE_VIEWS.md
│   │   └── UX_BRIEF.md
│   ├── 07-backend
│   │   ├── ADAPTER_CONTRACTS.md
│   │   ├── API_ARCHITECTURE.md
│   │   ├── ERROR_MODEL.md
│   │   ├── EVIDENCE_CAPTURE.md
│   │   ├── OBSERVABILITY.md
│   │   └── ORCHESTRATOR.md
│   ├── 08-testing
│   │   ├── EVALUATION_PLAN.md
│   │   ├── FAILURE_INJECTION.md
│   │   ├── RELEASE_GATES.md
│   │   ├── SECURITY_TESTS.md
│   │   └── TEST_STRATEGY.md
│   ├── 09-deployment
│   │   ├── PUBLIC_DISCLOSURE.md
│   │   ├── RELEASE_PLAN.md
│   │   ├── ROLLBACK.md
│   │   ├── SAME_SITE_INTEGRATION.md
│   │   └── VERCEL_ROUTE_CONTRACT.md
│   └── 10-interviews
│       ├── PANEL_NARRATIVE.md
│       ├── PROFESSIONAL_EVIDENCE_BRIDGES.md
│       ├── QUESTION_BANK.md
│       ├── REHEARSAL_SCORECARD.md
│       ├── SHARED_20_SECOND_RESET.md
│       ├── STAGE_2_NICK.md
│       ├── STAGE_3_TECHNICAL.md
│       ├── STAGE_4_MEERA.md
│       └── STAGE_5_RAVIV.md
├── experiments
│   ├── cdata-agent-scaffold
│   │   └── README.md
│   ├── cdata-cli-spike
│   │   └── README.md
│   ├── cdata-python-sdk-spike
│   │   └── README.md
│   └── README.md
├── fixtures
│   ├── gold-cases
│   │   ├── conflicting-delivery.json
│   │   ├── duplicate-execution.json
│   │   ├── gold-cases.json
│   │   └── missing-policy.json
│   ├── policy
│   │   └── resolution-policy-2026-2.md
│   ├── postgres
│   │   ├── schema.sql
│   │   └── seed.sql
│   ├── replay
│   │   ├── canonical-approval.json
│   │   ├── canonical-evidence-packet.json
│   │   ├── canonical-execution.json
│   │   ├── canonical-proposal.json
│   │   ├── canonical-trace.json
│   │   ├── capability-summary.json
│   │   ├── evaluation-summary.json
│   │   ├── partial-failure-execution.json
│   │   └── support-handoff.json
│   ├── source-data
│   │   ├── crm
│   │   │   ├── Accounts.csv
│   │   │   ├── Cases.csv
│   │   │   └── Contacts.csv
│   │   ├── finance
│   │   │   ├── credit_memos.csv
│   │   │   ├── invoice_lines.csv
│   │   │   ├── invoices.csv
│   │   │   └── payments.csv
│   │   └── operations
│   │       ├── shipment_events.csv
│   │       └── shipments.csv
│   ├── FIXTURES.sha256
│   └── README.md
├── project
│   ├── ARTIFACT_MANIFEST.json
│   ├── ASSUMPTIONS.md
│   ├── CHANGE_CONTROL.md
│   ├── DECISION_LOG.md
│   ├── DEFINITION_OF_DONE.md
│   ├── MASTER_PLAN.md
│   ├── RISK_REGISTER.md
│   ├── status.json
│   ├── STATUS.md
│   ├── TASK_REGISTRY.json
│   └── VERSIONING.md
├── prompts
│   ├── 00_bootstrap_operator_decisions.md
│   ├── 01_repository_preflight.md
│   ├── 02_architecture_contract_reconciliation.md
│   ├── 03_cdata_capability_probe.md
│   ├── 04_python_sdk_mock_spike.md
│   ├── 05_mcp_query_management_spike.md
│   ├── 06_official_agent_scaffold_spike.md
│   ├── 07_cdata_cli_optional_spike.md
│   ├── 08_claude_design_visual_system.md
│   ├── 09_claude_design_stage_views.md
│   ├── 10_frontend_shell_hidden_route.md
│   ├── 11_fastapi_mode_architecture.md
│   ├── 12_domain_policy_fixtures.md
│   ├── 13_cdata_adapters_discovery.md
│   ├── 14_evidence_provenance.md
│   ├── 15_approval_idempotency_saga.md
│   ├── 16_replay_recorder_sanitizer.md
│   ├── 17_stage2_strategy_view.md
│   ├── 18_stage3_technical_view.md
│   ├── 19_stage4_operations_view.md
│   ├── 20_stage5_product_view.md
│   ├── 21_guided_tours_presenter.md
│   ├── 22_observability_evals_failures.md
│   ├── 23_security_cleanroom_audit.md
│   ├── 24_accessibility_browser_performance.md
│   ├── 25_live_validation_evidence.md
│   ├── 26_same_site_vercel_integration.md
│   ├── 27_release_deploy_rollback.md
│   ├── 28_interview_rehearsal_package.md
│   ├── 29_final_independent_audit.md
│   ├── 30_optional_enhancements.md
│   └── README.md
├── reference
│   ├── CAPABILITY_PROBE_RESULTS.md
│   ├── CDATA_CURRENT_CAPABILITIES.md
│   ├── CLAIM_BOUNDARIES.md
│   ├── COPYRIGHT_AND_TRADEMARKS.md
│   ├── EXISTING_SITE_INSPECTION.md
│   ├── OFFICIAL_SOURCE_REGISTER.md
│   └── TERMINOLOGY.md
├── templates
│   ├── CData_CALL_LEDGER.csv
│   ├── CLAUDE_DESIGN_COMPLETION_REPORT.md
│   ├── CODEX_COMPLETION_REPORT.md
│   ├── DECISION_RECORD.md
│   ├── INTERVIEW_RUN_SHEET.md
│   ├── LIVE_EVIDENCE_MANIFEST.json
│   ├── OPERATOR_DECISIONS.md
│   ├── PRODUCT_FRICTION_ITEM.md
│   ├── RELEASE_CHECKLIST.md
│   ├── SECURITY_REVIEW.md
│   ├── STATUS_UPDATE.md
│   └── SUPPORT_HANDOFF.md
├── tools
│   ├── hash_fixtures.py
│   ├── next_task.py
│   ├── preflight_repo.py
│   ├── README.md
│   ├── render_status.py
│   └── validate_kit.py
├── .env.example
├── .gitignore
├── AGENTS.md
├── CLAUDE.md
├── EXECUTION_ORDER.md
├── KIT_MANIFEST.sha256
├── LICENSE-NOTICE.md
├── PROMPT_INDEX.md
├── README.md
├── START_HERE.md
└── TREE.md
```
