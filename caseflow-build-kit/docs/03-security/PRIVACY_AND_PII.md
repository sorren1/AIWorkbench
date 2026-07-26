# Privacy and PII Boundary

All public and live-test data must be synthetic. Use the reserved example domains and names in fixtures.

## Public allow list

- synthetic company, account, case, invoice, shipment, policy, and user IDs;
- synthetic names under `example.com`;
- rounded/fictional monetary values;
- source catalog aliases that do not reveal account names;
- normalized tool/query metadata.

## Public deny list

- real names, emails, phone numbers, addresses, employers, clients, credentials, tenant IDs, OAuth identifiers, database endpoints, access tokens, or raw live source configuration.

The sanitizer should prefer explicit field allow lists over regex-only redaction.
