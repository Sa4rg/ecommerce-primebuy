import { describe, test, expect } from "vitest";
import cartService from "../cart.service.js";

describe("createCart", () => {
  test("should return a cartId string", async () => {
    const result = await cartService.createCart();

    expect(result).toHaveProperty("cartId");
    expect(typeof result.cartId).toBe("string");
    expect(result.cartId.length).toBeGreaterThan(0);
  });

  test("should create an empty cart accessible by getCart", async () => {
    const { cartId } = await cartService.createCart();

    const cart = await cartService.getCart(cartId);

    expect(cart).toEqual({
      cartId,
      items: [],
      summary: { itemsCount: 0, subtotalUSD: 0 }
    });
  });
});