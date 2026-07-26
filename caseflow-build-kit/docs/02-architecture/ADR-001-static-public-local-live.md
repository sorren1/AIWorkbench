# ADR-001 — Static Public Experience and Local Live Integration

- **Status:** Accepted
- **Context:** The existing portfolio is a tightly controlled static Vercel build. Live source credentials in a public browser or serverless function would expand risk and complicate the interview.
- **Decision:** Keep all live CData and source interaction local. Emit sanitized evidence for a deterministic public replay.
- **Consequences:** The public demo is reliable and secure, but live behavior must be demonstrated through evidence rather than an interactive network call.
