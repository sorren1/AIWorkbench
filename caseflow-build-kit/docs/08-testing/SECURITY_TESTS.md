# Security Test Checklist

- secret patterns in tracked files and generated `dist`;
- git history scan for PAT/provider key patterns;
- environment values absent from logs/errors;
- public assets contain only approved synthetic domains and IDs;
- no CData/source requests from public replay;
- CSP remains restrictive;
- no external scripts, fonts, analytics, or trackers;
- arbitrary SQL/tool/procedure parameters rejected;
- output schemas reject extra secret-bearing fields;
- approval self-sign, stale digest, wrong role, expired approval rejected;
- write target allow list enforced;
- idempotency conflict enforced;
- raw evidence directory ignored;
- noindex/robots/sitemap contract verified;
- dependency and container scans integrated with existing supply-chain gate.
