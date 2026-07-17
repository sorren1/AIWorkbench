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
