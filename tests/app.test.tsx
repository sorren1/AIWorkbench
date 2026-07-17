import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { App } from "../src/demo/App";
import { AppProvider } from "../src/demo/state/store";

describe("workbench application", () => {
  it("renders the queue and navigates through the primary workflow screens", () => {
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
  });
});
