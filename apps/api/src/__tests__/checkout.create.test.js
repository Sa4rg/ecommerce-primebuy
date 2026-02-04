import { describe, test, expect, beforeAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { registerAndLogin } from "../test_helpers/authHelper.js";

function adminToken() {
  return jwt.sign(
    { sub: "admin-test", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

let customerAccessToken;
let expectedUserId;

beforeAll(async () => {
  customerAccessToken = await registerAndLogin(app, "customer-checkout");
  const decoded = jwt.verify(customerAccessToken, process.env.JWT_SECRET);
  expectedUserId = decoded.sub;
});

describe("POST /api/checkout", () => {
  test("should return 401 when creating checkout without auth", async () => {
    const res = await request(app)
      .post("/api/checkout")
      .send({ cartId: "any-cart-id" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Unauthorized",
      })
    );
  });

  test("should claim anonymous cart for the authenticated user when creating checkout", async () => {
    // Create anonymous cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    // Create product (admin)
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Claim Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // Add item to cart
    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });
    expect(addItemRes.status).toBe(200);

    // Create checkout with auth
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${customerAccessToken}`)
      .send({ cartId });

    expect(checkoutRes.status).toBe(200);

    // Verify cart is now owned by the user
    const cartRes = await request(app).get(`/api/cart/${cartId}`);
    expect(cartRes.status).toBe(200);
    expect(cartRes.body.data.userId).toBe(expectedUserId);
  });

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
      .set("Authorization", `Bearer ${customerAccessToken}`)
      .send({ cartId });

    // Assert
    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body.data.cartId).toBe(cartId);
    expect(checkoutRes.body.data.totals.subtotalUSD).toBe(20);
    expect(checkoutRes.body.data.totals.subtotalVES).toBe(800);
  });

  test("should create checkout with subtotalVES null when exchange rate is missing", async () => {
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

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

    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });
    expect(addItemRes.status).toBe(200);

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${customerAccessToken}`)
      .send({ cartId });

    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body.data.totals.subtotalUSD).toBe(10);
    expect(checkoutRes.body.data.totals.subtotalVES).toBeNull();
    expect(checkoutRes.body.data.exchangeRate).toBeNull();
  });

  test("should return 404 when cart does not exist", async () => {
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${customerAccessToken}`)
      .send({ cartId: "non-existent-cart-id" });

    expect(checkoutRes.status).toBe(404);
    expect(checkoutRes.body.message).toBe("Cart not found");
  });

  test("should return 400 when cart is empty", async () => {
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${customerAccessToken}`)
      .send({ cartId });

    expect(checkoutRes.status).toBe(400);
    expect(checkoutRes.body.message).toBe("Cart is empty");
  });

  test("should return 409 when cart is not active", async () => {
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

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

    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });
    expect(addItemRes.status).toBe(200);

    const patchRes = await request(app)
      .patch(`/api/cart/${cartId}/metadata`)
      .send({ status: "locked" });
    expect(patchRes.status).toBe(200);

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${customerAccessToken}`)
      .send({ cartId });

    expect(checkoutRes.status).toBe(409);
    expect(checkoutRes.body.message).toBe("Cart is not active");
  });

  test("should return 409 when stock is insufficient at checkout", async () => {
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

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

    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 2 });
    expect(addItemRes.status).toBe(200);

    // drop stock to 1
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

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${customerAccessToken}`)
      .send({ cartId });

    expect(checkoutRes.status).toBe(409);
    expect(checkoutRes.body.message).toBe("Insufficient stock");
  });
});
