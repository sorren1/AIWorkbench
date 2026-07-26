# Assumptions and Validation Triggers

| Assumption | Classification | Validation trigger | Owner | Fallback |
|---|---|---|---|---|
| The host repository remains `sorren1/AIWorkbench` with Vite/Vercel multi-page output | Current assumption | T01 repository inspection | Codex | Adapt integration plan and record decision |
| Direct public route is `/caseflow/` | Hard constraint | T00 confirmation | Human | Choose once before implementation |
| Existing site will not link to CaseFlow | Hard constraint | Browser/link tests | Codex | Fail release |
| Developer Edition permits three selected baseline connections | Hypothesis | T03 account probe | Human + Codex | Use available connectors or official mock server |
| Query and Management MCP endpoints match public docs | Hypothesis | T05 authenticated tools/list | Codex | Record current endpoint from account docs |
| Python SDK package is compatible with project Python version | Hypothesis | T04 install/test | Codex | Pin compatible Python or SDK version |
| One safe synthetic write target can be created | Preference | T25 human approval | Human | Record read-only live evidence; replay writes locally |
| Interview order remains Nick → technical leads → Meera → Raviv | Current process info | Recruiter update | Human | Stage pages remain independently useful |
| Vercel remains the deployment platform | Hard preference | T26 | Human | Static-host adaptation must preserve direct routes |
