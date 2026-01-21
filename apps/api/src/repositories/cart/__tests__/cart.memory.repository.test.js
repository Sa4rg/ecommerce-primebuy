import { describe, test, expect, beforeEach } from "vitest";
import { InMemoryCartRepository } from "../cart.memory.repository";

describe("InMemoryCartRepository", () => {
  let repo;

  beforeEach(() => {
    repo = new InMemoryCartRepository();
  });

  test("create(cart) should store the cart and return { cartId }", async () => {
    const cart = {
      cartId: "cart-123",
      items: [],
      summary: { itemsCount: 0, subtotalUSD: 0 },
      metadata: {
        market: "VE",
        baseCurrency: "USD",
        displayCurrency: "USD",
        status: "active",
        createdAt: "2026-01-12T00:00:00.000Z",
        updatedAt: "2026-01-12T00:00:00.000Z",
      },
    };

    const result = await repo.create(cart);

    expect(result).toEqual({ cartId: "cart-123" });
  });

  test("findById(cartId) should return the stored cart (same reference)", async () => {
    const cart = {
      cartId: "cart-456",
      items: [
        {
          productId: "1",
          productName: "Laptop",
          unitPriceUSD: 1000,
          quantity: 2,
          lineTotalUSD: 2000,
        },
      ],
      summary: { itemsCount: 2, subtotalUSD: 2000 },
      metadata: {
        market: "VE",
        baseCurrency: "USD",
        displayCurrency: "USD",
        status: "active",
        createdAt: "2026-01-12T00:00:00.000Z",
        updatedAt: "2026-01-12T00:00:00.000Z",
      },
    };

    await repo.create(cart);

    const found = await repo.findById("cart-456");

    expect(found).toEqual(cart);
    // CRITICAL: Must be same reference for service mutation behavior
    expect(found).toBe(cart);
  });

  test("findById(nonexistent) should return null", async () => {
    const found = await repo.findById("nonexistent-cart-id");

    expect(found).toBeNull();
  });

  test("save(cart) should overwrite existing cart state", async () => {
    const cart = {
      cartId: "cart-789",
      items: [],
      summary: { itemsCount: 0, subtotalUSD: 0 },
      metadata: {
        market: "VE",
        baseCurrency: "USD",
        displayCurrency: "USD",
        status: "active",
        createdAt: "2026-01-12T00:00:00.000Z",
        updatedAt: "2026-01-12T00:00:00.000Z",
      },
    };

    await repo.create(cart);

    // Mutate cart (simulate adding an item)
    const updatedCart = {
      ...cart,
      items: [
        {
          productId: "2",
          productName: "Mouse",
          unitPriceUSD: 20,
          quantity: 3,
          lineTotalUSD: 60,
        },
      ],
      summary: { itemsCount: 3, subtotalUSD: 60 },
      metadata: {
        ...cart.metadata,
        updatedAt: "2026-01-12T01:00:00.000Z",
      },
    };

    await repo.save(updatedCart);

    const found = await repo.findById("cart-789");

    expect(found).toEqual(updatedCart);
    expect(found.items).toHaveLength(1);
    expect(found.summary.itemsCount).toBe(3);
    expect(found.summary.subtotalUSD).toBe(60);
  });

  test("save(cart) should preserve reference behavior for service mutations", async () => {
    const cart = {
      cartId: "cart-999",
      items: [],
      summary: { itemsCount: 0, subtotalUSD: 0 },
      metadata: {
        market: "VE",
        baseCurrency: "USD",
        displayCurrency: "USD",
        status: "active",
        createdAt: "2026-01-12T00:00:00.000Z",
        updatedAt: "2026-01-12T00:00:00.000Z",
      },
    };

    await repo.create(cart);

    const retrieved1 = await repo.findById("cart-999");

    // Service mutates cart directly (current behavior)
    retrieved1.items.push({
      productId: "1",
      productName: "Keyboard",
      unitPriceUSD: 50,
      quantity: 1,
      lineTotalUSD: 50,
    });

    await repo.save(retrieved1);

    const retrieved2 = await repo.findById("cart-999");

    // Must be same reference
    expect(retrieved2).toBe(retrieved1);
    expect(retrieved2.items).toHaveLength(1);
  });

  test("delete(cartId) should remove the cart", async () => {
    const cart = {
      cartId: "cart-to-delete",
      items: [],
      summary: { itemsCount: 0, subtotalUSD: 0 },
      metadata: {
        market: "VE",
        status: "active",
        createdAt: "2026-01-12T00:00:00.000Z",
        updatedAt: "2026-01-12T00:00:00.000Z",
      },
    };

    await repo.create(cart);

    await repo.delete("cart-to-delete");

    const found = await repo.findById("cart-to-delete");

    expect(found).toBeNull();
  });

  test("delete(nonexistent) should not throw", async () => {
    await expect(repo.delete("nonexistent")).resolves.toBeUndefined();
  });
});
