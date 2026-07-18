import { expect, test } from "./fixtures";

test("recorded Run Trace deep link exposes validated hierarchy, budgets, and evidence bindings", async ({
  page,
}) => {
  await page.goto("/demo/?screen=trace");
  await expect(page.getByRole("heading", { level: 1, name: "Run Trace" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Execution waterfall" })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "delivery.run", exact: true })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "delivery.stage", exact: true })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "agent.invoke", exact: true })).toBeVisible();
  await expect(page.getByRole("rowheader", { name: "approval.wait", exact: true })).toBeVisible();
  await expect(
    page.getByRole("rowheader", { name: "evidence.finalize", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Exact zero | no model used")).toBeVisible();
  await expect(page.getByText("Evidence bindings")).toBeVisible();

  const runHeader = page.getByRole("rowheader", { name: "delivery.run", exact: true });
  const runRow = page.locator("tbody tr").filter({ has: runHeader });
  const details = runRow.locator("summary");
  await details.focus();
  await page.keyboard.press("Enter");
  await expect(runRow.getByText("delivery.run.id", { exact: true })).toBeVisible();

  await page.reload({ waitUntil: "commit" });
  await expect(page.getByRole("heading", { level: 1, name: "Run Trace" })).toBeVisible();
});

test("case study publishes the recorded trace as a read-only validated asset", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.getByText("Trace ID", { exact: true })).toBeVisible();
  const traceLink = page.getByRole("link", { name: "Open normalized trace JSON" });
  await expect(traceLink).toBeVisible();
  const href = await traceLink.getAttribute("href");
  expect(href).toMatch(/^\.\/recorded-evidence\/sandbox-trace-.+\.json$/);
  const response = await request.get(href?.replace(/^\./, "") ?? "");
  expect(response.ok()).toBe(true);
  expect(await response.json()).toEqual(
    expect.objectContaining({
      schemaVersion: 1,
      format: "OTEL_COMPATIBLE_NORMALIZED_JSON",
    }),
  );
});
