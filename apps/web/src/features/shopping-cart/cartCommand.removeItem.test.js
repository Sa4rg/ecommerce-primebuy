import { describe, it, expect, vi, beforeEach } from "vitest";
import { removeItemFromCart } from "./cartCommand";

describe("removeItemFromCart", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("cartId", "cart-1");
    vi.restoreAllMocks();
  });

  it("DELETEs /api/cart/:cartId/items/:productId and returns updated cart", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
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

    const updated = await removeItemFromCart({ productId: "p-1" });

    expect(updated.summary).toEqual({ itemsCount: 1, subtotalUSD: 20 });

    const [url, options] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/api/cart/cart-1/items/p-1");
    expect(options.method).toBe("DELETE");
  });
});
