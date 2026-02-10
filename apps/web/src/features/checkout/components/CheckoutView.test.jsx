import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "../../../context/CartContext.jsx";
import { CheckoutView } from "./CheckoutView.jsx";

describe("CheckoutView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("loads checkout by ID and renders totals", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          checkoutId: "checkout-1",
          cartId: "cart-1",
          totals: { subtotalUSD: 20, subtotalVES: 800 },
          exchangeRate: { provider: "BCV", usdToVes: 40, asOf: "2023-01-01T00:00:00.000Z" },
          paymentMethods: { usd: ["zelle", "zinli"], ves: ["bank_transfer", "pago_movil"] },
        },
      }),
    });

    render(
      <CartProvider>
        <MemoryRouter initialEntries={["/checkout/checkout-1"]}>
          <Routes>
            <Route path="/checkout/:checkoutId" element={<CheckoutView />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    );

    expect(await screen.findByText(/order summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Subtotal: \$20/i)).toBeInTheDocument();
    expect(screen.getByText(/Bs 800/i)).toBeInTheDocument();
    expect(screen.getByText(/USD: zelle, zinli/i)).toBeInTheDocument();

    // Verify it called GET with the checkoutId
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/api/checkout/checkout-1"),
      expect.objectContaining({ method: "GET" })
    );
  });

  it("shows error banner when backend fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        message: "Unauthorized",
      }),
    });

    render(
      <CartProvider>
        <MemoryRouter initialEntries={["/checkout/checkout-1"]}>
          <Routes>
            <Route path="/checkout/:checkoutId" element={<CheckoutView />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });

    expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
  });
});
