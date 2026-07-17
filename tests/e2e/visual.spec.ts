import { expect, test } from "./fixtures";

const captures = [
  { name: "case-study-desktop", path: "/", viewport: { width: 1440, height: 1000 } },
  { name: "case-study-mobile", path: "/", viewport: { width: 375, height: 812 } },
  { name: "work-queue-light", path: "/demo/", viewport: { width: 1440, height: 1000 } },
  {
    name: "control-plane-dark",
    path: "/demo/?screen=control-plane",
    viewport: { width: 1440, height: 1000 },
    dark: true,
  },
] as const;

test("captures controlled principal-screen visual evidence", async ({ page }, testInfo) => {
  for (const capture of captures) {
    await page.setViewportSize(capture.viewport);
    await page.goto(capture.path);
    if ("dark" in capture && capture.dark) {
      await page.getByRole("button", { name: "Switch to dark" }).click();
    }
    await page.addStyleTag({
      content:
        "*,*::before,*::after{animation-duration:0s!important;transition-duration:0s!important;caret-color:transparent!important}",
    });
    await page.evaluate(() => document.fonts.ready);
    const screenshot = await page.screenshot({ fullPage: true, animations: "disabled" });
    expect(screenshot.byteLength).toBeGreaterThan(20_000);
    await testInfo.attach(capture.name, { body: screenshot, contentType: "image/png" });
  }
});
