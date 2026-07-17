import { readFile } from "node:fs/promises";
import type { Download } from "@playwright/test";

import { expect, test } from "./fixtures";

async function downloadedText(download: Download) {
  const path = await download.path();
  expect(path).not.toBeNull();
  return readFile(path ?? "", "utf8");
}

test("artifact copy and download perform real browser-local actions", async ({ context, page }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/demo/?screen=artifacts&issue=FIN-1150&artifact=spec.md");
  await expect(page.getByRole("button", { name: /spec\.md/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.getByRole("button", { name: "Copy artifact contents" }).click();
  await expect(page.getByText("Artifact copied", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "# Specification — FIN-1150",
  );

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download synthetic artifact" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("FIN-1150-spec.md");
  expect(await downloadedText(download)).toContain("# Specification — FIN-1150");
});

test("artifact copy reports a browser clipboard failure honestly", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () => Promise.reject(new Error("Synthetic permission denial")),
      },
    });
  });
  await page.goto("/demo/?screen=artifacts&issue=FIN-1150&artifact=spec.md");
  await page.getByRole("button", { name: "Copy artifact contents" }).click();
  await expect(page.getByText("Copy failed", { exact: true })).toBeVisible();
  await expect(page.getByText("Synthetic permission denial", { exact: true })).toBeVisible();
});

test("architecture Markdown and JSON exports contain only public synthetic design content", async ({
  page,
}) => {
  await page.goto("/demo/?screen=architecture");

  for (const [name, filename, expected] of [
    ["Export Markdown", "ai-delivery-workbench-architecture.md", "## Control Plane"],
    ["Export JSON", "ai-delivery-workbench-architecture.json", '"classification"'],
  ] as const) {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(filename);
    expect(await downloadedText(download)).toContain(expected);
  }
});

test("validation JSON and Markdown exports include effective synthetic evidence", async ({
  page,
}) => {
  await page.goto("/demo/?screen=validation&issue=FIN-1150");
  await page.getByLabel("Add a synthetic tester note").fill("Exported browser-local note");
  await page.getByRole("button", { name: "Add note" }).click();

  for (const [name, filename, expected] of [
    ["Export JSON", "FIN-1150-synthetic-validation-evidence.json", '"synthetic_demo_fixture"'],
    [
      "Export Markdown",
      "FIN-1150-synthetic-validation-evidence.md",
      "1 browser-local tester note was excluded",
    ],
  ] as const) {
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(filename);
    expect(await downloadedText(download)).toContain(expected);
  }
});

