import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCheckout } from "./checkoutCommand";

describe("checkoutCommand.createCheckout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("throws if cartId is missing", async () => {
    await expect(createCheckout({ cartId: "" })).rejects.toThrow(/cartId is required/i);
  });

  it("POSTs /api/checkout with cartId and returns data", async () => {
    // ✅ httpOnly cookies: No need to set localStorage
    // Auth cookies are sent automatically with credentials: 'include'

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        message: "Checkout created successfully",
        data: {
          checkoutId: "checkout-1",
          cartId: "cart-1",
          totals: { subtotalUSD: 20, subtotalVES: null },
        },
      }),
    });

    const data = await createCheckout({ cartId: "cart-1" });

    expect(data).toEqual(
      expect.objectContaining({
        checkoutId: "checkout-1",
        cartId: "cart-1",
        totals: expect.any(Object),
      })
    );

    // Aserciones del request:
    const [url, options] = globalThis.fetch.mock.calls[0];

    expect(url).toMatch(/\/api\/checkout$/);
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe("application/json");

    // Con httpOnly cookies, no enviamos Authorization header
    // En su lugar, verificamos que credentials: 'include' esté configurado
    expect(options.credentials).toBe("include");

    expect(JSON.parse(options.body)).toEqual({ cartId: "cart-1" });
  });

  it("throws a backend message when request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        success: false,
        message: "Unauthorized",
      }),
    });

    await expect(createCheckout({ cartId: "cart-1" })).rejects.toThrow("Unauthorized");
  });
});
