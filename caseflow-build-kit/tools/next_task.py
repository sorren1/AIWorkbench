#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "project" / "status.json").read_text(encoding="utf-8"))
by_id = {task["id"]: task for task in data["tasks"]}
complete = {"COMPLETE", "COMPLETE_WITH_LIMITATION", "SKIPPED_OPTIONAL"}
for task in data["tasks"]:
    if task["status"] in complete:
        continue
    unmet = [
        dep for dep in task["dependencies"] if by_id[dep]["status"] not in complete
    ]
    if unmet:
        continue
    n = int(task["id"][1:])
    matches = list((ROOT / "prompts").glob(f"{n:02d}_*.md"))
    print(f"Next task: {task['id']} — {task['title']}")
    print(f"Owner: {task['owner']}")
    print(f"Prompt: {matches[0] if matches else 'MISSING'}")
    break
else:
    print(
        "No executable incomplete task. Project may be complete or blocked by unmet dependencies."
    )
