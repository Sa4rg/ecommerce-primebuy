import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import App from "./App.jsx";
import { renderWithProviders } from "./test/renderWithProviders.jsx";

describe("App routing", () => {
  it("renders catalog on /", () => {
    renderWithProviders(<App />, { route: "/" });
    expect(screen.getByRole("heading", { name: /catalog/i })).toBeInTheDocument();
  });
});
