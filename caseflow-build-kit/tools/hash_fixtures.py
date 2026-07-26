#!/usr/bin/env python3
from __future__ import annotations

import hashlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FIXTURES = ROOT / "fixtures"


def canonical_bytes(path: Path) -> bytes:
    """Hash text with canonical LF endings and preserve binary bytes."""
    raw = path.read_bytes()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return raw
    return text.replace("\r\n", "\n").replace("\r", "\n").encode("utf-8")


lines = []
for path in sorted(
    p for p in FIXTURES.rglob("*") if p.is_file() and p.name != "FIXTURES.sha256"
):
    digest = hashlib.sha256(canonical_bytes(path)).hexdigest()
    lines.append(f"{digest}  {path.relative_to(ROOT).as_posix()}")
out = FIXTURES / "FIXTURES.sha256"
out.write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
print(out)
