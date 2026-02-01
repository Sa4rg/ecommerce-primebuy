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
  test("should create an order from a confirmed payment and return 201", async () => {
    // Arrange
    const token = await registerAndLogin(app, 'order');
    const { cartId, checkoutId, paymentId } = await createConfirmedUsdPayment(app);

    // Act
    const res = await request(app)
      .post("/api/orders")
      .set('Authorization', `Bearer ${token}`)
      .send({ paymentId });

    // Assert response structure
    expect(res.status).toBe(201);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    // Assert order fields
    const order = res.body.data;
    expect(typeof order.orderId).toBe("string");
    expect(order.orderId.length).toBeGreaterThan(0);
    expect(order.paymentId).toBe(paymentId);
    expect(order.checkoutId).toBe(checkoutId);
    expect(order.cartId).toBe(cartId);
    expect(order.status).toBe(OrderStatus.PAID);

    // Assert items
    expect(order.items).toHaveLength(1);
    expect(order.items[0]).toEqual(
      expect.objectContaining({
        productId: expect.any(String),
        quantity: 2,
        unitPriceUSD: 10,
        lineTotalUSD: 20,
      })
    );

    // Assert totals
    expect(order.totals.subtotalUSD).toBe(20);
    expect(order.totals.currency).toBe("USD");
    expect(order.totals.amountPaid).toBe(20);

    // Assert payment snapshot
    expect(order.payment.method).toBe("zelle");
    expect(order.payment.proof).toEqual(
      expect.objectContaining({
        reference: "ABC123",
      })
    );

    // Assert timestamps
    expect(typeof order.createdAt).toBe("string");
    expect(order.createdAt.length).toBeGreaterThan(0);
    expect(typeof order.updatedAt).toBe("string");
    expect(order.updatedAt.length).toBeGreaterThan(0);

    // Assert cart is finalized (checked_out)
    const cartRes = await request(app).get(`/api/cart/${cartId}`);
    expect(cartRes.status).toBe(200);
    expect(cartRes.body.data.metadata.status).toBe("checked_out");
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
    const token = await registerAndLogin(app, 'order');
    const { paymentId } = await createSubmittedPayment(app);

    // Act
    const res = await request(app)
      .post("/api/orders")
      .set('Authorization', `Bearer ${token}`)
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

  test("should return 409 when order already exists for payment", async () => {
    // Arrange
    const token = await registerAndLogin(app, 'order');
    const { paymentId } = await createConfirmedUsdPayment(app);

    // Create order first time
    const firstRes = await request(app)
      .post("/api/orders")
      .set('Authorization', `Bearer ${token}`)
      .send({ paymentId });
    expect(firstRes.status).toBe(201);

    // Act: try to create order again with same paymentId
    const res = await request(app)
      .post("/api/orders")
      .set('Authorization', `Bearer ${token}`)
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
});

describe("GET /api/orders/:orderId", () => {
  test("should return 200 and the order when orderId exists (owner can view)", async () => {
    // Arrange: create user and payment with matching customer email
    const { token, email } = await registerAndLoginWithEmail(app, 'order');
    const { paymentId } = await createConfirmedUsdPayment(app, { customerEmail: email });

    const createOrderRes = await request(app)
      .post("/api/orders")
      .set('Authorization', `Bearer ${token}`)
      .send({ paymentId });
    expect(createOrderRes.status).toBe(201);
    const orderId = createOrderRes.body.data.orderId;

    // Act - Owner can view their own order
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${token}`);

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
