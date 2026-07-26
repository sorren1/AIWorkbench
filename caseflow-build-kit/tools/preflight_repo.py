#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path

KIT = Path(__file__).resolve().parents[1]
REPO = KIT.parent


def run(*args: str) -> dict[str, object]:
    try:
        # Callers provide fixed executable/argument tuples; no shell or user input is used.
        p = subprocess.run(  # noqa: S603
            args,
            cwd=REPO,
            text=True,
            capture_output=True,
            timeout=30,
            check=False,
        )
        return {
            "command": " ".join(args),
            "returncode": p.returncode,
            "stdout": p.stdout.strip(),
            "stderr": p.stderr.strip(),
        }
    except Exception as exc:
        return {"command": " ".join(args), "error": str(exc)}


result = {
    "repo": str(REPO),
    "files": {
        "package.json": (REPO / "package.json").exists(),
        "vite.config.ts": (REPO / "vite.config.ts").exists(),
        "vercel.json": (REPO / "vercel.json").exists(),
        "src/site/vitePlugin.ts": (REPO / "src/site/vitePlugin.ts").exists(),
    },
    "git": [
        run("git", "status", "--short"),
        run("git", "rev-parse", "HEAD"),
        run("git", "remote", "-v"),
    ],
    "versions": [
        run("node", "--version"),
        run("npm", "--version"),
        run("python", "--version"),
    ],
}
print(json.dumps(result, indent=2))
