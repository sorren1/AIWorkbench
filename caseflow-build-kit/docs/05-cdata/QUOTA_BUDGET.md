# Developer Edition Tool-Call Budget

Public limit observed on 2026-07-26: 500 pooled calls/queries per month.

## Internal project budget

| Activity | Target maximum |
|---|---:|
| Account/capability discovery | 40 |
| Source schema discovery | 50 |
| SDK/MCP/scaffold spikes | 80 |
| Adapter development smoke tests | 80 |
| Live evidence capture | 50 |
| Rehearsal reserve | 100 |
| Contingency reserve | 100 |

## Controls

- Mock-first tests.
- Cache sanitized schema fingerprints locally.
- Avoid repeated `getColumns` for unchanged tables.
- One canonical live run per release candidate.
- Record each CData call in the ignored local ledger at
  `/.caseflow-local/cdata-call-ledger.csv` and publish only aggregate counts.
- Stop live work at 400 calls unless the user explicitly reallocates the reserve.
