#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
import re
import sys
from collections.abc import Iterable
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
errors: list[str] = []
warnings: list[str] = []
json_documents: dict[Path, Any] = {}

required = [
    ROOT / "START_HERE.md",
    ROOT / "README.md",
    ROOT / "AGENTS.md",
    ROOT / "CLAUDE.md",
    ROOT / "EXECUTION_ORDER.md",
    ROOT / "project" / "TASK_REGISTRY.json",
    ROOT / "project" / "status.json",
    ROOT / "contracts" / "openapi" / "caseflow.openapi.yaml",
]
for path in required:
    if not path.exists():
        errors.append(f"Missing required file: {path.relative_to(ROOT)}")


def load_json(path: Path) -> Any:
    raw = path.read_bytes()
    if raw.startswith(b"\xef\xbb\xbf"):
        errors.append(f"UTF-8 BOM is not permitted: {path.relative_to(ROOT)}")
    try:
        value = json.loads(raw.decode("utf-8"))
    except Exception as exc:
        errors.append(f"Invalid JSON {path.relative_to(ROOT)}: {exc}")
        return None
    json_documents[path.resolve()] = value
    return value


for json_path in sorted(ROOT.rglob("*.json")):
    load_json(json_path)


def pointer(document: Any, fragment: str) -> Any:
    current = document
    for raw_token in fragment.removeprefix("#/").split("/"):
        token = raw_token.replace("~1", "/").replace("~0", "~")
        if not isinstance(current, dict) or token not in current:
            raise KeyError(fragment)
        current = current[token]
    return current


def resolve_reference(reference: str, source: Path, document: Any) -> tuple[Any, Any]:
    if reference.startswith("#/"):
        return pointer(document, reference), document
    path_text, _, fragment = reference.partition("#")
    target_path = (source.parent / path_text).resolve()
    if not target_path.is_relative_to(ROOT):
        raise ValueError(f"reference escapes build kit: {reference}")
    target_document = json_documents.get(target_path)
    if target_document is None:
        if not target_path.exists():
            raise FileNotFoundError(reference)
        target_document = load_json(target_path)
    if fragment:
        return pointer(
            target_document, f"#/{fragment.removeprefix('/')}"
        ), target_document
    return target_document, target_document


def walk_references(value: Any) -> Iterable[str]:
    if isinstance(value, list):
        for item in value:
            yield from walk_references(item)
    elif isinstance(value, dict):
        for key, item in value.items():
            if key == "$ref" and isinstance(item, str):
                yield item
            yield from walk_references(item)


schema_root = ROOT / "contracts" / "schemas"
for schema_path in sorted(schema_root.glob("*.json")):
    schema = json_documents.get(schema_path.resolve())
    if schema is None:
        continue
    for reference in walk_references(schema):
        try:
            resolve_reference(reference, schema_path, schema)
        except Exception as exc:
            errors.append(
                f"Unresolved schema reference {reference} in "
                f"{schema_path.relative_to(ROOT)}: {exc}"
            )


def type_matches(value: Any, expected: str) -> bool:
    return {
        "array": isinstance(value, list),
        "boolean": isinstance(value, bool),
        "integer": isinstance(value, int) and not isinstance(value, bool),
        "null": value is None,
        "number": isinstance(value, (int, float)) and not isinstance(value, bool),
        "object": isinstance(value, dict),
        "string": isinstance(value, str),
    }.get(expected, False)


