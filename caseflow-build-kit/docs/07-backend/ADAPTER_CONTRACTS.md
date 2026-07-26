# Ports and Adapter Contracts

## SourceDiscoveryPort

- list catalogs;
- list schemas/tables/columns for approved catalogs;
- return schema fingerprint;
- expose capability/limitation record.

## EvidenceSourcePort

- resolve case/account/invoice/shipment;
- fetch required CRM facts;
- fetch finance facts;
- fetch operations facts;
- retrieve effective policy;
- return normalized records with source references.

## FinanceActionPort

- find existing credit by external/idempotency reference;
- create approved credit memo;
- return stable receipt;
- never infer approval.

## CrmActionPort

- update case resolution after finance receipt;
- return stable receipt.

## ApprovalPort

- create request;
- approve/reject;
- validate digest, role, expiration, distinct identity.

## ExecutionLedgerPort

- reserve idempotency key and payload digest;
- record action attempts/receipts;
- return prior result on exact replay;
- reject conflicting payload reuse.

## ExplanationPort

- optional evidence-bound explanation draft;
- must produce structured facts/citations;
- has no access to action adapters.
