import { describe, it, expect, vi, beforeEach } from "vitest";
import { addItemToCart } from "./cartCommand";

describe("addItemToCart", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("uses existing cartId and posts item payload", async () => {
    localStorage.setItem("cartId", "existing-cart-id");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options) => {
      // add item
      if (String(url).includes("/api/cart/existing-cart-id/items")) {
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
                  quantity: 2,
                  lineTotalUSD: 20,
                },
              ],
              summary: { itemsCount: 2, subtotalUSD: 20 },
            },
          }),
        };
      }

      throw new Error(`Unexpected request: ${String(url)}`);
    });

    const cart = await addItemToCart({ productId: "p-1", quantity: 2 });

    expect(cart.cartId).toBe("existing-cart-id");
    expect(cart.summary).toEqual({ itemsCount: 2, subtotalUSD: 20 });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, options] = fetchSpy.mock.calls[0];

    expect(String(url)).toContain("/api/cart/existing-cart-id/items");
    expect(options.method).toBe("POST");

    const parsedBody = JSON.parse(options.body);
    expect(parsedBody).toEqual({ productId: "p-1", quantity: 2 });
  });

  it("creates cart when missing cartId, persists it, then posts item", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, options) => {
      // create cart
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

      // add item
      if (String(url).includes("/api/cart/new-cart-id/items") && options?.method === "POST") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            message: "Item added",
            data: {
              cartId: "new-cart-id",
              items: [
                {
                  productId: "p-2",
                  name: "Cart Item Product",
                  unitPriceUSD: 10,
                  quantity: 2,
                  lineTotalUSD: 20,
                },
              ],
              summary: { itemsCount: 2, subtotalUSD: 20 },
            },
          }),
        };
      }

      throw new Error(`Unexpected request: ${String(url)}`);
    });

    const cart = await addItemToCart({ productId: "p-2", quantity: 2 });

    expect(localStorage.getItem("cartId")).toBe("new-cart-id");
    expect(cart.cartId).toBe("new-cart-id");

    // create cart + add item
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
