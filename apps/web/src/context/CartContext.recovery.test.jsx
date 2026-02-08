import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "./CartContext.jsx";


function TestComponent() {
  const { setCart, updateQuantity, cart, status, error } = useCart();

  React.useEffect(() => {
    setCart({
      cartId: "cart-1",
      items: [{ productId: "1", name: "Ghost", quantity: 1, lineTotalUSD: 10 }],
      summary: { itemsCount: 1, subtotalUSD: 10 },
    });
  }, [setCart]);

  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="error">{error}</div>
      <div data-testid="count">{cart ? cart.items.length : -1}</div>
      <button onClick={() => updateQuantity({ productId: "1", quantity: 2 })}>
        Update
      </button>
    </div>
  );
}

describe("CartContext recovery", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("cartId", "cart-1");
    vi.restoreAllMocks();
  });

  it("refreshes cart when backend says item not found in cart", async () => {
    // 1) PATCH fails with 404 + message
    // 2) GET succeeds returning empty cart
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options) => {
      const u = String(url);
      const method = options?.method || "GET";

      if (u.includes("/api/cart/cart-1/items/1") && method === "PATCH") {
        return {
          ok: false,
          status: 404,
          json: async () => ({ success: false, message: "Item not found in cart" }),
        };
      }

      if (u.includes("/api/cart/cart-1") && method === "GET") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            message: "Cart retrieved successfully",
            data: {
              cartId: "cart-1",
              items: [],
              summary: { itemsCount: 0, subtotalUSD: 0 },
            },
          }),
        };
      }

      throw new Error(`Unexpected request: ${u} ${method}`);
    });

    const user = userEvent.setup();

    render(
      <CartProvider initialState={{ status: "ready", error: "" }}>
        <TestComponent />
      </CartProvider>
    );

    expect(screen.getByTestId("count")).toHaveTextContent("1");

    await user.click(screen.getByRole("button", { name: "Update" }));

    // After recovery, cart should be refreshed
    expect(screen.getByTestId("count")).toHaveTextContent("0");
    expect(screen.getByTestId("status").textContent).not.toBe("loading");
  });
});
