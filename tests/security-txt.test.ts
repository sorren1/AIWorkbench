import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { createSiteConfig } from "../src/site/config";
import { createSecurityTxt } from "../src/site/securityTxt";
import vercelConfig from "../vercel.json";

const root = resolve(import.meta.dirname, "..");
const securityTxtSourcePath = resolve(root, "src/site/security.txt");
const requiredFields = ["Contact", "Policy", "Preferred-Languages", "Expires"];
const configuredCanonicalOrigin = "https://workbench.example.net";

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
  it("preserves the disclosure fields and omits Canonical when the origin is unset", async () => {
    const source = await readFile(securityTxtSourcePath, "utf8");
    const contents = createSecurityTxt(createSiteConfig({}), source);
    const fields = parse(contents);
    for (const name of requiredFields) expect(fields.get(name), name).toHaveLength(1);
    expect(fields.has("Canonical")).toBe(false);
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

  it("derives Canonical from an explicit validated site origin", async () => {
    const source = await readFile(securityTxtSourcePath, "utf8");
    const config = createSiteConfig({ SITE_CANONICAL_URL: configuredCanonicalOrigin });
    const fields = parse(createSecurityTxt(config, source));

    expect(fields.get("Canonical")).toEqual([
      `${configuredCanonicalOrigin}/.well-known/security.txt`,
    ]);
  });

  it.each([undefined, "", "   "])(
    "omits Canonical for an unset SITE_CANONICAL_URL value: %s",
    async (canonicalUrl) => {
      const source = await readFile(securityTxtSourcePath, "utf8");
      const config = createSiteConfig({ SITE_CANONICAL_URL: canonicalUrl });
      expect(parse(createSecurityTxt(config, source)).has("Canonical")).toBe(false);
    },
  );

  it.each(["not a URL", "http://workbench.example.net", "https://workbench.example.net?draft=1"])(
    "rejects a malformed or unsafe configured canonical origin: %s",
    (canonicalUrl) => {
      expect(() => createSiteConfig({ SITE_CANONICAL_URL: canonicalUrl })).toThrow();
    },
  );

  it.each(["https://workbench-git-main-example.vercel.app", "https://vercel.app"])(
    "rejects a transient Vercel canonical origin: %s",
    (canonicalUrl) => {
      expect(() => createSiteConfig({ SITE_CANONICAL_URL: canonicalUrl })).toThrow(
        "stable custom domain",
      );
    },
  );

  it("refuses a source template that hardcodes Canonical", () => {
    expect(() =>
      createSecurityTxt(
        createSiteConfig({}),
        "Canonical: https://preview.example/.well-known/security.txt\nPreferred-Languages: en\n",
      ),
    ).toThrow("must not contain a static Canonical field");
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
