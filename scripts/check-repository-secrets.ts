import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { extname, resolve } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const root = resolve(import.meta.dirname, "..");
const { stdout } = await execFileAsync("git", ["ls-files", "-z"], {
  cwd: root,
  encoding: "buffer",
  maxBuffer: 10 * 1024 * 1024,
});
const tracked = stdout.toString("utf8").split("\0").filter(Boolean).sort();

const allowedEnvironmentTemplates = new Set([".env.example"]);
const sensitiveExtensions = new Set([".key", ".p12", ".pfx", ".pem"]);
const rules: readonly { readonly name: string; readonly pattern: RegExp }[] = [
  { name: "private key block", pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "AWS access key", pattern: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "GitHub token", pattern: /\bgh[pousr]_[A-Za-z0-9]{30,}\b/ },
  {
    name: "OpenAI-style key",
    pattern: /\bsk-(?![A-Za-z0-9_-]*(?:sentinel|synthetic|example|test))[A-Za-z0-9_-]{20,}\b/,
  },
  {
    name: "E2B key",
    pattern: /\be2b_(?!api_key\b|sandbox_info_and_lifecycle\b)[A-Za-z0-9_-]{20,}\b/i,
  },
  {
    name: "assigned credential value",
    pattern:
      /\b(?:API_KEY|ACCESS_TOKEN|AUTH_TOKEN|CLIENT_SECRET|MASTER_KEY|PASSWORD)\s*[:=]\s*["']?(?!\$\{|<|os\.environ\/|example|replace|your-|test-|synthetic)[A-Za-z0-9/+._-]{16,}/i,
  },
];

const findings: string[] = [];
for (const relative of tracked) {
  const normalized = relative.replaceAll("\\", "/");
  const name = normalized.split("/").at(-1) ?? normalized;
  if (/^\.env(?:\..+)?$/i.test(name) && !allowedEnvironmentTemplates.has(name)) {
    findings.push(`${normalized}: tracked environment file`);
    continue;
  }
  if (sensitiveExtensions.has(extname(name).toLocaleLowerCase())) {
    findings.push(`${normalized}: credential-bearing file extension`);
    continue;
  }
  const contents = await readFile(resolve(root, relative));
  if (contents.includes(0)) continue;
  const text = contents.toString("utf8");
  for (const rule of rules) {
    if (rule.pattern.test(text)) findings.push(`${normalized}: ${rule.name}`);
  }
}

if (findings.length > 0) {
  throw new Error(
    `Repository credential policy failed (values suppressed):\n${findings.join("\n")}`,
  );
}
process.stdout.write(
  `Repository credential policy passed for ${tracked.length} tracked files; values were not logged.\n`,
);
