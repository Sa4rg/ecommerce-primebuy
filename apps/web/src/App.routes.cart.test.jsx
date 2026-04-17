import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import App from "./App.jsx";
import { renderWithProviders } from "./test/renderWithProviders.jsx";

describe("App routing /cart", () => {
  it("renders cart on /cart", () => {
    renderWithProviders(<App />, { route: "/cart" });
    // Cart page renders - verify by heading (more specific than text that appears multiple times during loading)
    expect(screen.getByRole('heading', { name: /carrito de compras|shopping cart/i })).toBeInTheDocument();
  });
});
