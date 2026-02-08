import { describe, it, expect, beforeEach, vi } from "vitest";
import { ensureCartId } from "./cartService";

describe("ensureCartId", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("returns existing cartId from localStorage without calling the API", async () => {
    localStorage.setItem("cartId", "existing-cart-id");

    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const cartId = await ensureCartId();

    expect(cartId).toBe("existing-cart-id");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("creates a new cart when cartId does not exist and persists it", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          message: "Cart created successfully",
          data: { cartId: "56c34434-23c8-446f-bea1-944fd6a6e2a1" },
        }),
      });

    const cartId = await ensureCartId();

    expect(cartId).toBe("56c34434-23c8-446f-bea1-944fd6a6e2a1");
    expect(localStorage.getItem("cartId")).toBe("56c34434-23c8-446f-bea1-944fd6a6e2a1");

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    const [url, options] = fetchSpy.mock.calls[0];
    expect(String(url)).toContain("/api/cart");
    expect(options.method).toBe("POST");
  });
});