def validate_instance(
    value: Any,
    schema: Any,
    schema_path: Path,
    root_schema: Any,
    location: str = "$",
) -> list[str]:
    findings: list[str] = []
    if not isinstance(schema, dict):
        return [f"{location}: schema node is not an object"]
    if "$ref" in schema:
        try:
            resolved, resolved_root = resolve_reference(
                str(schema["$ref"]), schema_path, root_schema
            )
        except Exception as exc:
            return [f"{location}: unresolved $ref {schema['$ref']}: {exc}"]
        return validate_instance(value, resolved, schema_path, resolved_root, location)

    expected_type = schema.get("type")
    if expected_type is not None:
        allowed_types = (
            [expected_type] if isinstance(expected_type, str) else expected_type
        )
        if not isinstance(allowed_types, list) or not any(
            isinstance(item, str) and type_matches(value, item)
            for item in allowed_types
        ):
            return [
                f"{location}: expected type {expected_type}, got {type(value).__name__}"
            ]

    if "const" in schema and value != schema["const"]:
        findings.append(f"{location}: expected constant {schema['const']!r}")
    if "enum" in schema and value not in schema["enum"]:
        findings.append(f"{location}: value {value!r} is outside the enum")

    if isinstance(value, str):
        if len(value) < int(schema.get("minLength", 0)):
            findings.append(f"{location}: string is shorter than minLength")
        pattern = schema.get("pattern")
        if isinstance(pattern, str) and re.search(pattern, value) is None:
            findings.append(f"{location}: string does not match {pattern}")
        if schema.get("format") == "date-time":
            try:
                parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
                if parsed.tzinfo is None:
                    raise ValueError("timezone is required")
            except ValueError:
                findings.append(f"{location}: invalid timezone-aware date-time")

    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            findings.append(f"{location}: value is below minimum")

    if isinstance(value, list):
        if len(value) < int(schema.get("minItems", 0)):
            findings.append(f"{location}: array is shorter than minItems")
        if schema.get("uniqueItems"):
            serialized = [json.dumps(item, sort_keys=True) for item in value]
            if len(serialized) != len(set(serialized)):
                findings.append(f"{location}: array items are not unique")
        item_schema = schema.get("items")
        if isinstance(item_schema, dict):
            for index, item in enumerate(value):
                findings.extend(
                    validate_instance(
                        item,
                        item_schema,
                        schema_path,
                        root_schema,
                        f"{location}[{index}]",
                    )
                )

    if isinstance(value, dict):
        required_keys = schema.get("required", [])
        if isinstance(required_keys, list):
            for key in required_keys:
                if key not in value:
                    findings.append(f"{location}: missing required property {key}")
        properties = schema.get("properties", {})
        if isinstance(properties, dict):
            for key, child in value.items():
                child_schema = properties.get(key)
                if child_schema is not None:
                    findings.extend(
                        validate_instance(
                            child,
                            child_schema,
                            schema_path,
                            root_schema,
                            f"{location}.{key}",
                        )
                    )
                elif schema.get("additionalProperties") is False:
                    findings.append(f"{location}: unexpected property {key}")
    return findings


replay_contracts = {
    "canonical-approval.json": "approval-record.schema.json",
    "canonical-evidence-packet.json": "evidence-packet.schema.json",
    "canonical-execution.json": "execution-record.schema.json",
    "canonical-proposal.json": "resolution-proposal.schema.json",
    "partial-failure-execution.json": "execution-record.schema.json",
    "support-handoff.json": "support-handoff.schema.json",
}
validated_fixture_count = 0
for fixture_name, schema_name in replay_contracts.items():
    fixture_path = ROOT / "fixtures" / "replay" / fixture_name
    schema_path = schema_root / schema_name
    fixture = json_documents.get(fixture_path.resolve())
    schema = json_documents.get(schema_path.resolve())
    if fixture is None or schema is None:
        continue
    validated_fixture_count += 1
    for finding in validate_instance(fixture, schema, schema_path, schema):
        errors.append(f"{fixture_path.relative_to(ROOT)} {finding}")

