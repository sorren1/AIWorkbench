import { expect, test } from "./fixtures";

const caseStudyWidths = [320, 375, 768, 1024, 1440] as const;

for (const width of caseStudyWidths) {
  test(`case study has no page-level horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: "AI Delivery Workbench" }),
    ).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });
}

for (const width of [320, 375, 768] as const) {
  test(`demo provides the accessible narrow-screen overview at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/demo/");
    await expect(
      page.getByRole("heading", { level: 1, name: "AI Delivery Workbench" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Return to the responsive case study" }),
    ).toBeVisible();
    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  });
}

test("demo remains contained at 1024px and uses the narrow overview at a 200% zoom equivalent", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto("/demo/");
  await expect(page.getByRole("heading", { level: 1, name: "Work Queue" })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(1024);

  await page.setViewportSize({ width: 640, height: 450 });
  await expect(
    page.getByRole("heading", { level: 1, name: "AI Delivery Workbench" }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(640);
});
