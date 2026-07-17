import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "../src/demo/App";
import { AppProvider } from "../src/demo/state/store";

describe("workbench application", () => {
  it("renders the queue and navigates through the primary workflow screens", async () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );

    expect(
      screen.getByText("A deterministic queue for exploring governed delivery state", {
        exact: false,
      }),
    ).toBeVisible();

    fireEvent.click(screen.getByText("Issue Detail", { selector: ".wb-nav-item span" }));
    expect(screen.getByText("AI delivery workflow")).toBeVisible();

    fireEvent.click(screen.getByText("GitHub / PR", { selector: ".wb-nav-item span" }));
    expect(screen.getByText("Synthetic AI-generated PR summary")).toBeVisible();

    fireEvent.click(screen.getByText("Validation Evidence", { selector: ".wb-nav-item span" }));
    expect(screen.getByText("Acceptance criteria coverage")).toBeVisible();

    fireEvent.click(screen.getByText("Control Plane", { selector: ".wb-nav-item span" }));
    expect(
      await screen.findByRole("heading", { level: 1, name: "Control Plane" }, { timeout: 5_000 }),
    ).toBeVisible();
    expect(screen.getByRole("heading", { level: 2, name: "Intake Agent" })).toBeVisible();
  });

  it("offers a keyboard-operable guided walkthrough that navigates the demo", () => {
    render(
      <AppProvider>
        <App />
      </AppProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Guided tour" }));
    expect(
      screen.getByRole("heading", { name: "Start with governed work, not a blank prompt" }),
    ).toBeVisible();
    expect(screen.getByRole("progressbar", { name: "Walkthrough progress" })).toHaveAttribute(
      "aria-valuenow",
      "1",
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      screen.getByRole("heading", { name: "Follow the eight-stage chain of custody" }),
    ).toBeVisible();
    expect(screen.getByText("AI delivery workflow")).toBeVisible();

    fireEvent.keyDown(document, { key: "Escape" });
    expect(
      screen.queryByRole("progressbar", { name: "Walkthrough progress" }),
    ).not.toBeInTheDocument();
  });
});
