import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useCart } from "../../../context/CartContext.jsx";
import { CartItem } from "./CartItem";
import { renderWithProviders } from "../../../test/renderWithProviders.jsx";

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

    renderWithProviders(
      <CartItemFromContext />,
      { route: "/cart" }
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /aumentar cantidad|increase quantity/i }));

    await waitFor(() => {
      // Qty badge shows "3" after increment
      expect(screen.getByText("3")).toBeInTheDocument();
    });
  });

    it("does not send two requests when clicking + twice quickly", async () => {
    let resolveFetch;
    const pending = new Promise((resolve) => {
        resolveFetch = resolve;
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      if (String(url).includes("/api/auth/me")) {
        return Promise.resolve({ ok: true, status: 200, json: async () => ({ success: true, data: null }) });
      }
      return pending;
    });

    renderWithProviders(
      <CartItemFromContext />,
      { route: "/cart" }
    );

    const user = userEvent.setup();
    const plus = screen.getByRole("button", { name: /aumentar cantidad|increase quantity/i });

    await user.click(plus);
    await user.click(plus);

    // Guard should prevent the second request before the first finishes
    const updateCalls = fetchSpy.mock.calls.filter(([url]) => String(url).includes("/api/cart/")).length;
    expect(updateCalls).toBe(1);

    // Finish the first request to avoid hanging test
    resolveFetch({
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

    await waitFor(() => {
        expect(screen.getByText("3")).toBeInTheDocument();
    });
    });

});
