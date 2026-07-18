import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const deploymentBaseUrl = process.env.DEPLOYMENT_BASE_URL;
if (!deploymentBaseUrl) {
  throw new Error("DEPLOYMENT_BASE_URL is required for hosted deployment verification.");
}

const deploymentOrigin = new URL(deploymentBaseUrl).origin;
const expectedCanonicalUrl = process.env.EXPECTED_CANONICAL_URL?.replace(/\/+$/, "");
const securityTxtCanonical =
  "https://ai-delivery-workbench-onedermant1-9606-workbench1.vercel.app/.well-known/security.txt";
const privateReportingUrl = "https://github.com/sorren1/AIWorkbench/security/advisories/new";
const securityPolicyUrl = "https://github.com/sorren1/AIWorkbench/security/policy";
const publicHtmlRoutes = [
  "/",
  "/demo/",
  "/writing/governing-ai-assisted-delivery/",
  "/404.html",
] as const;

function expectFinalCsp(headers: Readonly<Record<string, string>>, path: string): void {
  const policy = headers["content-security-policy"] ?? "";
  expect(policy, `${path} should deny framing`).toContain("frame-ancestors 'none'");
  expect(policy, `${path} should retain same-origin scripts`).toContain("script-src 'self'");
  expect(policy, `${path} should retain same-origin styles`).toContain("style-src 'self'");
  expect(policy, `${path} should not allow inline styles`).not.toContain("unsafe-inline");
  expect(policy, `${path} should not allow Vercel Toolbar origins`).not.toContain("vercel.live");
}

function securityTxtFields(contents: string): ReadonlyMap<string, readonly string[]> {
  const fields = new Map<string, string[]>();
  for (const line of contents.split(/\r?\n/u)) {
    if (!line || line.startsWith("#")) continue;
    const separator = line.indexOf(":");
    expect(separator, `Malformed security.txt line: ${line}`).toBeGreaterThan(0);
    const name = line.slice(0, separator);
    const value = line.slice(separator + 1).trim();
    fields.set(name, [...(fields.get(name) ?? []), value]);
  }
  return fields;
}

test("serves every public route directly and uses the custom 404", async ({ request }) => {
  for (const path of publicHtmlRoutes) {
    const response = await request.get(path);
    expect(response.status(), `${path} should resolve directly`).toBe(200);
  }

  const notFound = await request.get("/deployment-verification-missing-route");
  expect(notFound.status()).toBe(404);
  await expect(notFound.text()).resolves.toContain("Page not found");
});

test("ordinary deployment requests have no toolbar injection and satisfy CSP on every route", async ({
  page,
  request,
}) => {
  const externalRequests = new Set<string>();
  const cspViolations: string[] = [];
  page.on("request", (browserRequest) => {
    const requestOrigin = new URL(browserRequest.url()).origin;
    if (requestOrigin !== deploymentOrigin) externalRequests.add(requestOrigin);
  });
  page.on("console", (message) => {
    if (
      /content security policy|violates the following.*style-src|refused to apply inline style/iu.test(
        message.text(),
      )
    ) {
      cspViolations.push(message.text());
    }
  });

  for (const path of publicHtmlRoutes) {
    const response = await request.get(path);
    expect(response.status(), `${path} should load without a toolbar-skip header`).toBe(200);
    expectFinalCsp(response.headers(), path);
    const html = await response.text();
    expect(html).not.toMatch(/vercel\.live|vercel-toolbar|__VERCEL_TOOLBAR/iu);

    const navigation = await page.goto(path);
    expect(navigation).not.toBeNull();
    expectFinalCsp(navigation?.headers() ?? {}, path);
    await expect(page.locator("[style]")).toHaveCount(0);
    await expect(page.locator("style")).toHaveCount(0);
  }

  expect([...externalRequests]).toEqual([]);
  expect(cspViolations).toEqual([]);
});

test("the explicit toolbar-skip request path remains independently verified", async ({
  request,
}) => {
  for (const path of publicHtmlRoutes) {
    const response = await request.get(path, {
      headers: { "x-vercel-skip-toolbar": "1" },
    });
    expect(response.status(), `${path} should load with the documented skip header`).toBe(200);
    expectFinalCsp(response.headers(), path);
    expect(await response.text()).not.toMatch(/vercel\.live|vercel-toolbar|__VERCEL_TOOLBAR/iu);
  }
});

