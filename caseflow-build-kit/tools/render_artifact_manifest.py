#!/usr/bin/env python3
from __future__ import annotations

import json
import shutil
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REPOSITORY = ROOT.parent
OUTPUT = ROOT / "project" / "ARTIFACT_MANIFEST.json"
git = shutil.which("git")
if git is None:
    raise RuntimeError("Git is required to render the tracked artifact manifest")

# The argv is fixed and the command does not use a shell or accept user input.
result = subprocess.run(  # noqa: S603
    [git, "ls-files", "--cached", "--", "caseflow-build-kit"],
    cwd=REPOSITORY,
    check=True,
    capture_output=True,
    text=True,
    timeout=30,
)
files = sorted(
    path.removeprefix("caseflow-build-kit/").replace("\\", "/")
    for path in result.stdout.splitlines()
    if path.startswith("caseflow-build-kit/")
)
document = {
    "schemaVersion": "1.1",
    "generatedAt": "2026-07-26",
    "root": "caseflow-build-kit",
    "fileCount": len(files),
    "requiredCore": [
        "START_HERE.md",
        "README.md",
        "AGENTS.md",
        "CLAUDE.md",
        "EXECUTION_ORDER.md",
        "project/MASTER_PLAN.md",
        "project/TASK_REGISTRY.json",
        "project/status.json",
        "project/DEFINITION_OF_DONE.md",
        "reference/OFFICIAL_SOURCE_REGISTER.md",
        "reference/EXISTING_SITE_INSPECTION.md",
        "contracts/openapi/caseflow.openapi.yaml",
        "contracts/tools/tool-registry.json",
        "fixtures/gold-cases/gold-cases.json",
        "tools/validate_kit.py",
        "tools/render_status.py",
        "tools/next_task.py",
    ],
    "requiredDurableTrees": [
        "prompts",
        "contracts",
        "fixtures",
        "templates",
        "project",
        "tools",
    ],
    "files": files,
}
OUTPUT.write_text(
    f"{json.dumps(document, indent=2, ensure_ascii=False)}\n",
    encoding="utf-8",
    newline="\n",
)
print(OUTPUT)