audit_schema_path = schema_root / "audit-event.schema.json"
audit_schema = json_documents.get(audit_schema_path.resolve())
event_catalog = json_documents.get(
    (ROOT / "contracts" / "events" / "event-catalog.json").resolve()
)
trace_path = ROOT / "fixtures" / "replay" / "canonical-trace.json"
trace = json_documents.get(trace_path.resolve())
if (
    isinstance(audit_schema, dict)
    and isinstance(event_catalog, dict)
    and isinstance(trace, dict)
):
    catalog_events = event_catalog.get("events", [])
    trace_events = trace.get("events", [])
    if not isinstance(catalog_events, list) or len(catalog_events) != len(
        set(catalog_events)
    ):
        errors.append("Event catalog must contain a unique event-name array")
    if isinstance(trace_events, list):
        for index, event in enumerate(trace_events, start=1):
            validated_fixture_count += 1
            for finding in validate_instance(
                event, audit_schema, audit_schema_path, audit_schema
            ):
                errors.append(f"{trace_path.relative_to(ROOT)} event {index} {finding}")
            if isinstance(event, dict):
                if event.get("sequence") != index:
                    errors.append(
                        f"{trace_path.relative_to(ROOT)} sequence is not contiguous"
                    )
                if event.get("eventType") not in catalog_events:
                    errors.append(
                        f"{trace_path.relative_to(ROOT)} has unknown event type "
                        f"{event.get('eventType')}"
                    )

manifest_template_path = ROOT / "templates" / "LIVE_EVIDENCE_MANIFEST.json"
manifest_schema_path = schema_root / "live-evidence-manifest.schema.json"
manifest_template = json_documents.get(manifest_template_path.resolve())
manifest_schema = json_documents.get(manifest_schema_path.resolve())
if isinstance(manifest_template, dict) and isinstance(manifest_schema, dict):
    required_manifest_keys = manifest_schema.get("required", [])
    if not isinstance(required_manifest_keys, list) or not set(
        required_manifest_keys
    ).issubset(manifest_template):
        errors.append(
            "Live evidence template does not contain every schema-required field"
        )


openapi_path = ROOT / "contracts" / "openapi" / "caseflow.openapi.yaml"
openapi = load_json(openapi_path)
expected_api_paths = {
    "/api/capabilities",
    "/api/cases/{caseId}",
    "/api/cases/{caseId}/investigate",
    "/api/evidence/export",
    "/api/executions/{executionId}/reconcile",
    "/api/failures/inject",
    "/api/health",
    "/api/proposals/{proposalId}/approve",
    "/api/proposals/{proposalId}/execute",
    "/api/proposals/{proposalId}/reject",
    "/api/runs/{runId}",
    "/api/runs/{runId}/evidence",
    "/api/runs/{runId}/proposal",
}
if isinstance(openapi, dict):
    if openapi.get("openapi") != "3.1.0":
        errors.append("OpenAPI version must be 3.1.0")
    if openapi.get("servers") != [{"url": "http://127.0.0.1:8090"}]:
        errors.append("OpenAPI must expose only the loopback local server")
    api_paths = openapi.get("paths")
    if not isinstance(api_paths, dict) or set(api_paths) != expected_api_paths:
        errors.append("OpenAPI paths do not match the canonical local API set")
    operation_ids: list[str] = []
    if isinstance(api_paths, dict):
        for api_path, path_item in api_paths.items():
            if not isinstance(path_item, dict):
                errors.append(f"OpenAPI path item is invalid: {api_path}")
                continue
            placeholders = set(re.findall(r"\{([^}]+)\}", api_path))
            for method, operation in path_item.items():
                if method not in {"get", "post"} or not isinstance(operation, dict):
                    continue
                operation_id = operation.get("operationId")
                if not isinstance(operation_id, str):
                    errors.append(f"{method.upper()} {api_path} lacks operationId")
                else:
                    operation_ids.append(operation_id)
                if not isinstance(operation.get("responses"), dict):
                    errors.append(f"{method.upper()} {api_path} lacks responses")
                parameter_names: set[str] = set()
                for parameter in operation.get("parameters", []):
                    resolved = parameter
                    if isinstance(parameter, dict) and "$ref" in parameter:
                        try:
                            resolved, _ = resolve_reference(
                                str(parameter["$ref"]), openapi_path, openapi
                            )
                        except Exception as exc:
                            errors.append(
                                f"{method.upper()} {api_path} parameter ref failed: {exc}"
                            )
                            continue
                    if isinstance(resolved, dict) and resolved.get("in") == "path":
                        parameter_names.add(str(resolved.get("name")))
                if placeholders != parameter_names:
                    errors.append(
                        f"{method.upper()} {api_path} path parameters "
                        f"{parameter_names} do not match {placeholders}"
                    )
    if len(operation_ids) != len(set(operation_ids)):
        errors.append("OpenAPI operationId values must be unique")
    for reference in walk_references(openapi):
        try:
            resolve_reference(reference, openapi_path, openapi)
        except Exception as exc:
            errors.append(f"Unresolved OpenAPI reference {reference}: {exc}")