test("publishes a current RFC 9116 security.txt with private reporting", async ({ request }) => {
  const response = await request.get("/.well-known/security.txt");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toMatch(/^text\/plain(?:;\s*charset=utf-8)?$/iu);

  const contents = await response.text();
  const fields = securityTxtFields(contents);
  expect(fields.get("Canonical")).toEqual([securityTxtCanonical]);
  expect(fields.get("Contact")).toEqual([privateReportingUrl]);
  expect(fields.get("Policy")).toEqual([securityPolicyUrl]);
  expect(fields.get("Preferred-Languages")).toEqual(["en"]);
  expect(fields.get("Expires")).toHaveLength(1);

  const expires = Date.parse(fields.get("Expires")?.[0] ?? "");
  expect(expires).not.toBeNaN();
  expect(expires).toBeGreaterThan(Date.now());
  expect(expires).toBeLessThanOrEqual(Date.now() + 366 * 24 * 60 * 60 * 1000);
  expect(contents).not.toContain("mailto:");
});

test("applies security headers and the intended static cache policy", async ({ page, request }) => {
  const htmlResponse = await request.get("/");
  expectFinalCsp(htmlResponse.headers(), "/");
  expect(htmlResponse.headers()["content-security-policy"]).toContain("default-src 'self'");
  expect(htmlResponse.headers()["referrer-policy"]).toBe("no-referrer");
  expect(htmlResponse.headers()["x-content-type-options"]).toBe("nosniff");
  expect(htmlResponse.headers()["permissions-policy"]).toContain("camera=()");
  expect(htmlResponse.headers()["cache-control"]).toContain("max-age=0");
  expect(htmlResponse.headers()["cache-control"]).toContain("must-revalidate");

  await page.goto("/demo/");
  const stylesheet = await page.locator('link[rel="stylesheet"]').first().getAttribute("href");
  if (!stylesheet) throw new Error("The demo stylesheet was not emitted.");
  const stylesheetUrl = new URL(stylesheet, page.url());
  expect(stylesheetUrl.pathname).toContain("/assets/immutable/");
  const assetResponse = await request.get(stylesheetUrl.toString());
  expect(assetResponse.headers()["cache-control"]).toContain("max-age=31536000");
  expect(assetResponse.headers()["cache-control"]).toContain("immutable");
});

test("emits canonical metadata only for the configured production domain", async ({
  page,
  request,
}) => {
  await page.goto("/");
  const canonical = page.locator('link[rel="canonical"]');
  const robots = await (await request.get("/robots.txt")).text();
  const sitemap = await (await request.get("/sitemap.xml")).text();

  if (expectedCanonicalUrl) {
    await expect(canonical).toHaveAttribute("href", `${expectedCanonicalUrl}/`);
    expect(robots).toContain(`Sitemap: ${expectedCanonicalUrl}/sitemap.xml`);
    expect(sitemap).toContain(`<loc>${expectedCanonicalUrl}/demo/</loc>`);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      `${expectedCanonicalUrl}/assets/social-card.png`,
    );
  } else {
    await expect(canonical).toHaveCount(0);
    expect(robots).not.toContain("Sitemap:");
    expect(sitemap).not.toContain("<loc>");
  }
});

test("has no serious accessibility findings or unintended runtime origins", async ({ page }) => {
  const externalRequests = new Set<string>();
  page.on("request", (request) => {
    const requestOrigin = new URL(request.url()).origin;
    if (requestOrigin !== deploymentOrigin) externalRequests.add(requestOrigin);
  });

  for (const path of ["/", "/demo/?screen=work-queue"]) {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).analyze();
    expect(
      results.violations.filter(({ impact }) => impact === "critical" || impact === "serious"),
    ).toEqual([]);
  }

  expect([...externalRequests]).toEqual([]);
});

test("publishes the configured source link without an unsafe opener", async ({ page }) => {
  await page.goto("/");
  const sourceLink = page.locator('a[href="https://github.com/sorren1/AIWorkbench"]').first();
  await expect(sourceLink).toBeVisible();
  if ((await sourceLink.getAttribute("target")) === "_blank") {
    expect((await sourceLink.getAttribute("rel"))?.split(/\s+/)).toEqual(
      expect.arrayContaining(["noopener", "noreferrer"]),
    );
  }
});
