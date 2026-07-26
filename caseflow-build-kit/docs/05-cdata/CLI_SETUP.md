# CData CLI Setup — Optional Development-Time Path

CData CLI is a local Java/JDBC-driver tool for schema-aware AI-assisted development. It is separate from Connect AI Developer Edition and from the `cdata-connect-ai` Python SDK.

## Prerequisite

Java 17+:

```bash
java -version
```

## Official installers currently published

Windows PowerShell:

```powershell
irm https://downloads.cdata.com/cdatabuilds/builds/free/cdatacli/install-cdatacli-windows.ps1 | iex
```

macOS:

```bash
curl -fsSL https://downloads.cdata.com/cdatabuilds/builds/free/cdatacli/install-cdatacli-macos.sh | bash
```

Linux:

```bash
curl -fsSL https://downloads.cdata.com/cdatabuilds/builds/free/cdatacli/install-cdatacli-linux.sh | bash
```

Install official coding-agent skills:

```bash
npx skills add CDataSoftware/cli-skills
```

## Example workflow

```bash
cdatacli drivers search --driver "sheets"
cdatacli drivers download --artifact-id googlesheets-jdbc
cdatacli drivers activate "Google Sheets" --name "Tyler Wilhite" --email "YOUR_EMAIL" --trial
cdatacli drivers list
cdatacli connection create --driver "Google Sheets" --name caseflow-crm --connectionstring "AuthScheme=OAuth"
cdatacli metadata tables --connection caseflow-crm --table "%Cases%"
cdatacli metadata columns --connection caseflow-crm --table Cases
cdatacli query sql --connection caseflow-crm --sql "SELECT CaseNumber, Status FROM Cases WHERE CaseNumber = 'CS-2026-1042'"
```

Commands and activation details can change; use current official output. Enter credentials outside an AI session where possible.

## Success definition

T07 succeeds if the CLI discovers and validates at least one synthetic source schema and the result is documented. It may complete with limitation if Java, driver licensing, or OAuth cannot be resolved within the task timebox. It does not block the core product.
