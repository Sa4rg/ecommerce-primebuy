import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import App from "./App.jsx";
import { renderWithProviders } from "./test/renderWithProviders.jsx";

describe("App routing /cart", () => {
  it("renders cart on /cart", () => {
    renderWithProviders(<App />, { route: "/cart" });
    // Cart page renders - shows loading or cart content
    expect(screen.getByText(/loading cart|shopping cart/i)).toBeInTheDocument();
  });
});
