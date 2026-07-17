import { expect, test } from "./fixtures";

const REVIEW_REASON = "Reviewed bounded synthetic diff and allow-listed path.";

test("the full seven-minute principal path follows one deterministic control and evidence chain", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "AI Delivery Workbench" }),
  ).toBeVisible();
  await expect(
    page.getByText(
      "A governed, human-in-the-loop control plane for AI-assisted software delivery.",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(page.getByText("Functional here", { exact: true })).toBeVisible();
  await expect(page.getByText("Simulated here", { exact: true })).toBeVisible();

  await page
    .getByRole("link", { name: /Start principal walkthrough/ })
    .first()
    .click();
  const tour = page.locator(".wb-walkthrough");
  const next = page.getByRole("button", { name: "Next", exact: true });
  await expect(tour).toHaveAttribute("data-tour-step", "thesis");
  await expect(page.getByText("Issue + stage", { exact: true })).toBeVisible();

  await next.click();
  await expect(tour).toHaveAttribute("data-tour-step", "workflow");
  await expect(page).toHaveURL(/tourStep=workflow/);
  await expect(page.getByText("FIN-1077", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "AI delivery workflow" })).toBeVisible();
  await expect(page.getByText("Seed", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("PR Review", { exact: true }).last()).toBeVisible();

  await next.click();
  await expect(tour).toHaveAttribute("data-tour-step", "capabilities");
  await expect(page.getByRole("heading", { level: 2, name: "Implementation Agent" })).toBeVisible();
  await expect(
    page.getByText("Model: model.policy.delivery-balanced", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Context policy: memory.policy.implementation-episodic", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: /Tools/ }).click();
  await page.getByRole("button", { name: /Controlled patch application/ }).click();
  await expect(page.getByText("Risk: HIGH", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Approval: policy.write.approved-targets", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("src/**", { exact: true }).last()).toBeVisible();

  await next.click();
  await expect(tour).toHaveAttribute("data-tour-step", "context-manifest");
  await expect(page.getByRole("heading", { level: 3, name: "Context Manifest" })).toBeVisible();
  await expect(page.getByText(/Included records and selection reasons/)).toBeVisible();
  await expect(page.getByText(/Excluded candidates and rationale/)).toBeVisible();
  await expect(page.getByText("Digest bound", { exact: true })).toBeVisible();
  await expect(page.getByText(/Token count is an honest estimate/)).toBeVisible();

  await next.click();
  await expect(tour).toHaveAttribute("data-tour-step", "sandbox-replay");
  await expect(page.getByRole("heading", { level: 1, name: "Run Trace" })).toBeVisible();
  await expect(tour).toContainText("LOCAL_DOCKER");
  await expect(tour).toContainText("e4ded3e4737def137c989f625c57c14f2163d89c");

  await next.click();
  await expect(tour).toHaveAttribute("data-tour-step", "approval-pause");
  await page.getByRole("button", { name: "Create high-risk approval replay" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Approval Inbox" })).toBeVisible();
  await expect(
    page.locator("#workbench-main").getByText("WAITING_FOR_APPROVAL", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("tool.repository.patch.controlled", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("src/report.js", { exact: true })).toBeVisible();
  await expect(page.getByText("Synthetic proposed diff replay", { exact: true })).toBeVisible();
  await expect(page.getByText("SELF_APPROVAL_FORBIDDEN", { exact: true })).toBeVisible();

  await next.click();
  await expect(tour).toHaveAttribute("data-tour-step", "reviewer-decision");
  await page
    .getByLabel("View authorization as synthetic persona")
    .selectOption("synthetic-code-reviewer");
  await expect(page.getByText("Persona satisfies approver policy", { exact: true })).toBeVisible();
  await page.getByLabel("Decision reason").fill(REVIEW_REASON);
  await page.getByRole("button", { name: "Approve bound request" }).click();
  await expect(
    page
      .locator(".wb-badge")
      .filter({ hasText: /^APPROVED$/ })
      .first(),
  ).toBeVisible();
  await expect(page.getByText(`Decision by Code Reviewer: ${REVIEW_REASON}`)).toBeVisible();

  await next.click();
  await expect(tour).toHaveAttribute("data-tour-step", "duty-boundaries");
  await expect(page.getByText("SELF_APPROVAL_FORBIDDEN", { exact: true })).toBeVisible();
  await expect(page.getByText("PERSONA_NOT_ALLOWED", { exact: true })).toBeVisible();
  await expect(page.getByText("ELIGIBLE_DISTINCT_REVIEWER", { exact: true })).toBeVisible();

  await next.click();
  await expect(tour).toHaveAttribute("data-tour-step", "evidence-bundle");
  await page.getByRole("button", { name: "Resume replay into recorded evidence" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Run Trace" })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Recorded evidence bundle" }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Evidence JSON" })).toBeVisible();
  await expect(page.getByText(/preapproved synthetic fixture/i).first()).toBeVisible();

  await next.click();
  await expect(tour).toHaveAttribute("data-tour-step", "trace-budgets");
  for (const spanName of [
    "agent.invoke",
    "tool.call",
    "approval.wait",
    "sandbox.execute",
    "validation.command",
    "evidence.finalize",
  ]) {
    await expect(
      page.getByText(new RegExp(`^${spanName.replace(".", "\\.")}`)).first(),
    ).toBeVisible();
  }
  await expect(page.getByText("$0", { exact: true })).toBeVisible();
  await expect(page.getByText("Exact zero | no model used", { exact: true })).toBeVisible();

  await next.click();
  await expect(tour).toHaveAttribute("data-tour-step", "readiness-gates");
  await expect(
    page.getByRole("heading", { level: 1, name: "GitHub / PR readiness" }),
  ).toBeVisible();
  await expect(page.getByText("Synthetic merge readiness", { exact: true })).toBeVisible();
  await expect(page.getByText(/All actions update local state only/)).toBeVisible();

  await next.click();
  await expect(tour).toHaveAttribute("data-tour-step", "boundaries-provenance");
  await expect(page.getByRole("heading", { level: 1, name: "Architecture" })).toBeVisible();
  await expect(page.getByRole("link", { name: "productionization boundaries" })).toBeVisible();
  await expect(page.getByRole("link", { name: "clean-room/provenance statement" })).toBeVisible();
  await page.getByRole("button", { name: "Finish", exact: true }).click();
  await expect(tour).toBeHidden();
});