mode_contract = json_documents.get(
    (ROOT / "contracts" / "config" / "mode-contract.json").resolve()
)
route_contract = json_documents.get(
    (ROOT / "contracts" / "ui" / "stage-route-contract.json").resolve()
)
tool_registry = json_documents.get(
    (ROOT / "contracts" / "tools" / "tool-registry.json").resolve()
)
if isinstance(mode_contract, dict):
    modes = mode_contract.get("modes", {})
    if not isinstance(modes, dict):
        errors.append("Mode contract lacks modes")
        modes = {}
    if isinstance(route_contract, dict):
        for key in ("publicMode", "recordedMode"):
            if route_contract.get(key) not in modes:
                errors.append(f"Route contract {key} is not a declared mode")
        expected_routes = {
            "/caseflow/",
            "/caseflow/strategy",
            "/caseflow/technical",
            "/caseflow/operations",
            "/caseflow/product",
        }
        actual_routes = {
            route.get("path")
            for route in route_contract.get("routes", [])
            if isinstance(route, dict)
        }
        if actual_routes != expected_routes:
            errors.append(
                "Stage route contract paths do not match the approved route set"
            )
    if isinstance(tool_registry, dict):
        for tool in tool_registry.get("caseflowServiceTools", []):
            if not isinstance(tool, dict):
                errors.append("CaseFlow service tool entry is not an object")
                continue
            for mode in tool.get("allowedModes", []):
                if mode not in modes:
                    errors.append(f"Tool {tool.get('name')} uses unknown mode {mode}")
            output_schema = tool.get("outputSchema")
            if isinstance(output_schema, str) and not (ROOT / output_schema).is_file():
                errors.append(
                    f"Tool {tool.get('name')} output schema does not exist: {output_schema}"
                )


try:
    registry = json_documents[(ROOT / "project" / "TASK_REGISTRY.json").resolve()]
    status = json_documents[(ROOT / "project" / "status.json").resolve()]
    tasks = registry["tasks"]
    ids = [task["id"] for task in tasks]
    expected = [f"T{i:02d}" for i in range(31)]
    if ids != expected:
        errors.append(f"Task IDs are not the expected T00..T30 sequence: {ids}")
    status_ids = [task["id"] for task in status["tasks"]]
    if status_ids != ids:
        errors.append("Status task sequence differs from TASK_REGISTRY")
    idset = set(ids)
    for task in tasks:
        for dependency in task.get("dependencies", []):
            if dependency not in idset:
                errors.append(f"{task['id']} depends on unknown {dependency}")
        number = int(task["id"][1:])
        matches = list((ROOT / "prompts").glob(f"{number:02d}_*.md"))
        if len(matches) != 1:
            errors.append(f"Expected one prompt for {task['id']}; found {len(matches)}")
except Exception as exc:
    errors.append(f"Cannot validate task registry/status: {exc}")


path_pattern = re.compile(r"`(caseflow-build-kit/[^`]+)`")
allowed_future_prefixes = ("caseflow-build-kit/deliverables/",)
for prompt in sorted((ROOT / "prompts").glob("*.md")):
    text = prompt.read_text(encoding="utf-8")
    for reference in path_pattern.findall(text):
        relative_path = reference.removeprefix("caseflow-build-kit/")
        target = ROOT / relative_path
        if target.exists():
            continue
        if any(reference.startswith(prefix) for prefix in allowed_future_prefixes):
            continue
        if "*" in relative_path and list(ROOT.glob(relative_path)):
            continue
        warnings.append(
            f"Future or unresolved prompt reference in {prompt.name}: {reference}"
        )


