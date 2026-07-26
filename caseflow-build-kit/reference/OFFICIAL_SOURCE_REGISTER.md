# Official Source Register

**Checked:** 2026-07-26

Re-check these sources during T03 because product details can change.

| Topic | Official source | Used for |
|---|---|---|
| Connect AI Developer Edition | https://www.cdata.com/developers/ai/developer-edition/ | limits, included MCP servers, tool names, constraints, scaffold entry point |
| Connect AI developer guide | https://www.cdata.com/developers/ai/ | SQL/Python/MCP examples and production patterns |
| MCP reference | https://www.cdata.com/developers/ai/mcp/ | endpoints, Basic auth, Query and Management tools |
| Five-minute quickstart | https://www.cdata.com/developers/ai/quickstart/5-min-to-first-query/ | account/PAT/first-query workflow |
| Agent scaffold quickstart | https://www.cdata.com/developers/ai/quickstart/build-your-first-agent/ | `@cdatasoftware/create-agent` templates and prerequisites |
| Python SDK repository | https://github.com/CDataSoftware/cdata-connect-ai-python | PEP 249 package, official mock server, tests |
| Sample agents repository | https://github.com/CDataSoftware/connect-ai-sample-agents | LangChain, ADK, and Vercel AI SDK scaffolds |
| Connect AI Skills | https://github.com/CDataSoftware/connect-ai-skills | base and source-specific coding-agent guidance |
| CData CLI | https://www.cdata.com/solutions/cli/ | installers, driver/schema/query commands |
| CLI explainer | https://www.cdata.com/blog/what-is-cdata-cli | Java 17, local JDBC-driver architecture and schema-first development |
| Management MCP docs | https://docs.cloud.cdata.com/en/API/MCP-Management | connection-management contracts |
| Toolkits docs | https://docs.cloud.cdata.com/en/Toolkits | purpose-scoped tools; capability probe required |
| Existing AIWorkbench source | https://github.com/sorren1/AIWorkbench | route, build, security, and evidence compatibility |

## Source hierarchy

1. Actual account behavior and current generated scaffold.
2. Current official product documentation.
3. Current official CData GitHub repositories.
4. This kit.

If they disagree, record the observation in `reference/CAPABILITY_PROBE_RESULTS.md`, update the decision log, and make the implementation capability-driven.
