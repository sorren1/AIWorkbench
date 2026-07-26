# Official Agent Scaffold Setup

Official repository: https://github.com/CDataSoftware/connect-ai-sample-agents

## Current generator

```bash
npx @cdatasoftware/create-agent --list
```

Recommended spike for this project:

```bash
mkdir -p experiments/cdata-agent-scaffold
cd experiments/cdata-agent-scaffold
npx @cdatasoftware/create-agent langchain --python
```

Alternative TypeScript scaffold:

```bash
npx @cdatasoftware/create-agent aisdk
```

Current generated templates use environment variables such as:

```text
CDATA_ACCT_EMAIL
CDATA_PAT
```

CaseFlow's main service standardizes on `CDATA_ACCOUNT_EMAIL` but supports a compatibility mapping. Do not edit generated code until the unmodified scaffold has been committed or recorded as a baseline in the experiment report.

## Spike objectives

- confirm the scaffold installs and starts;
- identify Query and Management MCP wiring;
- identify source-connection assumptions;
- replace the standup prompt with a read-only CaseFlow evidence question in a branch/experiment;
- compare its tool lifecycle, retry/error handling, and context behavior with the deterministic CaseFlow service;
- decide which patterns to reuse, not which entire scaffold to copy.

## Boundary

The scaffold experiment is supporting evidence. The main CaseFlow workflow remains deterministic and does not require an autonomous agent to calculate policy or execute writes.