def verify_hash_ledger(ledger: Path, base: Path) -> None:
    if not ledger.exists():
        errors.append(f"Missing hash ledger: {ledger.relative_to(ROOT)}")
        return
    for line_number, line in enumerate(
        ledger.read_text(encoding="utf-8").splitlines(), start=1
    ):
        match = re.fullmatch(r"([a-f0-9]{64})  (.+)", line)
        if match is None:
            errors.append(f"Malformed hash ledger line {ledger.name}:{line_number}")
            continue
        digest, relative_name = match.groups()
        target = base / relative_name
        if not target.is_file():
            errors.append(f"Hash ledger target is missing: {relative_name}")
            continue
        raw = target.read_bytes()
        try:
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            canonical = raw
        else:
            canonical = text.replace("\r\n", "\n").replace("\r", "\n").encode("utf-8")
        actual = hashlib.sha256(canonical).hexdigest()
        if actual != digest:
            errors.append(f"Hash ledger mismatch: {relative_name}")


verify_hash_ledger(ROOT / "fixtures" / "FIXTURES.sha256", ROOT)
verify_hash_ledger(ROOT / "KIT_MANIFEST.sha256", ROOT)

artifact_manifest = json_documents.get(
    (ROOT / "project" / "ARTIFACT_MANIFEST.json").resolve()
)
if isinstance(artifact_manifest, dict):
    manifest_files = artifact_manifest.get("files", [])
    if not isinstance(manifest_files, list):
        errors.append("Artifact manifest files must be an array")
        manifest_files = []
    if artifact_manifest.get("fileCount") != len(manifest_files):
        errors.append("Artifact manifest fileCount does not match files")
    if len(manifest_files) != len(set(manifest_files)):
        errors.append("Artifact manifest contains duplicate paths")
    for relative_name in manifest_files:
        if not isinstance(relative_name, str) or not (ROOT / relative_name).is_file():
            errors.append(f"Artifact manifest file is missing: {relative_name}")
    for relative_name in artifact_manifest.get("requiredCore", []):
        if not (ROOT / relative_name).is_file():
            errors.append(f"Artifact manifest core file is missing: {relative_name}")

for category in ("prompts", "contracts", "fixtures", "templates", "project", "tools"):
    if not any(path.is_file() for path in (ROOT / category).rglob("*")):
        errors.append(f"Durable kit category is empty: {category}")

secret_patterns = [
    re.compile(r"sk-[A-Za-z0-9]{20,}"),
    re.compile(
        r"(?i)(authorization:\s*basic\s+)"
        r"(?!YOUR_BASE64|\$CDATA_BASIC_AUTH)[A-Za-z0-9+/=]{20,}"
    ),
    re.compile(r"(?im)^CDATA_PAT=[^\r\n#]+$"),
]
text_suffixes = {
    ".csv",
    ".example",
    ".json",
    ".md",
    ".py",
    ".sql",
    ".yaml",
    ".yml",
}
for path in sorted(
    candidate
    for candidate in ROOT.rglob("*")
    if candidate.is_file() and candidate.suffix.lower() in text_suffixes
):
    text = path.read_text(encoding="utf-8", errors="replace")
    for pattern in secret_patterns:
        if pattern.search(text):
            errors.append(
                f"Potential secret-like value in {path.relative_to(ROOT)} "
                f"matching {pattern.pattern}"
            )

if warnings:
    print("Warnings:")
    for warning in sorted(set(warnings)):
        print(f"  - {warning}")

if errors:
    print("Validation failed:")
    for error in errors:
        print(f"  - {error}")
    sys.exit(1)

file_count = sum(1 for path in ROOT.rglob("*") if path.is_file())
json_count = len(json_documents)
print(
    "CaseFlow build kit valid: "
    f"{file_count} files, {json_count} JSON/OpenAPI documents, "
    f"{validated_fixture_count} schema-bound fixture records."
)
