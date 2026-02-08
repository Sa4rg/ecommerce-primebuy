import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCart } from "./cartQuery";

describe("getCart", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls GET /api/cart/:cartId and returns the cart data", async () => {
    const cartId = "test-cart-id";

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: "Cart loaded",
        data: {
          cartId,
          items: [],
          summary: { itemsCount: 0, subtotalUSD: 0 },
          metadata: { market: "VE", baseCurrency: "USD" },
        },
      }),
    });

    const cart = await getCart(cartId);

    expect(cart).toEqual({
      cartId,
      items: [],
      summary: { itemsCount: 0, subtotalUSD: 0 },
      metadata: { market: "VE", baseCurrency: "USD" },
    });

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);

    const [url, options] = globalThis.fetch.mock.calls[0];
    expect(String(url)).toContain(`/api/cart/${cartId}`);
    expect(options.method).toBe("GET");
  });
});
