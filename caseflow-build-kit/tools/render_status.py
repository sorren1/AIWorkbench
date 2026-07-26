#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
status_path = ROOT / "project" / "status.json"
out_path = ROOT / "project" / "STATUS.md"
data = json.loads(status_path.read_text(encoding="utf-8"))
lines = [
    "# Project Status",
    "",
    "> Generated from `project/status.json` by `tools/render_status.py`. Do not hand-edit task rows.",
    "",
    f"**Project:** {data['project']}",
    f"**Version:** {data['version']}",
    f"**Last updated:** {data['last_updated']}",
    f"**Current task:** {data['current_task']}",
    "",
    "| ID | Task | Owner | Status | Evidence / limitation summary |",
    "|---|---|---|---|---|",
]
for task in data["tasks"]:
    summary_parts = []
    if task.get("evidence"):
        summary_parts.append("Evidence: " + ", ".join(task["evidence"][:3]))
    if task.get("limitations"):
        summary_parts.append("Limitations: " + "; ".join(task["limitations"][:2]))
    if task.get("notes"):
        summary_parts.append(task["notes"].replace("|", "\\|"))
    summary = " — ".join(summary_parts) or "—"
    lines.append(
        f"| {task['id']} | {task['title']} | {task['owner']} | {task['status']} | {summary} |"
    )
lines.extend(
    [
        "",
        "Run `python caseflow-build-kit/tools/next_task.py` to identify the next executable task.",
        "",
    ]
)
out_path.write_text("\n".join(lines), encoding="utf-8", newline="\n")
print(out_path)
