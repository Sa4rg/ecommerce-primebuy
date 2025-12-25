import { describe, test, expect } from "vitest";
import productsService from "../products.service.js";

describe("getProducts", () => {
  test("should return an array of products with correct structure", async () => {
    const products = await productsService.getProducts();
    expect(Array.isArray(products)).toBe(true);

    products.forEach(product => {
      expect(product).toHaveProperty("id");
      expect(product).toHaveProperty("name");
      expect(product).toHaveProperty("priceUSD");
      expect(product).toHaveProperty("stock");
      expect(product).toHaveProperty("category");

      expect(typeof product.id).toBe("string");
      expect(typeof product.name).toBe("string");
      expect(typeof product.priceUSD).toBe("number");
      expect(typeof product.stock).toBe("number");
      expect(typeof product.category).toBe("string");

      expect(product).toHaveProperty("inStock");
      expect(typeof product.inStock).toBe("boolean");

      expect(product.priceUSD).toBeGreaterThan(0);
      expect(product.stock).toBeGreaterThanOrEqual(0);
    });
  });

  test("should set inStock to false when stock is 0", async () => {
    const products = await productsService.getProducts();
    const outOfStockProduct = products.find(p => p.stock === 0);

    expect(outOfStockProduct).toBeDefined();
    expect(outOfStockProduct.inStock).toBe(false);
  });
});

describe("getProductById", () => {
  test("should return a product when it exists", async () => {
    const product = await productsService.getProductById("1");

    expect(product).toHaveProperty("id", "1");
    expect(product).toHaveProperty("name");
    expect(product).toHaveProperty("priceUSD");
    expect(product).toHaveProperty("stock");
    expect(product).toHaveProperty("category");

    expect(product).toHaveProperty("inStock");
    expect(typeof product.inStock).toBe("boolean");
    expect(product.inStock).toBe(true);
  });

  test("should throw a 404 error when product does not exist", async () => {
    await expect(productsService.getProductById("999")).rejects.toThrow(
      "Product not found"
    );

    await expect(productsService.getProductById("999")).rejects.toHaveProperty(
      "statusCode",
      404
    );
  });
});

describe("createProduct", () => {
  test("should create a product with valid data", async () => {
    const input = {
      name: "Headphones",
      priceUSD: 120,
      stock: 15,
      category: "Electronics",
    };

    const created = await productsService.createProduct(input);

    expect(created).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: "Headphones",
        priceUSD: 120,
        stock: 15,
        category: "Electronics",
        inStock: true,
      })
    );
  });

  test("should throw 400 when input is invalid", async () => {
  const input = {
    name: "Bad product",
    priceUSD: 0,
    stock: 10,
    category: "Electronics",
  };

  await expect(productsService.createProduct(input)).rejects.toHaveProperty(
    "statusCode",
    400
  );

  await expect(productsService.createProduct(input)).rejects.toThrow(
    "Invalid product input"
  );
  });

});

describe("updateProduct", () => {
  test("should update a product when it exists and input is valid", async () => {
    const input = {
      name: "Laptop",
      priceUSD: 1000,
      stock: 5,
      category: "Electronics",
    };

    const created = await productsService.createProduct(input);

    const updateInput = {
      name: "Gaming Laptop",
      priceUSD: 1500,
      stock: 0,
      category: "Gaming",
    };

    const updated = await productsService.updateProduct(created.id, updateInput);

    expect(updated.id).toBe(created.id);
    expect(updated.name).toBe("Gaming Laptop");
    expect(updated.priceUSD).toBe(1500);
    expect(updated.stock).toBe(0);
    expect(updated.category).toBe("Gaming");
    expect(updated.inStock).toBe(false);
    expect(updated).toHaveProperty("id");
    expect(updated).toHaveProperty("name");
    expect(updated).toHaveProperty("priceUSD");
    expect(updated).toHaveProperty("stock");
    expect(updated).toHaveProperty("category");
    expect(updated).toHaveProperty("inStock");
  });

  test("should throw 404 when product does not exist", async () => {
    const validInput = {
      name: "Test Product",
      priceUSD: 100,
      stock: 10,
      category: "Test",
    };

    await expect(productsService.updateProduct("999", validInput)).rejects.toHaveProperty("statusCode", 404);
    await expect(productsService.updateProduct("999", validInput)).rejects.toThrow("Product not found");
  });

  test("should throw 400 when input is invalid", async () => {
    const input = {
      name: "Valid Product",
      priceUSD: 200,
      stock: 10,
      category: "Valid",
    };

    const created = await productsService.createProduct(input);

    const invalidInput = {
      name: "Invalid Product",
      priceUSD: 0,
      stock: 10,
      category: "Invalid",
    };

    await expect(productsService.updateProduct(created.id, invalidInput)).rejects.toHaveProperty("statusCode", 400);
    await expect(productsService.updateProduct(created.id, invalidInput)).rejects.toThrow("Invalid product input");
  });
});

describe("deleteProduct", () => {
  test("should delete a product when it exists and return the deleted product", async () => {
    const input = {
      name: "Product to Delete",
      priceUSD: 100,
      stock: 10,
      category: "Test",
    };

    const created = await productsService.createProduct(input);

    const deleted = await productsService.deleteProduct(created.id);

    expect(deleted.id).toBe(created.id);
    expect(deleted.name).toBe("Product to Delete");
    expect(deleted.priceUSD).toBe(100);
    expect(deleted.stock).toBe(10);
    expect(deleted.category).toBe("Test");
    expect(deleted).toHaveProperty("inStock");
    expect(typeof deleted.inStock).toBe("boolean");

    await expect(productsService.getProductById(created.id)).rejects.toHaveProperty("statusCode", 404);
  });

  test("should throw 404 when product does not exist", async () => {
    await expect(productsService.deleteProduct("999")).rejects.toHaveProperty("statusCode", 404);
    await expect(productsService.deleteProduct("999")).rejects.toThrow("Product not found");
  });
});
