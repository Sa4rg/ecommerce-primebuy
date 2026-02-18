import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProductCard } from "./ProductCard";
import { useCart } from "../../context/CartContext.jsx";
import { renderWithProviders } from "../../test/renderWithProviders.jsx";

function CartCount() {
  const { itemsCount } = useCart();
  return <div data-testid="count">{itemsCount}</div>;
}

describe("ProductCard (with CartProvider)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("adds the product to cart and updates itemsCount", async () => {
    localStorage.setItem("cartId", "existing-cart-id");

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options) => {
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
                  name: "Test Product",
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

      throw new Error(`Unexpected request: ${String(url)} ${options?.method || "GET"}`);
    });

    const user = userEvent.setup();

    const product = {
      id: "p-1",
      name: "Test Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
      inStock: true,
    };

    renderWithProviders(
      <>
        <CartCount />
        <ProductCard product={product} />
      </>,
      { route: "/" }
    );

    expect(screen.getByTestId("count")).toHaveTextContent("0");

    await user.click(screen.getByRole("button", { name: /add to cart/i }));

    await waitFor(() => {
      expect(screen.getByTestId("count")).toHaveTextContent("1");
    });
  });

  it("disables the button and shows 'Adding...' while adding", async () => {
    localStorage.setItem("cartId", "existing-cart-id");

    let resolveRequest;

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options) => {
      if (String(url).includes("/api/cart/existing-cart-id/items") && options?.method === "POST") {
        return await new Promise((resolve) => {
          resolveRequest = () =>
            resolve({
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
                      name: "Test Product",
                      unitPriceUSD: 10,
                      quantity: 1,
                      lineTotalUSD: 10,
                    },
                  ],
                  summary: { itemsCount: 1, subtotalUSD: 10 },
                  metadata: { market: "VE", baseCurrency: "USD" },
                },
              }),
            });
        });
      }

      throw new Error(`Unexpected request: ${String(url)} ${options?.method || "GET"}`);
    });

    const user = userEvent.setup();

    const product = {
      id: "p-1",
      name: "Test Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
      inStock: true,
    };

    renderWithProviders(<ProductCard product={product} />, { route: "/" });

    const button = screen.getByRole("button", { name: /add to cart/i });

    await user.click(button);

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/adding/i);

    // Resolve the "network" request
    resolveRequest();

    await waitFor(() => {
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent(/add to cart/i);
    });
  });
});
