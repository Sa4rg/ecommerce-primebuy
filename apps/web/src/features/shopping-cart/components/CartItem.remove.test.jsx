import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCart } from "../../../context/CartContext.jsx";
import { renderWithProviders } from "../../../test/renderWithProviders.jsx";
import { CartItem } from "./CartItem";

function CartItemListFromContext() {
  const { cart, setCart } = useCart();

  React.useEffect(() => {
    setCart({
      cartId: "cart-1",
      items: [
        { productId: "p-1", name: "Product A", quantity: 2, lineTotalUSD: 20 },
        { productId: "p-2", name: "Product B", quantity: 1, lineTotalUSD: 20 },
      ],
      summary: { itemsCount: 3, subtotalUSD: 40 },
    });
  }, [setCart]);

  if (!cart) return null;

  return (
    <div>
      {cart.items.map((item) => (
        <CartItem key={item.productId} item={item} />
      ))}
    </div>
  );
}

describe("CartItem remove control", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("cartId", "cart-1");
    vi.restoreAllMocks();
  });

  it("removes item when clicking Remove", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: "Removed",
        data: {
          cartId: "cart-1",
          items: [
            {
              productId: "p-2",
              name: "Product B",
              unitPriceUSD: 20,
              quantity: 1,
              lineTotalUSD: 20,
            },
          ],
          summary: { itemsCount: 1, subtotalUSD: 20 },
        },
      }),
    });

    renderWithProviders(<CartItemListFromContext />, { route: "/cart" });

    expect(screen.getByText("Product A")).toBeInTheDocument();
    expect(screen.getByText("Product B")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /eliminar product a|remove product a/i }));

    await waitFor(() => {
      expect(screen.queryByText("Product A")).toBeNull();
      expect(screen.getByText("Product B")).toBeInTheDocument();
    });
  });
});
