import { expect, test } from "./fixtures";

const publicWidths = [320, 375, 768, 1024, 1280, 1440] as const;
const publicPages = [
  { path: "/", heading: "Tyler Wilhite" },
  { path: "/workbench/", heading: "AI Delivery Workbench" },
  {
    path: "/workbench/writing/governing-ai-assisted-delivery/",
    heading: "Governing AI-assisted delivery",
  },
  { path: "/404.html", heading: "This page is outside the expected change surface." },
] as const;

for (const width of publicWidths) {
  test(`public pages have no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const publicPage of publicPages) {
      await page.goto(publicPage.path);
      await expect(page.getByRole("heading", { level: 1, name: publicPage.heading })).toBeVisible();
      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }));
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
    }
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

test("authored motion respects the operating-system reduction preference", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.goto("/demo/?walkthrough=1");

  expect(await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches)).toBe(
    true,
  );
  expect(
    await page.locator(".wb-walkthrough").evaluate((surface) =>
      Array.from(surface.querySelectorAll<HTMLElement>("*"))
        .map((element) => getComputedStyle(element).transitionDuration)
        .every((duration) =>
          duration
            .split(",")
            .map((value) => Number.parseFloat(value))
            .every((seconds) => seconds <= 0.00001),
        ),
    ),
  ).toBe(true);

  await context.close();
});
