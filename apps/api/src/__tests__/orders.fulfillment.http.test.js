import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { OrderStatus } from "../constants/orderStatus.js";
import { createConfirmedUsdOrder } from "../test_helpers/orderHelper.js";

describe("PATCH /api/orders/:orderId/process", () => {
  test("should set order status to processing", async () => {
    // Arrange
    const { orderId } = await createConfirmedUsdOrder(app, 'fulfillment');

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
    const { orderId } = await createConfirmedUsdOrder(app, 'fulfillment');

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
    const { orderId } = await createConfirmedUsdOrder(app, 'fulfillment');

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
    const { orderId } = await createConfirmedUsdOrder(app, 'fulfillment');
    await request(app).patch(`/api/orders/${orderId}/process`);

    // Act
    const res = await request(app).patch(`/api/orders/${orderId}/complete`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe(OrderStatus.COMPLETED);
  });

  test("should return 409 when completing a cancelled order", async () => {
    // Arrange
    const { orderId } = await createConfirmedUsdOrder(app, 'fulfillment');
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
    const { orderId } = await createConfirmedUsdOrder(app, 'fulfillment');

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
    const { orderId } = await createConfirmedUsdOrder(app, 'fulfillment');
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
    const { orderId } = await createConfirmedUsdOrder(app, 'fulfillment');
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
    const { orderId } = await createConfirmedUsdOrder(app, 'fulfillment');

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
