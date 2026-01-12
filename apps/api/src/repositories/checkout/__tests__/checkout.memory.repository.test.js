import { describe, test, expect, beforeEach } from "vitest";
import { InMemoryCheckoutRepository } from "../checkout.memory.repository";

describe("InMemoryCheckoutRepository", () => {
  let repo;

  beforeEach(() => {
    repo = new InMemoryCheckoutRepository();
  });

  test("create(checkout) should store the checkout and return { checkoutId }", async () => {
    const checkout = {
      checkoutId: "checkout-123",
      cartId: "cart-456",
      totals: {
        subtotalUSD: 1000,
        subtotalVES: null,
      },
      exchangeRate: null,
      paymentMethods: {
        usd: ["zelle", "zinli"],
        ves: ["bank_transfer", "pago_movil"],
      },
    };

    const result = await repo.create(checkout);

    expect(result).toEqual({ checkoutId: "checkout-123" });
  });

  test("findById(checkoutId) should return the stored checkout", async () => {
    const checkout = {
      checkoutId: "checkout-789",
      cartId: "cart-abc",
      totals: {
        subtotalUSD: 500,
        subtotalVES: 18000,
      },
      exchangeRate: {
        provider: "BCV",
        usdToVes: 36.0,
        asOf: "2026-01-12T00:00:00.000Z",
      },
      paymentMethods: {
        usd: ["zelle", "zinli"],
        ves: ["bank_transfer", "pago_movil"],
      },
    };

    await repo.create(checkout);

    const found = await repo.findById("checkout-789");

    expect(found).toEqual(checkout);
    expect(found).toBe(checkout); // Same reference
  });

  test("findById(nonexistent) should return null", async () => {
    const found = await repo.findById("nonexistent-checkout-id");

    expect(found).toBeNull();
  });

  test("save(checkout) should overwrite existing checkout state", async () => {
    const checkout = {
      checkoutId: "checkout-update",
      cartId: "cart-xyz",
      totals: {
        subtotalUSD: 200,
        subtotalVES: null,
      },
      exchangeRate: null,
      paymentMethods: {
        usd: ["zelle", "zinli"],
        ves: ["bank_transfer", "pago_movil"],
      },
    };

    await repo.create(checkout);

    // Mutate checkout (simulate updating totals)
    const updatedCheckout = {
      ...checkout,
      totals: {
        subtotalUSD: 250,
        subtotalVES: 9000,
      },
      exchangeRate: {
        provider: "BCV",
        usdToVes: 36.0,
        asOf: "2026-01-12T01:00:00.000Z",
      },
    };

    await repo.save(updatedCheckout);

    const found = await repo.findById("checkout-update");

    expect(found).toEqual(updatedCheckout);
    expect(found.totals.subtotalUSD).toBe(250);
    expect(found.totals.subtotalVES).toBe(9000);
    expect(found.exchangeRate).toEqual({
      provider: "BCV",
      usdToVes: 36.0,
      asOf: "2026-01-12T01:00:00.000Z",
    });
  });

  test("save(checkout) preserves reference behavior", async () => {
    const checkout = {
      checkoutId: "checkout-ref",
      cartId: "cart-ref",
      totals: {
        subtotalUSD: 100,
        subtotalVES: null,
      },
      exchangeRate: null,
      paymentMethods: {
        usd: ["zelle"],
        ves: [],
      },
    };

    await repo.create(checkout);

    const retrieved = await repo.findById("checkout-ref");

    // Mutate the retrieved object
    retrieved.totals.subtotalUSD = 150;

    await repo.save(retrieved);

    const found = await repo.findById("checkout-ref");

    expect(found.totals.subtotalUSD).toBe(150);
    expect(found).toBe(retrieved); // Same reference
  });
});
