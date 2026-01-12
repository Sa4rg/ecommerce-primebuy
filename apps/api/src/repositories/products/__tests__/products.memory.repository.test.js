import { describe, test, expect, beforeEach } from "vitest";
import { createRequire } from "module";

const require = createRequire(import.meta.url);

// NOTE: This module doesn't exist yet. We'll create it after this test is RED.
const { InMemoryProductsRepository } = require("../products.memory.repository");

describe("InMemoryProductsRepository", () => {
  let repo;

  beforeEach(() => {
    repo = new InMemoryProductsRepository();
  });

  test("create() should persist a product and return it with a string id; findById() should retrieve it", async () => {
    const created = await repo.create({
      name: "Laptop",
      priceUSD: 1000,
      stock: 10,
      category: "Electronics",
    });

    expect(created).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: "Laptop",
        priceUSD: 1000,
        stock: 10,
        category: "Electronics",
      })
    );

    const found = await repo.findById(created.id);

    expect(found).toEqual(created);
  });

  test("findAll() should return all persisted products", async () => {
    const product1 = await repo.create({
      name: "Laptop",
      priceUSD: 1000,
      stock: 10,
      category: "Electronics",
    });

    const product2 = await repo.create({
      name: "Mouse",
      priceUSD: 25,
      stock: 50,
      category: "Accessories",
    });

    const result = await repo.findAll();

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe("Laptop");
    expect(result[1].name).toBe("Mouse");
    expect(result[0].id).toEqual(expect.any(String));
    expect(result[1].id).toEqual(expect.any(String));
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: product1.id,
        name: "Laptop",
        priceUSD: 1000,
        stock: 10,
        category: "Electronics",
      })
    );
    expect(result[1]).toEqual(
      expect.objectContaining({
        id: product2.id,
        name: "Mouse",
        priceUSD: 25,
        stock: 50,
        category: "Accessories",
      })
    );
  });
});
