# Source Authority Matrix

| Data element | Canonical source | Read path | Write path | Freshness target | Conflict rule |
|---|---|---|---|---|---|
| Account legal name and tier | CRM | structured SQL | none | 15 min | CRM wins; record alias conflicts |
| Contact and case | CRM | structured SQL | case update after execution | near-real-time | case ID must resolve uniquely |
| Invoice and line charge | Finance | structured SQL | none | near-real-time | invoice amount cannot be inferred |
| Payments | Finance | structured SQL | none | near-real-time | newest posted transaction wins |
| Credit memo | Finance | structured SQL/procedure | approved create only | transactional | idempotency ledger is mandatory |
| Shipment promise | Operations | structured SQL | none | near-real-time | original committed time is retained |
| Shipment events/delivery | Operations | structured SQL | none | near-real-time | contradictory terminal events escalate |
| Delay cause | Operations + reviewed event | structured SQL | none | near-real-time | unknown/customer-caused cannot qualify |
| Policy text | Versioned policy repository | document retrieval/local fixture | none | version effective date | exact effective version required |
| Eligibility and amount | Deterministic CaseFlow policy engine | local pure function | none | current run | never model-generated |
| Approval | Approval journal | application API | human approval record | immediate | must bind proposal digest |
| Customer response | CaseFlow draft + CRM | evidence-bound draft | CRM case note | after execution/reconciliation | must not say completed before receipts |
