import { describe, test, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";

function adminToken() {
  return jwt.sign(
    { sub: "admin-test", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

describe("PATCH /api/cart/:cartId/items/:productId", () => {
  test("should update item quantity and return updated cart", async () => {
    // Arrange: create cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    // Arrange: create product
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Patch Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // Arrange: add item (quantity 2)
    const addRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 2 });

    expect(addRes.status).toBe(200);

    // Act: update item quantity to 3
    const patchRes = await request(app)
      .patch(`/api/cart/${cartId}/items/${productId}`)
      .send({ quantity: 3 });

    // Assert
    expect(patchRes.status).toBe(200);
    expect(patchRes.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    expect(patchRes.body.data).toEqual(
      expect.objectContaining({
        cartId,
        items: [
          expect.objectContaining({
            productId,
            name: "Patch Product",
            unitPriceUSD: 10,
            quantity: 3,
            lineTotalUSD: 30,
          }),
        ],
        summary: {
          itemsCount: 3,
          subtotalUSD: 30,
        },
      })
    );
  });

  test("should return 404 when cart does not exist", async () => {
    // create a product so productId is valid
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Any Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    const res = await request(app)
      .patch(`/api/cart/invalid-cart-id/items/${productId}`)
      .send({ quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Cart not found",
      })
    );
  });

  test("should return 404 when item is not in cart", async () => {
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    // create a product but do NOT add it to cart
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Not In Cart Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    const res = await request(app)
      .patch(`/api/cart/${cartId}/items/${productId}`)
      .send({ quantity: 1 });

    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Item not found in cart",
      })
    );
  });

  test("should return 400 when quantity is invalid", async () => {
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Invalid Qty Patch Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // add first
    const addRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });
    expect(addRes.status).toBe(200);

    // invalid update
    const res = await request(app)
      .patch(`/api/cart/${cartId}/items/${productId}`)
      .send({ quantity: 0 });

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

    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Low Stock Patch Product",
        priceUSD: 10,
        stock: 2,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // add first
    const addRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });
    expect(addRes.status).toBe(200);

    const res = await request(app)
      .patch(`/api/cart/${cartId}/items/${productId}`)
      .send({ quantity: 3 });

    expect(res.status).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Insufficient stock",
      })
    );
  });
});
