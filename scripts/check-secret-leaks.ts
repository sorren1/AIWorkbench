import { readFile, readdir, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const scanRoots = ["dist", "evidence/generated", "public/capabilities/model-gateway"];
const textExtensions = new Set([".html", ".js", ".css", ".json", ".md", ".txt", ".xml"]);
const credentialPattern =
  /(?:\b(?:sk|e2b)[_-][a-z0-9_-]{12,}|bearer\s+[a-z0-9._-]{12,}|(?:E2B_API_KEY|LITELLM_MASTER_KEY|MODEL_GATEWAY_UPSTREAM_API_KEY)\s*=\s*[^\s"']+)/i;

async function files(path: string): Promise<readonly string[]> {
  const metadata = await stat(path).catch(() => null);
  if (!metadata) return [];
  if (metadata.isFile()) return [path];
  if (!metadata.isDirectory()) return [];
  const names = await readdir(path);
  const nested = await Promise.all(names.sort().map((name) => files(resolve(path, name))));
  return nested.flat();
}

const findings: string[] = [];
for (const scanRoot of scanRoots) {
  for (const path of await files(resolve(root, scanRoot))) {
    if (!textExtensions.has(extname(path).toLocaleLowerCase())) continue;
    const contents = await readFile(path, "utf8");
    if (credentialPattern.test(contents)) findings.push(path.replace(`${root}\\`, ""));
  }
}

if (findings.length > 0) {
  throw new Error(
    `Credential-shaped value found in public/evidence output: ${findings.join(", ")}`,
  );
}
process.stdout.write("No credential-shaped values found in public build or generated evidence.\n");
