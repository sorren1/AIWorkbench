import { expect, test } from "./fixtures";

test("production preview applies the static-host security policy without CSP violations", async ({
  page,
}) => {
  const response = await page.goto("/");
  expect(response).not.toBeNull();
  const headers = response?.headers() ?? {};
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("script-src 'self'");
  expect(headers["content-security-policy"]).not.toContain("unsafe-eval");
  expect(headers["referrer-policy"]).toBe("no-referrer");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["permissions-policy"]).toContain("camera=()");
  await expect(
    page.getByRole("heading", { level: 1, name: "AI Delivery Workbench" }),
  ).toBeVisible();
});

test("public and demo routes make no external runtime requests", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") external.push(`${request.resourceType()}: ${url.origin}`);
  });
  await page.goto("/");
  await page.goto("/demo/");
  await expect(page.getByRole("heading", { level: 1, name: "Work Queue" })).toBeVisible();
  expect(external).toEqual([]);
});

test("public supply-chain claims never reuse evidence from an older code state", async ({
  page,
}) => {
  await page.goto("/#security-evidence");
  const section = page.getByRole("region", { name: "Security and supply-chain evidence" });
  await expect(section).toBeVisible();
  const summaryResponse = await page.request.get("/security/release-summary.json");
  const summaryContentType = summaryResponse.headers()["content-type"] ?? "";
  if (!summaryContentType.includes("application/json")) {
    await expect(
      section.getByText("No successful supply-chain validation summary is checked in"),
    ).toBeVisible();
    await expect(section.getByText("Tracked files and Git history secret scan")).toHaveCount(0);
    return;
  }

  expect(summaryResponse.ok()).toBe(true);
  await expect(section.getByText("Tracked files and Git history secret scan")).toBeVisible();
  await expect(section.getByText("Audited commit")).toBeVisible();
  await expect(section.getByText("Hosted run")).toBeVisible();
  await expect(section.getByText("Configured · not validated")).toHaveCount(0);
  await expect(
    section.getByText("Active suppressions").locator("..").getByText("15"),
  ).toBeVisible();
  await expect(section.getByText("PostgreSQL database")).toBeVisible();
  await expect(section.getByText("LiteLLM gateway")).toBeVisible();
});
