import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CartProvider, useCart } from "../../../context/CartContext.jsx";
import { CartView } from "./CartView.jsx";

function SeedCart() {
  const { setCart } = useCart();

  React.useEffect(() => {
    setCart({
      cartId: "cart-1",
      items: [
        {
          productId: "p-1",
          name: "Patch Product",
          quantity: 2,
          lineTotalUSD: 20,
        },
      ],
      summary: { itemsCount: 2, subtotalUSD: 20 },
      metadata: { market: "VE", baseCurrency: "USD" },
    });
  }, [setCart]);

  return null;
}

describe("CartView checkout navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("cartId", "cart-1");
    vi.restoreAllMocks();
  });

  it("navigates to /checkout when clicking Finalize purchase", async () => {
    render(
      <CartProvider>
        <MemoryRouter initialEntries={["/cart"]}>
          <SeedCart />
          <Routes>
            <Route path="/cart" element={<CartView />} />
            <Route path="/checkout" element={<h1>Checkout</h1>} />
          </Routes>
        </MemoryRouter>
      </CartProvider>
    );

    const user = userEvent.setup();

    const button = screen.getByRole("button", { name: /finalize purchase/i });
    await user.click(button);

    expect(screen.getByRole("heading", { name: /checkout/i })).toBeInTheDocument();
  });
});
