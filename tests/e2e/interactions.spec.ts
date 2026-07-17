import { expect, test } from "./fixtures";

test("skip links move keyboard focus to each page's main content", async ({
  browserName,
  page,
}) => {
  await page.goto("/");
  const caseStudySkip = page.getByRole("link", { name: "Skip to case study" });
  if (browserName === "webkit") await caseStudySkip.focus();
  else await page.keyboard.press("Tab");
  await expect(caseStudySkip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();

  await page.goto("/demo/");
  const demoSkip = page.getByRole("link", { name: "Skip to main content" });
  if (browserName === "webkit") await demoSkip.focus();
  else await page.keyboard.press("Tab");
  await expect(demoSkip).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("#workbench-main")).toBeFocused();
});

test("queue filters and explicit row actions work from the keyboard", async ({ page }) => {
  await page.goto("/demo/");
  const filter = page.getByRole("button", { name: "Assigned to me" });
  await expect(filter).toHaveAttribute("aria-pressed", "false");
  await filter.focus();
  await page.keyboard.press("Space");
  await expect(filter).toHaveAttribute("aria-pressed", "true");

  const firstRow = page.locator("tbody tr").first();
  await expect(firstRow).toHaveCSS("cursor", "default");
  const issueAction = page.getByRole("button", { name: /Open issue FIN-/ }).first();
  await issueAction.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".wb-tl-card-head").first()).toHaveAttribute("aria-expanded");
});

test("tabs use roving keyboard focus and native switches and checkboxes expose state", async ({
  page,
}) => {
  await page.goto("/demo/");
  await page.getByRole("button", { name: "Settings", exact: true }).click();

  const jiraTab = page.getByRole("tab", { name: "Jira" });
  await jiraTab.focus();
  await page.keyboard.press("ArrowRight");
  const githubTab = page.getByRole("tab", { name: "GitHub" });
  await expect(githubTab).toBeFocused();
  await expect(githubTab).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toHaveAttribute(
    "aria-labelledby",
    "settings-tab-github",
  );

  const aiTab = page.getByRole("tab", { name: "AI Provider" });
  await aiTab.focus();
  await page.keyboard.press("Enter");
  const switches = page.getByRole("switch");
  await expect(switches).toHaveCount(3);
  for (const control of await switches.all()) await expect(control).toBeDisabled();

  const governanceTab = page.getByRole("tab", { name: "Governance" });
  await governanceTab.focus();
  await page.keyboard.press("Enter");
  const governanceCheck = page.getByRole("checkbox", {
    name: "Require human review before PR creation",
  });
  await expect(governanceCheck).toBeChecked();
  await governanceCheck.focus();
  await page.keyboard.press("Space");
  await expect(governanceCheck).not.toBeChecked();
});

test("modal and drawer trap focus, close on Escape, and restore their trigger", async ({
  page,
}) => {
  await page.goto("/demo/");
  const aboutTrigger = page.getByRole("button", { name: "About AI Delivery Workbench" });
  await aboutTrigger.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "About AI Delivery Workbench" });
  await expect(dialog).toBeVisible();
  const closeDialog = page.getByRole("button", { name: "Close dialog" });
  await expect(closeDialog).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Got it" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(aboutTrigger).toBeFocused();

  await page.getByRole("button", { name: "Issue Detail", exact: true }).click();
  const logsTrigger = page.getByRole("button", { name: "View logs" }).first();
  await logsTrigger.focus();
  await page.keyboard.press("Enter");
  const drawer = page.getByRole("dialog", { name: /Run logs/ });
  await expect(drawer).toBeVisible();
  await expect(page.getByRole("button", { name: "Close logs drawer" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(logsTrigger).toBeFocused();
});

test("the complete guided walkthrough advances using only the keyboard", async ({ page }) => {
  await page.goto("/demo/?walkthrough=1");
  const walkthrough = page.locator(".wb-walkthrough");
  await expect(walkthrough).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Open this screen" })).toBeFocused();
  await page.keyboard.press("Tab");
  const next = page.getByRole("button", { name: "Next" });
  await expect(next).toBeFocused();

  for (let step = 2; step <= 8; step += 1) {
    await page.keyboard.press("Enter");
    await expect(page.getByRole("progressbar", { name: "Walkthrough progress" })).toHaveAttribute(
      "aria-valuenow",
      String(step),
    );
  }

  const finish = page.getByRole("button", { name: "Finish" });
  await expect(finish).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(walkthrough).toBeHidden();
  await expect(page.getByRole("heading", { level: 1, name: "Run Trace" })).toBeVisible();
});
