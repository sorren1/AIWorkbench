# Local API Architecture

## Local-only FastAPI endpoints

- `GET /api/health`
- `GET /api/capabilities`
- `GET /api/cases/{case_id}`
- `POST /api/cases/{case_id}/investigate`
- `GET /api/runs/{run_id}`
- `GET /api/runs/{run_id}/evidence`
- `POST /api/runs/{run_id}/proposal`
- `POST /api/proposals/{proposal_id}/approve`
- `POST /api/proposals/{proposal_id}/reject`
- `POST /api/proposals/{proposal_id}/execute`
- `POST /api/executions/{execution_id}/reconcile`
- `POST /api/failures/inject` — local/mock only
- `POST /api/evidence/export` — sanitized output only

## API rules

- Pydantic request/response models generated or kept consistent with JSON schemas.
- No endpoint accepts arbitrary SQL, catalog, table, procedure, or command input.
- Public Vercel does not expose these endpoints.
- Live-write endpoints additionally require local mode, allow-listed target, approval, and idempotency headers/body.
- Error responses include stable category/code, safe message, retryability, correlation ID, and no raw secret-bearing exception.
