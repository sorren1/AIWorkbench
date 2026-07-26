# Connect AI Skills Setup

Official repository: https://github.com/CDataSoftware/connect-ai-skills

The `connect-ai-base` skill is required alongside connector-specific skills.

Install all skills:

```bash
npx skills add CDataSoftware/connect-ai-skills
```

Or install the baseline skills for this project:

```bash
npx skills add CDataSoftware/connect-ai-skills \
  --skill connect-ai-base \
  --skill connect-ai-googlesheets \
  --skill connect-ai-googledrive
```

Optional enhanced profile:

```bash
npx skills add CDataSoftware/connect-ai-skills \
  --skill connect-ai-base \
  --skill connect-ai-salesforce
```

The repository also includes a Claude Code onboarding skill. Treat skills as development guidance, not runtime dependencies or proof of source access.
