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
  for (const path of ["/", "/demo/", "/writing/governing-ai-assisted-delivery/"]) {
    const response = await request.get(path);
    expect(response.status(), `${path} should resolve directly`).toBe(200);
  }

  const notFound = await request.get("/deployment-verification-missing-route");
  expect(notFound.status()).toBe(404);
  await expect(notFound.text()).resolves.toContain("Page not found");
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
  expect(htmlResponse.headers()["content-security-policy"]).toContain("default-src 'self'");
  expect(htmlResponse.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
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
