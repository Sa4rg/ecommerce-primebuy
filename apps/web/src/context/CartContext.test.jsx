import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartProvider, useCart } from "./CartContext";

function CartConsumer() {
  const { status, itemsCount, initializeCart, addItem } = useCart();

  return (
    <div>
      <div data-testid="status">{status}</div>
      <div data-testid="count">{itemsCount}</div>

      <button onClick={initializeCart}>Init</button>
      <button onClick={() => addItem({ productId: "p-1", quantity: 1 })}>Add</button>
    </div>
  );
}

describe("CartContext (C1)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("initializeCart creates cart if missing and loads cart data", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options) => {
      // POST /api/cart
      if (String(url).includes("/api/cart") && options?.method === "POST" && !String(url).includes("/items")) {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            success: true,
            message: "Cart created successfully",
            data: { cartId: "new-cart-id" },
          }),
        };
      }

      // GET /api/cart/new-cart-id
      if (String(url).includes("/api/cart/new-cart-id") && (!options?.method || options.method === "GET")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            message: "Cart loaded",
            data: {
              cartId: "new-cart-id",
              items: [],
              summary: { itemsCount: 0, subtotalUSD: 0 },
              metadata: { market: "VE", baseCurrency: "USD" },
            },
          }),
        };
      }

      throw new Error(`Unexpected request: ${String(url)} ${options?.method || "GET"}`);
    });

    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");

    await userEvent.click(screen.getByRole("button", { name: "Init" }));

    await waitFor(() => {
      expect(screen.getByTestId("status")).toHaveTextContent("ready");
    });

    expect(localStorage.getItem("cartId")).toBe("new-cart-id");
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });

  it("addItem updates global cart itemsCount using backend response", async () => {
    localStorage.setItem("cartId", "existing-cart-id");

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options) => {
      // POST /api/cart/existing-cart-id/items
      if (String(url).includes("/api/cart/existing-cart-id/items") && options?.method === "POST") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            message: "Item added",
            data: {
              cartId: "existing-cart-id",
              items: [
                {
                  productId: "p-1",
                  name: "Cart Item Product",
                  unitPriceUSD: 10,
                  quantity: 1,
                  lineTotalUSD: 10,
                },
              ],
              summary: { itemsCount: 1, subtotalUSD: 10 },
              metadata: { market: "VE", baseCurrency: "USD" },
            },
          }),
        };
      }

      // GET might happen if you call initializeCart elsewhere; not needed in this test.
      throw new Error(`Unexpected request: ${String(url)} ${options?.method || "GET"}`);
    });

    render(
      <CartProvider>
        <CartConsumer />
      </CartProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: "Add" }));

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
  });
});
