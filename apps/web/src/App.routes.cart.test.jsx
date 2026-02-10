import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import App from "./App.jsx";
import { renderWithProviders } from "./test/renderWithProviders.jsx";

describe("App routing /cart", () => {
  it("renders cart on /cart", () => {
    renderWithProviders(<App />, { route: "/cart" });
    expect(screen.getByRole("heading", { name: /cart/i })).toBeInTheDocument();
  });
});
