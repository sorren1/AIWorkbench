import { expect, test } from "./fixtures";

test("failed verification blocks the validation-approval path", async ({ page }) => {
  await page.goto("/demo/?screen=github&issue=FIN-1301");
  await page.getByRole("button", { name: "Mark demo diff reviewed" }).click();
  await expect(page.getByText("Diff marked reviewed", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Request validation approval" }).click();
  await expect(page.getByText("Verification must pass", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "GitHub / PR readiness" }),
  ).toBeVisible();
});

test("human review and validation evidence gates produce release readiness", async ({ page }) => {
  await page.goto("/demo/?screen=github&issue=FIN-1077");
  await page.getByRole("button", { name: "Request validation approval" }).click();
  await expect(page.getByText("Review the diff first", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Mark demo diff reviewed" }).click();
  await page.getByRole("button", { name: "Request validation approval" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Approval Inbox" })).toBeVisible();
  await page
    .getByLabel("View authorization as synthetic persona")
    .selectOption("synthetic-validator");
  await page.getByLabel("Decision reason").fill("Synthetic tested commit and evidence reviewed.");
  await page.getByRole("button", { name: "Approve bound request" }).click();
  await page.getByRole("button", { name: "Resume bound local action" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Validation Evidence" })).toBeVisible();

  for (const button of await page.getByRole("button", { name: "Mark scenario passed" }).all()) {
    await button.click();
  }
  await page.getByRole("button", { name: "Mark demo evidence complete" }).click();
  await expect(page.getByText("Evidence marked complete", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: /GitHub \/ PR/ }).click();
  await expect(page.getByText("Ready for merge", { exact: true })).toBeVisible();
  await expect(page.getByText("complete for tested commit", { exact: true })).toBeVisible();
});

test("light and dark themes preserve the principal workflow", async ({ page }) => {
  await page.goto("/demo/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByRole("heading", { level: 1, name: "Work Queue" })).toBeVisible();
  await page.getByRole("button", { name: "Switch to dark" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Architecture", exact: true }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Architecture" })).toBeVisible();
});
