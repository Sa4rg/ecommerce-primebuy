import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import App from "./App.jsx";
import { renderWithProviders } from "./test/renderWithProviders.jsx";

describe("App routing", () => {
  it("renders home page on /", async () => {
    renderWithProviders(<App />, { route: "/" });
    // Home page shows hero heading
    expect(await screen.findByRole("heading", { name: /primebuy/i })).toBeInTheDocument();
  });
})
