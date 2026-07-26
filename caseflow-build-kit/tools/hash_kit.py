#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "project" / "ARTIFACT_MANIFEST.json"
OUTPUT = ROOT / "KIT_MANIFEST.sha256"


def canonical_bytes(path: Path) -> bytes:
    """Hash text with canonical LF endings and preserve binary bytes."""
    raw = path.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return raw
    return text.replace("\r\n", "\n").replace("\r", "\n").encode("utf-8")


manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
lines: list[str] = []
for relative_name in manifest["files"]:
    if relative_name == OUTPUT.name:
        continue
    path = (ROOT / relative_name).resolve()
    if not path.is_relative_to(ROOT) or not path.is_file():
        raise ValueError(f"Unsafe or missing manifest path: {relative_name}")
    digest = hashlib.sha256(canonical_bytes(path)).hexdigest()
    lines.append(f"{digest}  {relative_name}")
OUTPUT.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
print(OUTPUT)