test("deep links restore screen, issue, artifact, and settings subview after reload", async ({
  page,
}) => {
  await page.goto("/demo/?screen=artifacts&issue=FIN-1150&artifact=spec.md");
  await expect(page.getByRole("heading", { level: 1, name: "Artifacts" })).toBeVisible();
  await expect(page.getByRole("button", { name: /spec\.md/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.reload();
  await expect(page.getByRole("button", { name: /spec\.md/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.goto("/demo/?screen=github&issue=FIN-1077");
  await expect(
    page.getByRole("heading", { level: 1, name: "GitHub / PR readiness" }),
  ).toBeVisible();
  await expect(page.getByLabel("Issue")).toHaveValue("FIN-1077");

  await page.goto("/demo/?screen=settings&view=gov");
  await expect(page.getByRole("tab", { name: "Governance" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await page.reload();
  await expect(page.getByRole("tab", { name: "Governance" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("named synthetic scenarios load deterministic starting views", async ({ page }) => {
  await page.goto("/demo/");
  const scenario = page.getByLabel("Scenario seed");

  await scenario.selectOption("ready-review");
  await expect(
    page.getByRole("heading", { level: 1, name: "GitHub / PR readiness" }),
  ).toBeVisible();
  await expect(page.getByLabel("Issue")).toHaveValue("FIN-1077");

  await page.getByLabel("Scenario seed").selectOption("failed-verification");
  await expect(page.getByRole("heading", { level: 1, name: "Validation Evidence" })).toBeVisible();
  await expect(page.getByLabel("Issue")).toHaveValue("FIN-1301");

  await page.getByLabel("Scenario seed").selectOption("stale-downstream");
  await expect(
    page.getByRole("heading", { level: 1, name: "Report Distribution Permission Review" }),
  ).toBeVisible();

  await page.getByLabel("Scenario seed").selectOption("clean-walkthrough");
  await expect(page.getByRole("heading", { level: 1, name: "Work Queue" })).toBeVisible();
  await page.getByRole("button", { name: "Issue Detail", exact: true }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "AI Variance Commentary Draft" }),
  ).toBeVisible();
});

test("reset requires confirmation and restores the deterministic baseline and theme", async ({
  page,
}) => {
  await page.goto("/demo/?scenario=failed-verification");
  await page.getByRole("button", { name: "Switch to dark" }).click();
  await page
    .getByLabel("View authorization as synthetic persona")
    .selectOption("synthetic-validator");
  await page.getByRole("button", { name: "Reset demo" }).click();
  const dialog = page.getByRole("dialog", { name: "Reset the synthetic demo?" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Keep current state" }).click();
  await expect(page.getByLabel("Scenario seed")).toHaveValue("failed-verification");

  await page.getByRole("button", { name: "Reset demo" }).click();
  await page
    .getByRole("dialog", { name: "Reset the synthetic demo?" })
    .getByRole("button", { name: "Reset demo" })
    .click();
  await expect(page.getByRole("heading", { level: 1, name: "Work Queue" })).toBeVisible();
  await expect(page.getByLabel("Scenario seed")).toHaveValue("baseline");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(page.getByLabel("View authorization as synthetic persona")).toHaveValue(
    "synthetic-code-reviewer",
  );
  expect(new URL(page.url()).searchParams.get("scenario")).toBeNull();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Work Queue" })).toBeVisible();
  await expect(page.getByLabel("Scenario seed")).toHaveValue("baseline");
});

test("versioned local preferences persist and the disclosure keeps writes unambiguous", async ({
  page,
}) => {
  await page.goto("/demo/");
  await expect(page.getByText("Demo mode · Synthetic data · No external writes")).toBeVisible();
  await page.getByRole("button", { name: "Switch to dark" }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("button", { name: "Sync Jira (simulated)" })).toBeVisible();
  await page.getByRole("button", { name: /Open issue FIN-1150/ }).click();
  await expect(page.getByRole("button", { name: "Simulate Verify" }).first()).toBeVisible();
});

test("browser-local workflow decisions mutate the intended state without external writes", async ({
  page,
}) => {
  await page.goto("/demo/?screen=issue&issue=FIN-1150");
  await page.getByRole("button", { name: "Simulate Verify" }).first().click();
  await expect(page.getByRole("button", { name: "Running…", exact: true })).toBeDisabled();
  await expect(page.getByText("Verify simulation complete", { exact: true })).toBeVisible();

  await page.goto("/demo/?screen=artifacts&issue=FIN-1150&artifact=change-targets.json");
  await page.getByRole("button", { name: "Mark demo artifact approved" }).click();
  await expect(page.getByText("Approved", { exact: true }).last()).toBeVisible();
  await page.getByRole("button", { name: "Record demo changes requested" }).click();
  await expect(page.getByText("Changes requested", { exact: true }).last()).toBeVisible();

  await page.goto("/demo/?screen=github&issue=FIN-1077");
  await page.getByRole("button", { name: "Mark demo diff reviewed" }).click();
  const checklist = page.getByRole("checkbox");
  await expect(checklist.first()).toBeChecked();
  await expect(checklist.nth(1)).toBeChecked();
  await checklist.first().uncheck();
  await expect(checklist.first()).not.toBeChecked();
  await expect(checklist.nth(1)).toBeChecked();
  await page.getByRole("button", { name: "Request validation approval" }).click();
  await expect(page.getByText("Complete the demo checklist", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "GitHub / PR readiness" }),
  ).toBeVisible();
  await checklist.first().check();
  await page.getByRole("button", { name: "Request validation approval" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Approval Inbox" })).toBeVisible();
  await page
    .getByLabel("View authorization as synthetic persona")
    .selectOption("synthetic-validator");
  await page.getByLabel("Decision reason").fill("Synthetic evidence and tested commit reviewed.");
  await page.getByRole("button", { name: "Approve bound request" }).click();
  await page.getByRole("button", { name: "Resume bound local action" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Validation Evidence" })).toBeVisible();

  await page.goto("/demo/?screen=validation&issue=FIN-1234");
  await page.getByRole("button", { name: "Start demo validation" }).click();
  await expect(page.getByText("In Progress", { exact: true }).first()).toBeVisible();
  await page.getByRole("button", { name: "Mark scenario passed" }).click();
  await page.getByRole("button", { name: "Mark demo evidence complete" }).click();
  await expect(page.getByText("Bound release approval required", { exact: true })).toBeVisible();

  await page.goto("/demo/?screen=github&issue=FIN-1113");
  await page.getByRole("button", { name: "Create mock PR" }).click();
  await expect(page.getByText("Synthetic PR #284", { exact: true })).toBeVisible();

  await page.goto("/demo/?screen=settings&view=github");
  await page.getByRole("button", { name: "Validate branch pattern locally" }).click();
  await expect(page.getByText("Branch pattern valid", { exact: true })).toBeVisible();
});

test("simulated upstream redo invalidates existing downstream state", async ({ page }) => {
  await page.goto("/demo/?screen=issue&issue=FIN-1150");
  await page.locator(".wb-tl-card-head").filter({ hasText: "Plan" }).click();
  await page.getByRole("button", { name: "Simulate redo of Plan" }).click();
  await page
    .getByRole("dialog", { name: "Redo Plan?" })
    .getByRole("button", { name: "Simulate redo & mark downstream stale" })
    .click();
  await expect(page.getByText("Downstream marked stale", { exact: true })).toBeVisible();
  await expect(
    page.locator(".wb-tl-card-head").filter({ hasText: /Implement.*Stale/ }),
  ).toBeVisible();
  await expect(page.locator(".wb-tl-card-head").filter({ hasText: /Verify.*Stale/ })).toBeVisible();
});
