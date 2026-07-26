# Query MCP and Management MCP Setup

## Endpoints currently documented

```text
Query:      https://mcp.cloud.cdata.com/mcp
Management: https://mcp.cloud.cdata.com/mcp/mgmt
```

Both currently use HTTP Basic authentication where the credential is base64 of `email:PAT`.

## Encode locally

Bash:

```bash
export CDATA_BASIC_AUTH="$(printf '%s:%s' "$CDATA_ACCOUNT_EMAIL" "$CDATA_PAT" | base64)"
```

PowerShell:

```powershell
$pair = "$env:CDATA_ACCOUNT_EMAIL`:$env:CDATA_PAT"
$env:CDATA_BASIC_AUTH = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($pair))
```

Do not print or commit the result.

## Claude Code registration example

Use the current official client syntax. A typical current registration is:

```bash
claude mcp add --transport http cdata-query https://mcp.cloud.cdata.com/mcp \
  --header "Authorization: Basic $CDATA_BASIC_AUTH"

claude mcp add --transport http cdata-management https://mcp.cloud.cdata.com/mcp/mgmt \
  --header "Authorization: Basic $CDATA_BASIC_AUTH"
```

If the installed Claude Code version expects `mcp-remote`, follow the current CData MCP reference rather than guessing.

## Probe sequence

1. `tools/list` on both servers.
2. Query MCP: `getCatalogs`.
3. For each CaseFlow catalog: schema, table, and column discovery.
4. Run one narrow read-only query per source.
5. Management MCP: list connections and test only the CaseFlow connections.
6. Do not call delete or destructive tools.
7. Record tool names, response shapes, call count, and sanitized errors.

## Query safety

- Use exact identifiers and selected columns.
- Include `LIMIT` during exploration.
- Do not ask the model to enumerate all rows.
- Keep a tool-call ledger.
- Stop if a response exposes unexpected non-synthetic data.
