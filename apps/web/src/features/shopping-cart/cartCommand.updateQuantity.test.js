import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateItemQuantity } from "./cartCommand";

describe("updateItemQuantity", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("PATCHes /api/cart/:cartId/items/:productId with { quantity } and returns updated cart", async () => {
    localStorage.setItem("cartId", "cart-1");

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
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

    const updated = await updateItemQuantity({
      productId: "p-1",
      quantity: 3,
    });

    expect(updated.summary).toEqual({ itemsCount: 3, subtotalUSD: 30 });

    const [url, options] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/api/cart/cart-1/items/p-1");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ quantity: 3 });
  });
});
