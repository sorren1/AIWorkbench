import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import vercelConfig from "../vercel.json";

const root = resolve(import.meta.dirname, "..");
const securityTxtPath = resolve(root, "public/.well-known/security.txt");
const requiredFields = ["Canonical", "Contact", "Policy", "Preferred-Languages", "Expires"];

function parse(contents: string): ReadonlyMap<string, readonly string[]> {
  const fields = new Map<string, string[]>();
  for (const line of contents.split(/\r?\n/u)) {
    if (!line || line.startsWith("#")) continue;
    const match = /^([A-Za-z-]+):\s+(.+)$/u.exec(line);
    if (!match?.[1] || !match[2]) throw new Error(`Malformed security.txt line: ${line}`);
    fields.set(match[1], [...(fields.get(match[1]) ?? []), match[2]]);
  }
  return fields;
}

describe("RFC 9116 deployment contract", () => {
  it("publishes one current value for every required field without a personal address", async () => {
    const contents = await readFile(securityTxtPath, "utf8");
    const fields = parse(contents);
    for (const name of requiredFields) expect(fields.get(name), name).toHaveLength(1);
    expect(fields.get("Canonical")?.[0]).toBe(
      "https://ai-delivery-workbench-onedermant1-9606-workbench1.vercel.app/.well-known/security.txt",
    );
    expect(fields.get("Contact")?.[0]).toBe(
      "https://github.com/sorren1/AIWorkbench/security/advisories/new",
    );
    expect(fields.get("Policy")?.[0]).toBe(
      "https://github.com/sorren1/AIWorkbench/security/policy",
    );
    expect(fields.get("Preferred-Languages")?.[0]).toBe("en");
    expect(contents).not.toMatch(/mailto:|@[A-Za-z0-9.-]+/u);

    const expires = Date.parse(fields.get("Expires")?.[0] ?? "");
    expect(expires).not.toBeNaN();
    expect(expires).toBeGreaterThan(Date.now());
    expect(expires).toBeLessThanOrEqual(Date.now() + 366 * 24 * 60 * 60 * 1000);
  });

  it("declares the edge MIME type explicitly", () => {
    const rule = vercelConfig.headers.find(
      (candidate) => candidate.source === "/.well-known/security.txt",
    );
    expect(rule?.headers).toContainEqual({
      key: "Content-Type",
      value: "text/plain; charset=utf-8",
    });
  });
});
