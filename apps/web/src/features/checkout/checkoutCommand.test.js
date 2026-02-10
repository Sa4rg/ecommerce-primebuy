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
    // (Opcional) si tu apiClient ya usa token desde localStorage:
    localStorage.setItem("accessToken", "token-123");

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

    // si el apiClient agrega Authorization automático, esto debe existir
    // (si aún no lo agregaste en apiClient, comenta estas 2 líneas por ahora)
    expect(options.headers.Authorization).toBe("Bearer token-123");

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
