import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

describe("POST /api/cart/:cartId/items", () => {
  test("should add an item to cart and return updated cart", async () => {
    // Arrange: create cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);

    const cartId = createCartRes.body.data.cartId;
    expect(cartId).toBeDefined();

    // Arrange: create product
    const createProductRes = await request(app).post("/api/products").send({
      name: "Cart Item Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
    });

    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;
    expect(productId).toBeDefined();

    // Act: add item
    const addRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 2 });

    // Assert
    expect(addRes.status).toBe(200);
    expect(addRes.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    expect(addRes.body.data).toEqual(
      expect.objectContaining({
        cartId,
        items: [
          expect.objectContaining({
            productId,
            name: "Cart Item Product",
            unitPriceUSD: 10,
            quantity: 2,
            lineTotalUSD: 20,
          }),
        ],
        summary: {
          itemsCount: 2,
          subtotalUSD: 20,
        },
      })
    );
  });

  test("should return 404 when cart does not exist", async () => {
    // Arrange: create product
    const createProductRes = await request(app).post("/api/products").send({
      name: "Another Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
    });

    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // Act
    const res = await request(app)
      .post("/api/cart/invalid-cart-id/items")
      .send({ productId, quantity: 1 });

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Cart not found",
      })
    );
  });

  test("should return 400 when quantity is invalid", async () => {
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    const createProductRes = await request(app).post("/api/products").send({
      name: "Invalid Qty Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
    });

    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    const res = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 0 });

    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Invalid quantity",
      })
    );
  });

  test("should return 409 when quantity exceeds stock", async () => {
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    const createProductRes = await request(app).post("/api/products").send({
      name: "Low Stock Product",
      priceUSD: 10,
      stock: 2,
      category: "Test",
    });

    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    const res = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 3 });

    expect(res.status).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Insufficient stock",
      })
    );
  });
});
