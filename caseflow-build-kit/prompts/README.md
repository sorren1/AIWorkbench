# How to Run the Serial Prompts

1. Start at `00_bootstrap_operator_decisions.md`.
2. Copy the entire prompt into the named executor session.
3. Keep the agent working in the repository root with this kit present.
4. Require the agent to stop after its completion protocol.
5. Review the completion report and status before running `tools/next_task.py`.
6. Never combine Claude Design tasks with Codex implementation tasks in one prompt.
7. Never paste credentials or raw live evidence into a prompt.
8. If a task completes with limitation, confirm the documented fallback still satisfies all dependent tasks.

The prompt order is intentionally front-loaded with architecture and CData spikes. Skipping them increases the chance of a polished interface built on false assumptions.
