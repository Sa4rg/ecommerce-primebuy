import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "../../../context/CartContext.jsx";
import { CartItem } from "./CartItem";

function CartItemFromContext() {
  const { cart, setCart } = useCart();

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
    });
  }, [setCart]);

  if (!cart) return null;

  return <CartItem item={cart.items[0]} />;
}

describe("CartItem quantity controls", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("cartId", "cart-1");
    vi.restoreAllMocks();
  });

  it("increments quantity when clicking +", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: "Updated",
        data: {
          cartId: "cart-1",
          items: [
            {
              productId: "p-1",
              name: "Patch Product",
              unitPriceUSD: 10,
              quantity: 3,
              lineTotalUSD: 30,
            },
          ],
          summary: { itemsCount: 3, subtotalUSD: 30 },
        },
      }),
    });

    render(
      <CartProvider>
        <CartItemFromContext />
      </CartProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "+" }));

    await waitFor(() => {
      // Note: in your DOM, "Qty:" and "3" may be split. Use regex.
      expect(screen.getByText((content) => content.includes("Qty:") && content.includes("3"))).toBeInTheDocument();
    });
  });
});
