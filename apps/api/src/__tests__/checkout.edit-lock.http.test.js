/**
 * Checkout Edit Lock HTTP Tests (C5.2)
 * 
 * Tests that checkout editing is blocked after payment submission.
 * 
 * Rules:
 * - Block editing if payment status is 'submitted' or 'confirmed'
 * - Allow editing if payment status is 'pending' or 'rejected'
 */

import { describe, test, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { registerAndLogin } from "../test_helpers/authHelper.js";
import { completeCheckout } from "../test_helpers/checkoutHelper.js";

function adminToken() {
  return jwt.sign(
    { sub: "admin-test", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

async function createCheckout(token) {
  const cartRes = await request(app).post("/api/cart");
  expect(cartRes.status).toBe(201);
  const cartId = cartRes.body.data.cartId;
  const cartSecret = cartRes.body.data.cartSecret;

  const productRes = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${adminToken()}`)
    .send({
      name: "Lock Test Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
    });
  expect(productRes.status).toBe(201);
  const productId = productRes.body.data.id;

  const addRes = await request(app)
    .post(`/api/cart/${cartId}/items`)
    .set("X-Cart-Secret", cartSecret)
    .send({ productId, quantity: 1 });
  expect(addRes.status).toBe(200);

  const checkoutRes = await request(app)
    .post("/api/checkout")
    .set("Authorization", `Bearer ${token}`)
    .send({ cartId });

  expect(checkoutRes.status).toBe(200);
  return checkoutRes.body.data.checkoutId;
}

describe("Checkout edit lock after payment submission (C5.2)", () => {
  test("should reject customer update if payment already submitted", async () => {
    const token = await registerAndLogin(app, "checkout-edit-lock-customer");

    const checkoutId = await createCheckout(token);
    await completeCheckout(app, checkoutId, token);

    // Create payment
    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    const paymentId = paymentRes.body.data.paymentId;

    // Submit payment
    const submitRes = await request(app)
      .patch(`/api/payments/${paymentId}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reference: "LOCK123" });
    expect(submitRes.status).toBe(200);

    // Try to update customer - should fail
    const patchRes = await request(app)
      .patch(`/api/checkout/${checkoutId}/customer`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "New Name" });

    expect(patchRes.status).toBe(409);
    expect(patchRes.body.success).toBe(false);
    expect(patchRes.body.message).toBe("Checkout is not editable");
  });

  test("should reject shipping update if payment already submitted", async () => {
    const token = await registerAndLogin(app, "checkout-edit-lock-shipping");

    const checkoutId = await createCheckout(token);
    await completeCheckout(app, checkoutId, token);

    // Create and submit payment
    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    const paymentId = paymentRes.body.data.paymentId;

    const submitRes = await request(app)
      .patch(`/api/payments/${paymentId}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reference: "LOCK456" });
    expect(submitRes.status).toBe(200);

    // Try to update shipping - should fail
    const patchRes = await request(app)
      .patch(`/api/checkout/${checkoutId}/shipping`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        method: "delivery",
        address: {
          recipientName: "New Name",
          phone: "0414-9999999",
          state: "Zulia",
          city: "Maracaibo",
          line1: "New Address 123",
        },
      });

    expect(patchRes.status).toBe(409);
    expect(patchRes.body.success).toBe(false);
    expect(patchRes.body.message).toBe("Checkout is not editable");
  });

  test("should allow customer update if payment is pending", async () => {
    const token = await registerAndLogin(app, "checkout-edit-pending");

    const checkoutId = await createCheckout(token);
    await completeCheckout(app, checkoutId, token);

    // Create payment but DO NOT submit
    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);

    // Update customer - should succeed
    const patchRes = await request(app)
      .patch(`/api/checkout/${checkoutId}/customer`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated Name" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.customer.name).toBe("Updated Name");
  });
});
