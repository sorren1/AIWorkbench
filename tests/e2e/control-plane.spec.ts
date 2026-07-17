import { readFile } from "node:fs/promises";
import type { Download } from "@playwright/test";

import { expect, test } from "./fixtures";

async function downloadedText(download: Download): Promise<string> {
  const path = await download.path();
  expect(path).not.toBeNull();
  return readFile(path ?? "", "utf8");
}

test("control-plane deep link exposes searchable versioned registry details", async ({ page }) => {
  await page.goto("/demo/?screen=control-plane");
  await expect(page.getByRole("heading", { level: 1, name: "Control Plane" })).toBeVisible();
  await expect(page.getByText("Functional local registry · no remote agents")).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "Intake Agent" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Control Plane" })).toBeVisible();

  await page.getByRole("tab", { name: /^Tools/ }).click();
  await page.getByLabel("Search this registry view").fill("controlled patch");
  await expect(page.getByText("1 matching record")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 2, name: "Controlled patch application" }),
  ).toBeVisible();
  await expect(page.getByText("Risk: HIGH")).toBeVisible();
  await expect(page.getByText("Network: denied")).toBeVisible();
  const inputSchema = page.locator("details").filter({ hasText: "Input JSON Schema" });
  await inputSchema.getByText("Input JSON Schema", { exact: true }).click();
  await expect(inputSchema.locator("pre")).toContainText('"expected"');

  await page.getByRole("tab", { name: /^Model policies/ }).click();
  await page.getByLabel("Search this registry view").fill("");
  await page.getByLabel("Lifecycle status").selectOption("DRAFT");
  await expect(page.getByRole("heading", { level: 2, name: "Experimental draft" })).toBeVisible();
  await expect(page.getByText("Live execution: disabled")).toBeVisible();
});

test("registry and selected capability records download as deterministic JSON", async ({
  page,
}) => {
  await page.goto("/demo/?screen=control-plane");
  const registryPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export registry JSON" }).click();
  const registryDownload = await registryPromise;
  expect(registryDownload.suggestedFilename()).toBe("ai-delivery-workbench-registry.json");
  const registry: unknown = JSON.parse(await downloadedText(registryDownload));
  expect(registry).toEqual(
    expect.objectContaining({
      schemaVersion: 1,
      classification: "SYNTHETIC_PUBLIC_PORTFOLIO_FIXTURE",
    }),
  );

  const cardPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export JSON", exact: true }).click();
  const cardDownload = await cardPromise;
  expect(cardDownload.suggestedFilename()).toBe("agent.intake-1.0.0.json");
  expect(await downloadedText(cardDownload)).toContain('"contentHash"');
});

test("generated capability cards and local MCP evidence are public static files", async ({
  request,
}) => {
  for (const [path, expected] of [
    ["/capabilities/agents/agent.implementation.json", { kind: "AgentCard" }],
    ["/capabilities/mcp/discovery.json", { schemaVersion: 1 }],
    ["/capabilities/mcp/invocation-evidence.json", { schemaVersion: 1 }],
  ] as const) {
    const response = await request.get(path);
    expect(response.ok(), path).toBe(true);
    const body = (await response.json()) as unknown;
    expect(body).toEqual(expect.objectContaining(expected));
  }
});
