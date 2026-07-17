import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { App } from "../src/demo/App";
import { AppProvider } from "../src/demo/state/store";

function renderWorkbench(path = "/demo/") {
  window.history.replaceState(null, "", path);
  return render(
    <AppProvider>
      <App />
    </AppProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/demo/");
});

describe("quality-system component integration", () => {
  it("filters the synthetic queue and clears the filter", () => {
    renderWorkbench();
    const search = screen.getByRole("textbox", { name: "Search synthetic issues" });
    fireEvent.change(search, { target: { value: "FIN-1301" } });
    expect(screen.getByText("1 of 10")).toBeVisible();
    expect(screen.getByRole("button", { name: /Open issue FIN-1301/ })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Clear all queue filters" }));
    expect(screen.getByText("10 of 10")).toBeVisible();
  });

  it("selects and reviews an artifact while retaining the synthetic disclosure", async () => {
    renderWorkbench("/demo/?screen=artifacts&issue=FIN-1150&artifact=spec.md");
    expect(screen.getByText("Demo mode · Synthetic data · No external writes")).toBeVisible();
    const targets = await screen.findByRole("button", { name: /change-targets\.json/ });
    fireEvent.click(targets);
    expect(targets).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Mark demo artifact approved" }));
    expect(screen.getByText("Demo artifact approved", { exact: true })).toBeVisible();
  });

  it("runs a stage action through the typed local state transition", () => {
    renderWorkbench("/demo/?screen=issue&issue=FIN-1150");
    const verifyAction = screen.getAllByRole("button", { name: "Simulate Verify" })[0];
    expect(verifyAction).toBeDefined();
    if (!verifyAction) return;
    fireEvent.click(verifyAction);
    expect(screen.getByRole("button", { name: "Running…" })).toBeDisabled();
    expect(screen.getByText("Simulating Verify…", { exact: true })).toBeVisible();
  });

  it("uses the failed-Verify guard in the approval component", async () => {
    renderWorkbench("/demo/?screen=github&issue=FIN-1301");
    fireEvent.click(screen.getByRole("button", { name: "Mark demo diff reviewed" }));
    await screen.findByText("Diff marked reviewed", { exact: true });
    fireEvent.click(screen.getByRole("button", { name: "Request validation approval" }));
    await screen.findByText("Verification must pass", { exact: true });
    expect(screen.getByRole("heading", { level: 1, name: "GitHub / PR readiness" })).toBeVisible();
  });

  it("invokes an architecture export from the rendered screen", async () => {
    const createObjectUrl = vi.fn(() => "blob:quality-export");
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);
    renderWorkbench("/demo/?screen=architecture");
    fireEvent.click(await screen.findByRole("button", { name: "Export JSON" }));
    await waitFor(() => expect(createObjectUrl).toHaveBeenCalledOnce());
    expect(screen.getByText("Architecture exported", { exact: true })).toBeVisible();
    click.mockRestore();
  });
});
