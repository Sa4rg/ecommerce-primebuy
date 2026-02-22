import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { useCart } from "../../../context/CartContext.jsx";
import { renderWithProviders } from "../../../test/renderWithProviders.jsx";
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
      metadata: { market: "VE", baseCurrency: "USD", status: "active" },
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
    renderWithProviders(
      <>
        <SeedCart />
        <Routes>
          <Route path="/cart" element={<CartView />} />
          <Route path="/checkout" element={<h1>Checkout Page</h1>} />
        </Routes>
      </>,
      { route: "/cart" }
    );

    const user = userEvent.setup();
    const buttons = screen.getAllByRole("button", { name: /checkout/i });
    await user.click(buttons[0]);

    expect(screen.getByRole("heading", { name: /checkout page/i })).toBeInTheDocument();
  });
});
