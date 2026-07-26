# Open-Source Python SDK Setup

Official repository: https://github.com/CDataSoftware/cdata-connect-ai-python

## Local environment

```bash
cd caseflow-api
python -m venv .venv
# Windows: .venv\Scripts\activate
# macOS/Linux: source .venv/bin/activate
python -m pip install --upgrade pip
pip install cdata-connect-ai
```

The package currently imports as `cdata_connect_ai` and presents a PEP 249 DB-API interface.

## Minimal read

```python
import os
import cdata_connect_ai

conn = cdata_connect_ai.connect(
    username=os.environ["CDATA_ACCOUNT_EMAIL"],
    password=os.environ["CDATA_PAT"],
    base_url=os.getenv("CDATA_BASE_URL", "https://cloud.cdata.com/api"),
    workspace=os.getenv("CDATA_WORKSPACE") or None,
    timeout=30,
    max_retries=2,
)

try:
    cursor = conn.cursor()
    cursor.execute(
        "SELECT CaseNumber, Status FROM [CaseFlowCRM].[CaseFlow].[Cases] "
        "WHERE CaseNumber = %(case_number)s LIMIT 1",
        {"case_number": "CS-2026-1042"},
    )
    print(cursor.fetchall())
finally:
    conn.close()
```

Actual catalog/schema/table names must come from discovery; do not copy this template blindly.

## Official mock server

The SDK repository includes a FastAPI-based Query API mock intended for local edge cases, timeouts, large datasets, and streaming. T04 should clone the official repository to a temporary/ignored development location, run its tests, and decide whether to reuse it directly or implement a narrow contract-compatible fixture adapter.

## SDK usage rules

- Parameterize values.
- Select only required columns.
- Set explicit timeouts and retry only classified transient failures.
- Record query template IDs and row counts, not secret-bearing request objects.
- Close connections/cursors.
- Do not rely on `commit`/`rollback` to provide cross-source atomicity.
