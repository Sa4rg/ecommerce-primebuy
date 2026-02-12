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

describe("GET /api/checkout/:id", () => {
  let user1Token;
  let user2Token;
  let checkoutId;

  beforeAll(async () => {
    user1Token = await registerAndLogin(app, "checkout-owner");
    user2Token = await registerAndLogin(app, "checkout-intruder");

    // user1 creates cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;
    const cartSecret = createCartRes.body.data.cartSecret;

    // admin creates product
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Ownership Test Product",
        priceUSD: 15,
        stock: 10,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // add item to cart
    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });
    expect(addItemRes.status).toBe(200);

    // user1 creates checkout (claims the cart)
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${user1Token}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    checkoutId = checkoutRes.body.data.checkoutId;
  });

  test("GET /api/checkout/:id → 401 without token", async () => {
    const res = await request(app).get(`/api/checkout/${checkoutId}`);

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: "Unauthorized",
    });
  });

  test("GET /api/checkout/:id → 403 with token of different user", async () => {
    const res = await request(app)
      .get(`/api/checkout/${checkoutId}`)
      .set("Authorization", `Bearer ${user2Token}`);

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      success: false,
      message: expect.stringMatching(/forbidden|not authorized|access denied/i),
    });
  });

  test("GET /api/checkout/:id → 200 with token of owner", async () => {
    const res = await request(app)
      .get(`/api/checkout/${checkoutId}`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      data: {
        checkoutId,
      },
    });
  });
});
