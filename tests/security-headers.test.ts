import { describe, expect, it } from "vitest";

import vercelConfig from "../vercel.json";

import {
  CONTENT_SECURITY_POLICY,
  renderStaticHostHeaders,
  STATIC_SECURITY_HEADERS,
} from "../src/site/securityHeaders";

describe("static-host security policy", () => {
  it("denies framing and inline code while allowing only local runtime assets", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("default-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("script-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("style-src 'self'");
    expect(CONTENT_SECURITY_POLICY).not.toContain("unsafe-eval");
    expect(CONTENT_SECURITY_POLICY).not.toContain("unsafe-inline");
    expect(CONTENT_SECURITY_POLICY).not.toContain("vercel.live");
    expect(STATIC_SECURITY_HEADERS).toMatchObject({
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    });
  });

  it("renders a static-host header manifest from the same preview configuration", () => {
    const manifest = renderStaticHostHeaders();
    for (const [name, value] of Object.entries(STATIC_SECURITY_HEADERS)) {
      expect(manifest).toContain(`${name}: ${value}`);
    }
  });

  it("keeps the Vercel edge policy synchronized with the typed header source", () => {
    const wildcardRule = vercelConfig.headers.find((rule) => rule.source === "/(.*)");
    if (!wildcardRule) throw new Error("The Vercel wildcard security-header rule is missing.");

    const configuredHeaders = Object.fromEntries(
      wildcardRule.headers.map(({ key, value }) => [key, value]),
    );
    expect(configuredHeaders).toEqual(STATIC_SECURITY_HEADERS);
  });

  it("caches only Vite-hashed assets immutably", () => {
    const immutableRule = vercelConfig.headers.find(
      (rule) => rule.source === "/assets/immutable/(.*)",
    );
    expect(immutableRule?.headers).toContainEqual({
      key: "Cache-Control",
      value: "public, max-age=31536000, immutable",
    });

    const wildcardRule = vercelConfig.headers.find((rule) => rule.source === "/(.*)");
    expect(wildcardRule?.headers.some(({ key }) => key === "Cache-Control")).toBe(false);
  });
});
