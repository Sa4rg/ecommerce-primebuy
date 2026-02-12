import { describe, test, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { registerAndLogin } from "../test_helpers/authHelper.js";
import { completeCheckout } from "../test_helpers/checkoutHelper.js";
import { CheckoutStatus } from "../constants/checkoutStatus.js";

function adminToken() {
  return jwt.sign(
    { sub: "admin-test", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

describe("PATCH /api/checkout/:checkoutId/cancel", () => {
  test("should cancel a pending checkout", async () => {
    const token = await registerAndLogin(app, "checkout-cancel-basic");

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
        name: "Cancel Test Product",
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

    // 5️⃣ Cancel checkout
    const cancelRes = await request(app)
      .patch(`/api/checkout/${checkoutId}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.success).toBe(true);
    expect(cancelRes.body.data.status).toBe(CheckoutStatus.CANCELLED);
  });

  test("should return 401 when cancelling without auth", async () => {
    const cancelRes = await request(app)
      .patch("/api/checkout/any-id/cancel");

    expect(cancelRes.status).toBe(401);
  });

  test("should return 403 when cancelling checkout owned by another user", async () => {
    const ownerToken = await registerAndLogin(app, "checkout-cancel-owner");
    const otherToken = await registerAndLogin(app, "checkout-cancel-other");

    // Create cart
    const cartRes = await request(app).post("/api/cart");
    expect(cartRes.status).toBe(201);
    const cartId = cartRes.body.data.cartId;
    const cartSecret = cartRes.body.data.cartSecret;

    // Create product
    const productRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Ownership Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(productRes.status).toBe(201);
    const productId = productRes.body.data.id;

    // Add item
    await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });

    // Create checkout (owned by ownerToken)
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    // Try to cancel with different user
    const cancelRes = await request(app)
      .patch(`/api/checkout/${checkoutId}/cancel`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(cancelRes.status).toBe(403);
  });

  test("should return 409 when cancelling checkout after payment submitted", async () => {
    const token = await registerAndLogin(app, "checkout-cancel-locked");

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
        name: "Cancel Lock Product",
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

    // 6️⃣ Create and submit payment
    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    const paymentId = paymentRes.body.data.paymentId;

    const submitRes = await request(app)
      .patch(`/api/payments/${paymentId}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reference: "CANCEL-LOCK-123" });
    expect(submitRes.status).toBe(200);

    // 7️⃣ Try to cancel checkout
    const cancelRes = await request(app)
      .patch(`/api/checkout/${checkoutId}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    expect(cancelRes.status).toBe(409);
    expect(cancelRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Checkout is not editable",
      })
    );
  });

  test("should allow cancel when payment is only PENDING (not submitted)", async () => {
    const token = await registerAndLogin(app, "checkout-cancel-pending");

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
        name: "Cancel Pending Product",
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

    // 6️⃣ Create payment (status = PENDING, not submitted)
    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body.data.status).toBe("pending");

    // 7️⃣ Should still be able to cancel
    const cancelRes = await request(app)
      .patch(`/api/checkout/${checkoutId}/cancel`)
      .set("Authorization", `Bearer ${token}`);

    expect(cancelRes.status).toBe(200);
    expect(cancelRes.body.data.status).toBe(CheckoutStatus.CANCELLED);
  });
});
