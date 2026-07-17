import { describe, expect, it } from "vitest";

import {
  CONTENT_SECURITY_POLICY,
  renderStaticHostHeaders,
  STATIC_SECURITY_HEADERS,
} from "../src/site/securityHeaders";

describe("static-host security policy", () => {
  it("denies framing and unsafe script evaluation while allowing only local runtime assets", () => {
    expect(CONTENT_SECURITY_POLICY).toContain("default-src 'self'");
    expect(CONTENT_SECURITY_POLICY).toContain("frame-ancestors 'none'");
    expect(CONTENT_SECURITY_POLICY).toContain("script-src 'self'");
    expect(CONTENT_SECURITY_POLICY).not.toContain("unsafe-eval");
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
});
