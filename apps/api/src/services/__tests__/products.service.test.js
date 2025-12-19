import { describe, test, expect } from "vitest";
import { getProducts } from "../products.service.js";

describe("getProducts", () => {
  test("should return an array of products with correct structure", async () => {
    const products = await getProducts();
    expect(Array.isArray(products)).toBe(true);
    products.forEach(product => {
      expect(product).toHaveProperty('id');
      expect(product).toHaveProperty('name');
      expect(product).toHaveProperty('priceUSD');
      expect(product).toHaveProperty('stock');
      expect(product).toHaveProperty('category');
      expect(typeof product.id).toBe('string');
      expect(typeof product.name).toBe('string');
      expect(typeof product.priceUSD).toBe('number');
      expect(typeof product.stock).toBe('number');
      expect(typeof product.category).toBe('string');
    });
  });
});