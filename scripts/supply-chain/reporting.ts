import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

import type { SarifFinding } from "./contracts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function sha256File(path: string): Promise<string> {
  return createHash("sha256")
    .update(await readFile(path))
    .digest("hex");
}

export function sha256Text(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function createSarif(tool: {
  readonly name: string;
  readonly version: string;
  readonly informationUri?: string;
  readonly findings: readonly SarifFinding[];
}): JsonRecord {
  const rules = [...new Set(tool.findings.map((finding) => finding.ruleId))]
    .sort()
    .map((id) => ({ id, name: id }));
  return {
    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: tool.name,
            version: tool.version,
            ...(tool.informationUri ? { informationUri: tool.informationUri } : {}),
            rules,
          },
        },
        results: tool.findings.map((finding) => ({
          ruleId: finding.ruleId,
          level: finding.level,
          message: { text: finding.message },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: finding.path.replaceAll("\\", "/") },
                ...(finding.line
                  ? {
                      region: {
                        startLine: finding.line,
                        ...(finding.column ? { startColumn: finding.column } : {}),
                      },
                    }
                  : {}),
              },
            },
          ],
        })),
      },
    ],
  };
}

function removeSensitiveSarifFields(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(removeSensitiveSarifFields);
  if (!isRecord(value)) return value;
  const clean: JsonRecord = {};
  for (const [key, child] of Object.entries(value)) {
    if (["contents", "snippet", "fixes", "attachments"].includes(key)) continue;
    clean[key] = removeSensitiveSarifFields(child);
  }
  return clean;
}

export async function sanitizeSarif(path: string): Promise<void> {
  const parsed: unknown = JSON.parse(await readFile(path, "utf8"));
  await writeJson(path, removeSensitiveSarifFields(parsed));
}

export function sarifFindings(value: unknown, defaultPath: string): SarifFinding[] {
  if (!isRecord(value) || !Array.isArray(value.runs)) return [];
  const findings: SarifFinding[] = [];
  for (const run of value.runs) {
    if (!isRecord(run) || !Array.isArray(run.results)) continue;
    for (const result of run.results) {
      if (!isRecord(result)) continue;
      const ruleId = typeof result.ruleId === "string" ? result.ruleId : "unknown-rule";
      const level = ["none", "note", "warning", "error"].includes(String(result.level))
        ? (String(result.level) as SarifFinding["level"])
        : "warning";
      const messageValue = isRecord(result.message) ? result.message.text : undefined;
      const locations = Array.isArray(result.locations) ? result.locations : [];
      const firstLocation = locations.find(isRecord);
      const physical =
        firstLocation && isRecord(firstLocation.physicalLocation)
          ? firstLocation.physicalLocation
          : undefined;
      const artifact =
        physical && isRecord(physical.artifactLocation) ? physical.artifactLocation : undefined;
      const region = physical && isRecord(physical.region) ? physical.region : undefined;
      findings.push({
        ruleId,
        level,
        message: typeof messageValue === "string" ? messageValue : ruleId,
        path: typeof artifact?.uri === "string" ? artifact.uri : defaultPath,
        ...(typeof region?.startLine === "number" ? { line: region.startLine } : {}),
        ...(typeof region?.startColumn === "number" ? { column: region.startColumn } : {}),
      });
    }
  }
  return findings;
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
