# Approved Query Catalog

Queries must use fully qualified source names discovered during T03. The examples below are templates, not blindly executable strings.

## CRM

- resolve case by exact case number;
- fetch account tier and display name for resolved account;
- fetch case status, dispute type, invoice ID, shipment ID, and current owner.

## Finance

- fetch invoice header by exact ID and account ID;
- fetch invoice lines restricted to charge code `EXPEDITE`;
- fetch posted payments for invoice;
- look up existing credit by idempotency/external reference.

## Operations

- fetch shipment header and committed delivery timestamp;
- fetch ordered shipment events with event type, event time, cause code, and reviewed flag;
- fetch final delivery timestamp.

## Policy

- fetch exact policy file/version effective on case-created date;
- retrieve only the relevant resolution section when possible.

## Query constraints

- selected columns only;
- exact identifiers or narrow filters;
- explicit `LIMIT` for discovery queries;
- no unrestricted account-wide dumps;
- parameterization through SDK;
- tool-call and row-count recording;
- schema fingerprint validation before live run.
