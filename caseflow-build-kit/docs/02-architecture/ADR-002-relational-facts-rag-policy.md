# ADR-002 — Relational Facts and Limited Policy Retrieval

- **Status:** Accepted
- **Decision:** Use SQL for structured CRM, finance, and operations facts. Use retrieval/document processing only for unstructured policy text.
- **Reason:** Transactional values require deterministic types, joins, filters, and source semantics. Vector retrieval is not an authority layer.
- **Consequence:** CaseFlow can explicitly explain why RAG is not used for every AI-adjacent problem.
