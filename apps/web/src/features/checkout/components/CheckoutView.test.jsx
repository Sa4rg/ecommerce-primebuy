import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { renderWithProviders } from "../../../test/renderWithProviders.jsx";
import { CheckoutView } from "../CheckoutView.jsx";

describe("CheckoutView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    // No set language => defaults to "es" per LanguageProvider
  });

  it("renders totals from cart state", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/checkout/:checkoutId" element={<CheckoutView />} />
      </Routes>,
      {
        route: "/checkout/checkout-1",
        cartInitialState: {
          status: "ready",
          error: "",
          cart: {
            cartId: "cart-1",
            items: [{ productId: "p1", name: "Product 1", quantity: 2, unitPriceUSD: 10 }],
            totals: { subtotalUSD: 20 },
            metadata: { tax: { vatRate: 0.16, priceIncludesVAT: true } },
          },
        },
      }
    );

    // ES defaults after i18n change
    expect(
      await screen.findByRole("heading", { name: /resumen del pedido/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\$20\.00/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/impuestos/i)).toBeInTheDocument();
  });

  it("disables continue button when data is incomplete", async () => {
    renderWithProviders(
      <Routes>
        <Route path="/checkout/:checkoutId" element={<CheckoutView />} />
      </Routes>,
      {
        route: "/checkout/checkout-1",
        cartInitialState: {
          status: "ready",
          error: "",
          cart: {
            cartId: "cart-1",
            items: [{ productId: "p1", name: "Product 1", quantity: 1, unitPriceUSD: 10 }],
            totals: { subtotalUSD: 10 },
            metadata: {},
          },
        },
      }
    );

    const continueBtn = await screen.findByRole("button", {
      name: /continuar con el pago/i,
    });
    expect(continueBtn).toBeDisabled();
  });
});