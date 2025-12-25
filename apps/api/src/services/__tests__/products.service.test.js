import { describe, test, expect } from "vitest";
import productsService from "../products.service.js";


const { getProducts, getProductById } = productsService;


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

      expect(product).toHaveProperty("inStock");
      expect(typeof product.inStock).toBe("boolean");

      expect(product.priceUSD).toBeGreaterThan(0);
      expect(product.stock).toBeGreaterThanOrEqual(0);

    });
  });

  test("should set inStock to false when stock is 0", async () => {
  const products = await getProducts();
  const outOfStockProduct = products.find(p => p.stock === 0);

  expect(outOfStockProduct).toBeDefined();
  expect(outOfStockProduct.inStock).toBe(false);
});

});

describe("getProductById", () => {
  test("should return a product when it exists", async () => {
    const product = await getProductById("1");

    expect(product).toHaveProperty("id", "1");
    expect(product).toHaveProperty("name");
    expect(product).toHaveProperty("priceUSD");
    expect(product).toHaveProperty("stock");
    expect(product).toHaveProperty("category");
  });

  test("should throw a 404 error when product does not exist", async () => {
  await expect(getProductById("999")).rejects.toThrow("Product not found");

  await expect(getProductById("999")).rejects.toHaveProperty("statusCode", 404);
  });

  test("should return a product when it exists", async () => {
    const product = await getProductById("1");
    
    expect(product).toHaveProperty("inStock");
    expect(typeof product.inStock).toBe("boolean");
    expect(product.inStock).toBe(true);
  });
});