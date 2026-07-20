import { expect, test } from "./fixtures";

const publicHtmlRoutes = [
  { path: "/", heading: "Tyler Wilhite" },
  { path: "/workbench/", heading: "AI Delivery Workbench" },
  { path: "/workbench/demo/", heading: "Work Queue" },
  {
    path: "/workbench/writing/governing-ai-assisted-delivery/",
    heading: "Governing AI-assisted delivery",
  },
  { path: "/404.html", heading: "This page is outside the expected change surface." },
] as const;

test("every public HTML route satisfies the final CSP without inline styles", async ({ page }) => {
  const cspViolations: string[] = [];
  page.on("console", (message) => {
    if (
      /content security policy|violates the following.*style-src|refused to apply inline style/iu.test(
        message.text(),
      )
    ) {
      cspViolations.push(message.text());
    }
  });

  for (const route of publicHtmlRoutes) {
    const response = await page.goto(route.path);
    expect(response, `${route.path} should return a document response`).not.toBeNull();
    const headers = response?.headers() ?? {};
    const policy = headers["content-security-policy"] ?? "";
    expect(policy).toContain("frame-ancestors 'none'");
    expect(policy).toContain("script-src 'self'");
    expect(policy).toContain("style-src 'self'");
    expect(policy).not.toContain("unsafe-eval");
    expect(policy).not.toContain("unsafe-inline");
    expect(policy).not.toContain("vercel.live");
    expect(headers["referrer-policy"]).toBe("no-referrer");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["permissions-policy"]).toContain("camera=()");
    await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
    await expect(page.locator("[style]")).toHaveCount(0);
    await expect(page.locator("style")).toHaveCount(0);
    expect(cspViolations, `CSP violations observed after loading ${route.path}`).toEqual([]);
  }
});

test("public routes make no external runtime requests", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1") external.push(`${request.resourceType()}: ${url.origin}`);
  });
  for (const route of publicHtmlRoutes) {
    await page.goto(route.path);
    await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible();
  }
  expect(external).toEqual([]);
});

test("public supply-chain claims never reuse evidence from an older code state", async ({
  page,
}) => {
  await page.goto("/workbench/#security-evidence");
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
