import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.goto("/demo/");
  await page.evaluate(() => localStorage.removeItem("ai-delivery-workbench.authorization.v1"));
});

test("persona policy blocks unauthorized diff review with an explicit reason", async ({ page }) => {
  await page.goto("/demo/?screen=github&issue=FIN-1077");
  await page
    .getByLabel("View authorization as synthetic persona")
    .selectOption("synthetic-implementer");
  await page.getByRole("button", { name: "Mark demo diff reviewed" }).click();
  await expect(page.getByText("Review action blocked", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Missing required scope: diff:review.", { exact: true }).last(),
  ).toBeVisible();
  await expect(page.getByText("Policy enforcement result", { exact: true })).toBeVisible();
});

test("approval inbox persists a bound request and enforces distinct validator approval", async ({
  page,
}) => {
  await page.goto("/demo/?screen=github&issue=FIN-1077");
  await page.getByRole("button", { name: "Mark demo diff reviewed" }).click();
  await page.getByRole("button", { name: "Request validation approval" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Approval Inbox" })).toBeVisible();
  await expect(page.getByText("approval.browser.1", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText("Decision unavailable for this persona", { exact: true }),
  ).toBeVisible();

  await page.reload();
  await expect(page.getByText("approval.browser.1", { exact: true }).first()).toBeVisible();
  await page
    .getByLabel("View authorization as synthetic persona")
    .selectOption("synthetic-validator");
  await page.getByLabel("Decision reason").fill("Synthetic tested commit and evidence reviewed.");
  await page.getByRole("button", { name: "Approve bound request" }).click();
  await expect(
    page
      .locator(".wb-badge")
      .filter({ hasText: /^APPROVED$/ })
      .first(),
  ).toBeVisible();

  await page.reload();
  await expect(
    page
      .locator(".wb-badge")
      .filter({ hasText: /^APPROVED$/ })
      .first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume bound local action" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Validation Evidence" })).toBeVisible();
});

test("platform administrator cannot silently approve a release request", async ({ page }) => {
  await page.goto("/demo/?screen=github&issue=FIN-1077");
  await page.getByRole("button", { name: "Mark demo diff reviewed" }).click();
  await page.getByRole("button", { name: "Request validation approval" }).click();
  await page
    .getByLabel("View authorization as synthetic persona")
    .selectOption("synthetic-platform-admin");
  await expect(
    page.getByText("Decision unavailable for this persona", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Approve bound request" })).toBeDisabled();
  await expect(
    page.getByText("policy.release.validator-approval@1.0.0", { exact: true }),
  ).toBeVisible();
});
