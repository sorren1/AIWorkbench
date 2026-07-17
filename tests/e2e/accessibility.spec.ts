import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "./fixtures";

test.describe.configure({ timeout: 90_000 });

async function expectNoSeriousViolations(page: Page, context: string) {
  const results = await new AxeBuilder({ page }).analyze();
  const blocking = results.violations.filter(
    (violation) => violation.impact === "critical" || violation.impact === "serious",
  );
  expect(
    blocking.length,
    `${context}: ${blocking
      .map(
        (violation) =>
          `${violation.id}: ${violation.help} (${violation.nodes
            .map(
              (node) =>
                `${node.target.join(" ")} ${node.any.map((check) => JSON.stringify(check.data)).join(" ")}`,
            )
            .join(", ")})`,
      )
      .join("; ")}`,
  ).toBe(0);
}

test("case study and technical article have no serious or critical axe violations", async ({
  page,
}) => {
  await page.goto("/");
  await expectNoSeriousViolations(page, "case study");

  await page.goto("/writing/governing-ai-assisted-delivery/");
  await expectNoSeriousViolations(page, "technical article");
});

test("principal workbench screens have no serious or critical axe violations", async ({ page }) => {
  await page.goto("/demo/");
  await expectNoSeriousViolations(page, "Work Queue");

  const screens = [
    "Issue Detail",
    "Artifacts",
    "GitHub / PR",
    "Validation Evidence",
    "Architecture",
    "Settings",
  ] as const;

  for (const screen of screens) {
    await page.locator(".wb-nav-item").filter({ hasText: screen }).click();
    await expectNoSeriousViolations(page, screen);
  }

  await page.getByRole("button", { name: "Switch to dark" }).click();
  await page.waitForTimeout(250);
  await expectNoSeriousViolations(page, "Settings dark theme");
});

test("modal and drawer surfaces have no serious or critical axe violations", async ({ page }) => {
  await page.goto("/demo/");
  await page.getByRole("button", { name: "About AI Delivery Workbench" }).click();
  await expect(page.getByRole("dialog", { name: "About AI Delivery Workbench" })).toBeVisible();
  await expectNoSeriousViolations(page, "About dialog");
  await page.keyboard.press("Escape");

  await page.getByRole("button", { name: "Issue Detail", exact: true }).click();
  const logsButton = page.getByRole("button", { name: "View logs" }).first();
  await expect(logsButton).toBeVisible();
  await logsButton.click();
  await expect(page.getByRole("dialog", { name: /Run logs/ })).toBeVisible();
  await expectNoSeriousViolations(page, "Run logs drawer");
});
