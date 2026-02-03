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

describe("POST /api/checkout", () => {
  test("should create checkout and return totals in USD and VES when exchange rate exists", async () => {
    // Arrange: create cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    // Arrange: create product
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Checkout Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // Arrange: add item to cart
    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 2 });
    expect(addItemRes.status).toBe(200);

    // Arrange: patch cart metadata to VES
    const patchRes = await request(app)
      .patch(`/api/cart/${cartId}/metadata`)
      .send({
        displayCurrency: "VES",
        exchangeRate: { usdToVes: 40, asOf: "2023-01-01T00:00:00.000Z" },
      });
    expect(patchRes.status).toBe(200);

    // Act: create checkout
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .send({ cartId });

    // Assert
    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    expect(checkoutRes.body.data.checkoutId).toBeDefined();
    expect(typeof checkoutRes.body.data.checkoutId).toBe("string");
    expect(checkoutRes.body.data.cartId).toBe(cartId);
    expect(checkoutRes.body.data.totals.subtotalUSD).toBe(20);
    expect(checkoutRes.body.data.totals.subtotalVES).toBe(800);
    expect(checkoutRes.body.data.exchangeRate).toEqual(
      expect.objectContaining({
        provider: "BCV",
        usdToVes: 40,
        asOf: "2023-01-01T00:00:00.000Z",
      })
    );
    expect(checkoutRes.body.data.paymentMethods.usd).toEqual(["zelle", "zinli"]);
    expect(checkoutRes.body.data.paymentMethods.ves).toEqual([
      "bank_transfer",
      "pago_movil",
    ]);
  });

  test("should create checkout with subtotalVES null when exchange rate is missing", async () => {
    // Arrange: create cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    // Arrange: create product
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Another Checkout Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // Arrange: add item to cart
    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });
    expect(addItemRes.status).toBe(200);

    // Act: create checkout (no metadata patch)
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .send({ cartId });

    // Assert
    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    expect(checkoutRes.body.data.totals.subtotalUSD).toBe(10);
    expect(checkoutRes.body.data.totals.subtotalVES).toBeNull();
    expect(checkoutRes.body.data.exchangeRate).toBeNull();
  });

  test("should return 404 when cart does not exist", async () => {
    // Act
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .send({ cartId: "invalid-cart-id" });

    // Assert
    expect(checkoutRes.status).toBe(404);
    expect(checkoutRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Cart not found",
      })
    );
  });

  test("should return 400 when cart is empty", async () => {
    // Arrange: create cart (no items)
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    // Act: create checkout with empty cart
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .send({ cartId });

    // Assert
    expect(checkoutRes.status).toBe(400);
    expect(checkoutRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Cart is empty",
      })
    );
  });

  test("should return 409 when cart is not active", async () => {
    // Arrange: create cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    // Arrange: create product
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Locked Cart Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // Arrange: add item to cart
    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });
    expect(addItemRes.status).toBe(200);

    // Arrange: patch cart status to locked
    const patchRes = await request(app)
      .patch(`/api/cart/${cartId}/metadata`)
      .send({ status: "locked" });
    expect(patchRes.status).toBe(200);

    // Act: create checkout
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .send({ cartId });

    // Assert
    expect(checkoutRes.status).toBe(409);
    expect(checkoutRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Cart is not active",
      })
    );
  });

  test("should return 409 when stock is insufficient at checkout", async () => {
    // Arrange: create cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    // Arrange: create product with stock 2
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Low Stock Product",
        priceUSD: 10,
        stock: 2,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // Arrange: add item quantity 2 (valid at this point)
    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 2 });
    expect(addItemRes.status).toBe(200);

    // Arrange: simulate stock drop by updating product to stock 1
    const updateProductRes = await request(app)
      .put(`/api/products/${productId}`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Low Stock Product",
        priceUSD: 10,
        stock: 1,
        category: "Test",
      });
    expect(updateProductRes.status).toBe(200);

    // Act: create checkout (should fail due to insufficient stock)
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .send({ cartId });

    // Assert
    expect(checkoutRes.status).toBe(409);
    expect(checkoutRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Insufficient stock",
      })
    );
  });
});
