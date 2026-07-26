# CData Current Capability Baseline

This is a planning baseline, not a substitute for T03.

## Developer Edition public baseline

As of 2026-07-26, the public Developer Edition page states:

- 5 sources;
- 5 users;
- 500 pooled tool calls/queries per month;
- Query MCP and Management MCP;
- no credit card;
- universal source connectors through MCP;
- Data Copilot, sample agent scaffold, and Connect Gateway references;
- free-tier exclusions for premium connectors, caching, scheduled jobs, workspace isolation, RBAC, and SSO.

The same page references Toolkits while separately listing enterprise-control exclusions. Therefore, Toolkits must be probed rather than assumed. CaseFlow's safety does not depend on a paid Toolkit: purpose-specific action boundaries are implemented in the application service and mapped conceptually to production Toolkits.

## Query MCP

Endpoint currently documented as:

```text
https://mcp.cloud.cdata.com/mcp
```

Expected tools:

- `getCatalogs`
- `getSchemas`
- `getTables`
- `getColumns`
- `queryData`
- `getProcedures`
- `getProcedureParameters`
- `executeProcedure`
- source instructions may also be exposed depending on client/product revision

## Management MCP

Endpoint currently documented as:

```text
https://mcp.cloud.cdata.com/mcp/mgmt
```

Expected connection-management tools include:

- `list_available_sources`
- `get_source_properties`
- `create_connection`
- `list_connections`
- `test_connection`

Never invoke a destructive management tool without explicit confirmation.

## Python SDK

- PyPI package: `cdata-connect-ai`
- import: `cdata_connect_ai`
- Python 3.10+
- DB-API 2.0 interface
- default API base URL currently `https://cloud.cdata.com/api`
- supports parameterized queries, batch operations, stored procedures, timeout, and retry configuration
- official repository includes a FastAPI Query API mock for errors, timeouts, large data, and streaming

## Agent scaffold

Current command:

```bash
npx @cdatasoftware/create-agent
```

Current templates include LangChain v1 in Python/TypeScript, Google ADK in Python/TypeScript, and Vercel AI SDK in TypeScript. Generated environment names currently include `CDATA_ACCT_EMAIL` and `CDATA_PAT`.

## CLI

The CLI is a separate local development path over CData JDBC drivers. It is not the same runtime as Connect AI Developer Edition or its Python SDK. Initial public release is JDBC-oriented and requires Java 17+. Use it to demonstrate schema-grounded AI-assisted development, not as a required CaseFlow production dependency.
