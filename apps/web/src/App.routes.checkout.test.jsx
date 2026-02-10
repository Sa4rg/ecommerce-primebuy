import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import App from "./App.jsx";
import { renderWithProviders } from "./test/renderWithProviders.jsx";

describe("App routing /checkout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    localStorage.setItem("cartId", "cart-1");

    // Mock fetch to simulate checkout creation
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: { checkoutId: "checkout-1", totals: { subtotalUSD: 10 } },
      }),
    });
  });

  it("renders checkout start on /checkout", () => {
    renderWithProviders(<App />, { route: "/checkout" });

    expect(screen.getByRole("heading", { name: /checkout/i })).toBeInTheDocument();
  });
});
