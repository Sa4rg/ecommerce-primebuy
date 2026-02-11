import { describe, test, expect, beforeAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { registerAndLogin } from "../test_helpers/authHelper.js";

function adminToken() {
  return jwt.sign({ sub: "admin-test", role: "admin" }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

let customerAccessToken;

beforeAll(async () => {
  customerAccessToken = await registerAndLogin(app, "customer-shipping");
});

describe("PATCH /api/checkout/:id/shipping", () => {
  test("should save shipping address in checkout (auth required)", async () => {
    // create cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    // create product
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ name: "Ship Product", priceUSD: 10, stock: 5, category: "Test" });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // add item
    const addItemRes = await request(app).post(`/api/cart/${cartId}/items`).send({ productId, quantity: 1 });
    expect(addItemRes.status).toBe(200);

    // create checkout (auth)
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${customerAccessToken}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    // patch shipping
    const patchRes = await request(app)
      .patch(`/api/checkout/${checkoutId}/shipping`)
      .set("Authorization", `Bearer ${customerAccessToken}`)
      .send({
        method: "delivery",
        address: {
          recipientName: "Sara",
          phone: "0412-0000000",
          state: "Carabobo",
          city: "Valencia",
          line1: "Av. Principal, Casa 1",
          reference: "Frente a la plaza",
        },
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.success).toBe(true);

    // assert snapshot exists
    expect(patchRes.body.data.shipping).toMatchObject({
      method: "delivery",
      address: {
        recipientName: "Sara",
        phone: "0412-0000000",
        state: "Carabobo",
        city: "Valencia",
        line1: "Av. Principal, Casa 1",
        reference: "Frente a la plaza",
      },
    });
  });

  test("should return 401 if no auth", async () => {
    const res = await request(app)
      .patch("/api/checkout/any-id/shipping")
      .send({ method: "delivery", address: { recipientName: "X", phone: "1", state: "S", city: "C", line1: "L" } });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe("Unauthorized");
  });

  test("should allow pickup shipping without address", async () => {
    // create cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    // create product
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ name: "Pickup Product", priceUSD: 15, stock: 5, category: "Test" });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // add item
    const addItemRes = await request(app).post(`/api/cart/${cartId}/items`).send({ productId, quantity: 1 });
    expect(addItemRes.status).toBe(200);

    // create checkout (auth)
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${customerAccessToken}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    const res = await request(app)
      .patch(`/api/checkout/${checkoutId}/shipping`)
      .set("Authorization", `Bearer ${customerAccessToken}`)
      .send({ method: "pickup" });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.shipping).toMatchObject({
      method: "pickup",
      address: null,
    });
  });

});
