import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import App from "./App.jsx";
import { renderWithProviders } from "./test/renderWithProviders.jsx";

describe("App routing", () => {
  it("renders catalog on /", async () => {
    renderWithProviders(<App />, { route: "/" });
    // Catalog page shows "Cameras & Gear" heading
    expect(await screen.findByRole("heading", { name: /electrónica|electronics/i })).toBeInTheDocument();

  });
})
