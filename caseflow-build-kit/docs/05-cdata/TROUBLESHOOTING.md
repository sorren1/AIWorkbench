# CData Troubleshooting

| Symptom | Likely cause | Response |
|---|---|---|
| 401 from MCP/API | email/PAT mismatch, expired token | verify local env and regenerate PAT; never log credential |
| No MCP tools | endpoint/client registration issue | re-check current MCP reference and restart client |
| No catalogs | no connection or user lacks access | inspect Management MCP/list connections and account UI |
| Table not found | wrong catalog/schema/case sensitivity | run catalog/schema/table discovery; update mapping |
| Query rejected | source SQL dialect/feature limitation | simplify query; inspect source-specific skill/instructions |
| Timeout | source/API latency or broad query | narrow columns/filters, reduce limit, classify retry |
| Rate limit/quota | source or Developer Edition limit | stop repeated calls, use mock, preserve reserve |
| Write procedure absent | source/connector is read-only or different procedure | keep live read and use local write simulation; document limitation |
| Toolkit unavailable | account/tier capability difference | use CaseFlow application tools; label production mapping only |
| CLI Java error | Java <17 or PATH issue | install supported JDK and reopen shell |
| CLI licensing error | driver not activated/licensed | follow current trial/activation flow or complete T07 with limitation |
| SDK mock differs from live API | version drift | pin versions, add adapter compatibility layer, record issue |
