import { describe, test, expect, beforeAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { registerAndLogin } from "../test_helpers/authHelper.js";
import { completeCheckout } from "../test_helpers/checkoutHelper.js";

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
    const cartSecret = createCartRes.body.data.cartSecret;

    // create product
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ name: "Ship Product", priceUSD: 10, stock: 5, category: "Test" });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // add item
    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });
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
    const cartSecret = createCartRes.body.data.cartSecret;

    // create product
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ name: "Pickup Product", priceUSD: 15, stock: 5, category: "Test" });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // add item
    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });
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

  test("should return 409 when trying to update shipping after payment is submitted", async () => {
    const token = await registerAndLogin(app, "checkout-locked-shipping");

    // 1️⃣ Create cart
    const cartRes = await request(app).post("/api/cart");
    expect(cartRes.status).toBe(201);
    const cartId = cartRes.body.data.cartId;
    const cartSecret = cartRes.body.data.cartSecret;

    // 2️⃣ Create product
    const productRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Lock Shipping Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(productRes.status).toBe(201);
    const productId = productRes.body.data.id;

    // 3️⃣ Add item
    await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });

    // 4️⃣ Create checkout
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    // 5️⃣ Complete checkout
    await completeCheckout(app, checkoutId, token);

    // 6️⃣ Create payment
    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    const paymentId = paymentRes.body.data.paymentId;

    // 7️⃣ Submit payment
    const submitRes = await request(app)
      .patch(`/api/payments/${paymentId}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reference: "SHIP-LOCK-123" });
    expect(submitRes.status).toBe(200);

    // 8️⃣ Try to update shipping again
    const patchRes = await request(app)
      .patch(`/api/checkout/${checkoutId}/shipping`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        method: "delivery",
        address: {
          recipientName: "Hacker",
          phone: "0412-9999999",
          state: "Malicious",
          city: "Attack",
          line1: "Should not save",
        },
      });

    expect(patchRes.status).toBe(409);
    expect(patchRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Checkout is not editable",
      })
    );
  });

  test("should allow shipping update when payment is only PENDING (not submitted)", async () => {
    const token = await registerAndLogin(app, "checkout-pending-shipping");

    // 1️⃣ Create cart
    const cartRes = await request(app).post("/api/cart");
    expect(cartRes.status).toBe(201);
    const cartId = cartRes.body.data.cartId;
    const cartSecret = cartRes.body.data.cartSecret;

    // 2️⃣ Create product
    const productRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Pending Shipping Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(productRes.status).toBe(201);
    const productId = productRes.body.data.id;

    // 3️⃣ Add item
    await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });

    // 4️⃣ Create checkout
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    // 5️⃣ Complete checkout
    await completeCheckout(app, checkoutId, token);

    // 6️⃣ Create payment (status = PENDING)
    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body.data.status).toBe("pending");
    // NOTE: Payment NOT submitted yet

    // 7️⃣ Update shipping should still work
    const patchRes = await request(app)
      .patch(`/api/checkout/${checkoutId}/shipping`)
      .set("Authorization", `Bearer ${token}`)
      .send({ method: "pickup" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.shipping.method).toBe("pickup");
  });

});
