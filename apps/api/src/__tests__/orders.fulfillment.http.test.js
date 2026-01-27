import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { OrderStatus } from "../constants/orderStatus.js";

/**
 * Helper to create a confirmed USD order through the full HTTP flow
 * @returns {Promise<{ orderId: string }>}
 */
async function createConfirmedUsdOrder() {
  // 1) Create cart
  const cartRes = await request(app).post("/api/cart");
  const cartId = cartRes.body.data.cartId;

  // 2) Create product
  const productRes = await request(app).post("/api/products").send({
    name: "Fulfillment Test Product",
    priceUSD: 10,
    stock: 5,
    category: "Test",
  });
  const productId = productRes.body.data.id;

  // 3) Add item to cart
  await request(app)
    .post(`/api/cart/${cartId}/items`)
    .send({ productId, quantity: 2 });

  // 4) Create checkout
  const checkoutRes = await request(app)
    .post("/api/checkout")
    .send({ cartId });
  const checkoutId = checkoutRes.body.data.checkoutId;

  // 5) Create payment
  const paymentRes = await request(app)
    .post("/api/payments")
    .send({ checkoutId, method: "zelle" });
  const paymentId = paymentRes.body.data.paymentId;

  // 6) Submit payment
  await request(app)
    .patch(`/api/payments/${paymentId}/submit`)
    .send({ reference: "ABC123" });

  // 7) Confirm payment
  await request(app)
    .patch(`/api/payments/${paymentId}/confirm`)
    .send({ note: "Confirmed" });

  // 8) Create order
  const orderRes = await request(app)
    .post("/api/orders")
    .send({ paymentId });
  const orderId = orderRes.body.data.orderId;

  return { orderId };
}

describe("PATCH /api/orders/:orderId/process", () => {
  test("should set order status to processing", async () => {
    // Arrange
    const { orderId } = await createConfirmedUsdOrder();

    // Act
    const res = await request(app).patch(`/api/orders/${orderId}/process`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toEqual(expect.any(String));
    expect(res.body.data.orderId).toBe(orderId);
    expect(res.body.data.status).toBe("processing");
    expect(typeof res.body.data.updatedAt).toBe("string");
    expect(res.body.data.updatedAt.length).toBeGreaterThan(0);
  });

  test("should return 404 when order does not exist", async () => {
    // Act
    const res = await request(app).patch("/api/orders/invalid-order/process");

    // Assert
    expect(res.status).toBe(404);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Order not found",
      })
    );
  });

  test("should return 409 when processing an order not in paid status", async () => {
    // Arrange
    const { orderId } = await createConfirmedUsdOrder();

    // First process (success)
    const firstRes = await request(app).patch(`/api/orders/${orderId}/process`);
    expect(firstRes.status).toBe(200);

    // Act: try to process again
    const res = await request(app).patch(`/api/orders/${orderId}/process`);

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Order cannot be processed",
      })
    );
  });
});

describe("PATCH /api/orders/:orderId/complete", () => {
  test("should complete an order from paid", async () => {
    // Arrange
    const { orderId } = await createConfirmedUsdOrder();

    // Act
    const res = await request(app).patch(`/api/orders/${orderId}/complete`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBe(orderId);
    expect(res.body.data.status).toBe(OrderStatus.COMPLETED);
  });

  test("should complete an order from processing", async () => {
    // Arrange
    const { orderId } = await createConfirmedUsdOrder();
    await request(app).patch(`/api/orders/${orderId}/process`);

    // Act
    const res = await request(app).patch(`/api/orders/${orderId}/complete`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(OrderStatus.COMPLETED);
  });

  test("should return 409 when completing a cancelled order", async () => {
    // Arrange
    const { orderId } = await createConfirmedUsdOrder();
    await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .send({ reason: "Out of stock" });

    // Act
    const res = await request(app).patch(`/api/orders/${orderId}/complete`);

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Order cannot be completed",
      })
    );
  });
});

describe("PATCH /api/orders/:orderId/cancel", () => {
  test("should cancel an order in paid status and store cancellation reason", async () => {
    // Arrange
    const { orderId } = await createConfirmedUsdOrder();

    // Act
    const res = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .send({ reason: "Customer requested" });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderId).toBe(orderId);
    expect(res.body.data.status).toBe(OrderStatus.CANCELLED);
    expect(res.body.data.cancellation).toEqual(
      expect.objectContaining({
        reason: "Customer requested",
      })
    );
  });

  test("should cancel an order in processing status", async () => {
    // Arrange
    const { orderId } = await createConfirmedUsdOrder();
    await request(app).patch(`/api/orders/${orderId}/process`);

    // Act
    const res = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .send({ reason: "Out of stock" });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(OrderStatus.CANCELLED);
    expect(res.body.data.cancellation.reason).toBe("Out of stock");
  });

  test("should return 409 when cancelling a completed order", async () => {
    // Arrange
    const { orderId } = await createConfirmedUsdOrder();
    await request(app).patch(`/api/orders/${orderId}/complete`);

    // Act
    const res = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .send({ reason: "Too late" });

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Order cannot be cancelled",
      })
    );
  });

  test("should return 400 when cancellation reason is invalid", async () => {
    // Arrange
    const { orderId } = await createConfirmedUsdOrder();

    // Act: empty string
    const res = await request(app)
      .patch(`/api/orders/${orderId}/cancel`)
      .send({ reason: "" });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Invalid cancellation reason",
      })
    );
  });
});
