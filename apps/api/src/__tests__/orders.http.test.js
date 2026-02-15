import { describe, test, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { OrderStatus } from "../constants/orderStatus.js";
import { registerAndLogin, registerAndLoginWithEmail } from "../test_helpers/authHelper.js";
import { createConfirmedUsdPayment, createSubmittedPayment } from "../test_helpers/paymentHelper.js";

function adminToken() {
  return jwt.sign(
    { sub: "admin-test-user", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

describe("POST /api/orders", () => {
  test("should return 409 since order is auto-created on payment confirmation", async () => {
    // Arrange: order is auto-created when payment is confirmed
    const { cartId, checkoutId, paymentId, orderId, userToken } = await createConfirmedUsdPayment(app);

    // Verify order was auto-created
    expect(orderId).toBeDefined();

    // Act: try to create order manually (should fail - already exists)
    const res = await request(app)
      .post("/api/orders")
      .set('Authorization', `Bearer ${userToken}`)
      .send({ paymentId });

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Order already exists for payment",
      })
    );

    // Verify the auto-created order exists and has correct data
    const orderRes = await request(app)
      .get(`/api/orders/${orderId}`)
      .set('Authorization', `Bearer ${userToken}`);
    
    expect(orderRes.status).toBe(200);
    const order = orderRes.body.data;
    expect(order.orderId).toBe(orderId);
    expect(order.paymentId).toBe(paymentId);
    expect(order.checkoutId).toBe(checkoutId);
    expect(order.cartId).toBe(cartId);
    expect(order.status).toBe(OrderStatus.PAID);
  });

  test("should return 404 when payment does not exist", async () => {
    // Arrange
    const token = await registerAndLogin(app, 'order');

    // Act
    const res = await request(app)
      .post("/api/orders")
      .set('Authorization', `Bearer ${token}`)
      .send({ paymentId: "invalid-payment" });

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Payment not found",
      })
    );
  });

  test("should return 409 when payment is not confirmed", async () => {
    // Arrange: create payment but only submit (not confirm)
    const { paymentId, userToken } = await createSubmittedPayment(app);

    // Act
    const res = await request(app)
      .post("/api/orders")
      .set('Authorization', `Bearer ${userToken}`)
      .send({ paymentId });

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Payment is not confirmed",
      })
    );
  });

  test("should return 409 when order already exists for payment (auto-created)", async () => {
    // Arrange: order is auto-created during confirmation
    const { paymentId, userToken } = await createConfirmedUsdPayment(app);

    // Act: try to create order (should fail - already exists)
    const res = await request(app)
      .post("/api/orders")
      .set('Authorization', `Bearer ${userToken}`)
      .send({ paymentId });

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Order already exists for payment",
      })
    );
  });

  test("should return 403 when trying to create order with a payment owned by another user", async () => {
    const intruderToken = await registerAndLogin(app, "order-intruder");

    // Create submitted (not confirmed) payment owned by a DIFFERENT user
    // (if confirmed, order would already exist)
    const { paymentId } = await createSubmittedPayment(app);

    const res = await request(app)
      .post("/api/orders")
      .set("Authorization", `Bearer ${intruderToken}`)
      .send({ paymentId });

    expect(res.status).toBe(403);
    expect(res.body).toMatchObject({
      success: false,
      message: "Forbidden",
    });
  });

});

describe("GET /api/orders/:orderId", () => {
  test("should return 200 and the order when orderId exists (owner can view)", async () => {
    // Arrange: order is auto-created during confirmation
    const { orderId, userToken } = await createConfirmedUsdPayment(app);

    // Act - Owner can view their own order
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${userToken}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );
    expect(res.body.data.orderId).toBe(orderId);
    expect(res.body.data.status).toBe(OrderStatus.PAID);
  });

  test("should return 404 when orderId does not exist", async () => {
    // Act
    const res = await request(app)
      .get("/api/orders/invalid-order")
      .set("Authorization", `Bearer ${adminToken()}`);

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Order not found",
      })
    );
  });
});
