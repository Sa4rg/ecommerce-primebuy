import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "../../../context/CartContext.jsx";
import { CheckoutView } from "../CheckoutView.jsx";

describe("CheckoutView", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("renders totals from cart state", async () => {
    render(
      <CartProvider
        initialState={{
          status: "ready",
          error: "",
          cart: {
            cartId: "cart-1",
            items: [{ productId: "p1", name: "Product 1", quantity: 2, unitPriceUSD: 10 }],
            totals: { subtotalUSD: 20 },
            metadata: { tax: { vatRate: 0.16, priceIncludesVAT: true } },
          },
        }}
      >
        <MemoryRouter initialEntries={["/checkout/checkout-1"]}>
          <Routes>
            <Route path="/checkout/:checkoutId" element={<CheckoutView />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    );

    expect(await screen.findByRole("heading", { name: /order summary/i })).toBeInTheDocument();
    expect(screen.getByText(/subtotal/i)).toBeInTheDocument();
    expect(screen.getAllByText(/\$20\.00/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/estimated taxes/i)).toBeInTheDocument();
  });

  it("shows validation error when trying to continue with incomplete data", async () => {
    render(
      <CartProvider
        initialState={{
          status: "ready",
          error: "",
          cart: {
            cartId: "cart-1",
            items: [{ productId: "p1", name: "Product 1", quantity: 1, unitPriceUSD: 10 }],
            totals: { subtotalUSD: 10 },
            metadata: {},
          },
        }}
      >
        <MemoryRouter initialEntries={["/checkout/checkout-1"]}>
          <Routes>
            <Route path="/checkout/:checkoutId" element={<CheckoutView />} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    );

    const continueBtn = await screen.findByRole("button", { name: /continuar con el pago/i });
    expect(continueBtn).toBeDisabled();
  });
});
