import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";

/**
 * Helper function to create a confirmed USD payment through the full flow:
 * cart → product → add item → checkout → payment → submit → confirm
 * @returns {{ cartId: string, checkoutId: string, paymentId: string }}
 */
async function createConfirmedUsdPayment() {
  // Create cart
  const createCartRes = await request(app).post("/api/cart");
  expect(createCartRes.status).toBe(201);
  const cartId = createCartRes.body.data.cartId;

  // Create product
  const createProductRes = await request(app).post("/api/products").send({
    name: "Order Test Product",
    priceUSD: 10,
    stock: 5,
    category: "Test",
  });
  expect(createProductRes.status).toBe(201);
  const productId = createProductRes.body.data.id;

  // Add item to cart (quantity 2 → total 20 USD)
  const addItemRes = await request(app)
    .post(`/api/cart/${cartId}/items`)
    .send({ productId, quantity: 2 });
  expect(addItemRes.status).toBe(200);

  // Create checkout
  const checkoutRes = await request(app)
    .post("/api/checkout")
    .send({ cartId });
  expect(checkoutRes.status).toBe(200);
  const checkoutId = checkoutRes.body.data.checkoutId;

  // Create payment
  const paymentRes = await request(app)
    .post("/api/payments")
    .send({ checkoutId, method: "zelle" });
  expect(paymentRes.status).toBe(201);
  const paymentId = paymentRes.body.data.paymentId;

  // Submit payment
  const submitRes = await request(app)
    .patch(`/api/payments/${paymentId}/submit`)
    .send({ reference: "ABC123" });
  expect(submitRes.status).toBe(200);

  // Confirm payment
  const confirmRes = await request(app)
    .patch(`/api/payments/${paymentId}/confirm`)
    .send({ note: "Confirmed" });
  expect(confirmRes.status).toBe(200);

  return { cartId, checkoutId, paymentId };
}

/**
 * Helper to create a submitted (not confirmed) payment
 * @returns {{ cartId: string, checkoutId: string, paymentId: string }}
 */
async function createSubmittedPayment() {
  // Create cart
  const createCartRes = await request(app).post("/api/cart");
  expect(createCartRes.status).toBe(201);
  const cartId = createCartRes.body.data.cartId;

  // Create product
  const createProductRes = await request(app).post("/api/products").send({
    name: "Submitted Payment Product",
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

  // Create checkout
  const checkoutRes = await request(app)
    .post("/api/checkout")
    .send({ cartId });
  expect(checkoutRes.status).toBe(200);
  const checkoutId = checkoutRes.body.data.checkoutId;

  // Create payment
  const paymentRes = await request(app)
    .post("/api/payments")
    .send({ checkoutId, method: "zelle" });
  expect(paymentRes.status).toBe(201);
  const paymentId = paymentRes.body.data.paymentId;

  // Submit payment (but DO NOT confirm)
  const submitRes = await request(app)
    .patch(`/api/payments/${paymentId}/submit`)
    .send({ reference: "REF-SUBMITTED" });
  expect(submitRes.status).toBe(200);

  return { cartId, checkoutId, paymentId };
}

describe("POST /api/orders", () => {
  test("should create an order from a confirmed payment and return 201", async () => {
    // Arrange
    const { cartId, checkoutId, paymentId } = await createConfirmedUsdPayment();

    // Act
    const res = await request(app)
      .post("/api/orders")
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
    expect(order.status).toBe("created");

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
    // Act
    const res = await request(app)
      .post("/api/orders")
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
    const { paymentId } = await createSubmittedPayment();

    // Act
    const res = await request(app)
      .post("/api/orders")
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
    const { paymentId } = await createConfirmedUsdPayment();

    // Create order first time
    const firstRes = await request(app)
      .post("/api/orders")
      .send({ paymentId });
    expect(firstRes.status).toBe(201);

    // Act: try to create order again with same paymentId
    const res = await request(app)
      .post("/api/orders")
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
  test("should return 200 and the order when orderId exists", async () => {
    // Arrange: create confirmed payment and order
    const { paymentId } = await createConfirmedUsdPayment();

    const createOrderRes = await request(app)
      .post("/api/orders")
      .send({ paymentId });
    expect(createOrderRes.status).toBe(201);
    const orderId = createOrderRes.body.data.orderId;

    // Act
    const res = await request(app).get(`/api/orders/${orderId}`);

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
    expect(res.body.data.status).toBe("created");
  });

  test("should return 404 when orderId does not exist", async () => {
    // Act
    const res = await request(app).get("/api/orders/invalid-order");

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
