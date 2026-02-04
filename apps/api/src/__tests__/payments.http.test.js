import { describe, test, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { PaymentStatus } from "../constants/paymentStatus.js";
import { registerAndLogin } from "../test_helpers/authHelper.js";

function adminToken() {
  return jwt.sign(
    { sub: "admin-test", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

async function customerToken() {
  return registerAndLogin(app, "customer-payments");
}


describe("POST /api/payments", () => {
  test("should create a USD payment for zelle using checkout subtotalUSD", async () => {
    // Arrange: create cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    // Arrange: create product
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Payment Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // Arrange: add item to cart
    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 2 });
    expect(addItemRes.status).toBe(200);

    // Arrange: create checkout
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${await customerToken()}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    // Act: create payment
    const paymentRes = await request(app)
      .post("/api/payments")
      .send({ checkoutId, method: "zelle" });

    // Assert
    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    expect(typeof paymentRes.body.data.paymentId).toBe("string");
    expect(paymentRes.body.data.paymentId.length).toBeGreaterThan(0);
    expect(paymentRes.body.data.checkoutId).toBe(checkoutId);
    expect(paymentRes.body.data.method).toBe("zelle");
    expect(paymentRes.body.data.currency).toBe("USD");
    expect(paymentRes.body.data.amount).toBe(20);
    expect(paymentRes.body.data.status).toBe(PaymentStatus.PENDING);
    expect(paymentRes.body.data.proof).toBeNull();
    expect(typeof paymentRes.body.data.createdAt).toBe("string");
    expect(typeof paymentRes.body.data.updatedAt).toBe("string");
  });

  test("should create a VES payment for pago_movil using checkout subtotalVES", async () => {
    // Arrange: create cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    // Arrange: create product
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "VES Payment Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // Arrange: add item to cart
    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 2 });
    expect(addItemRes.status).toBe(200);

    // Arrange: patch cart metadata to VES
    const patchRes = await request(app)
      .patch(`/api/cart/${cartId}/metadata`)
      .send({
        displayCurrency: "VES",
        exchangeRate: { usdToVes: 40, asOf: "2023-01-01T00:00:00.000Z" },
      });
    expect(patchRes.status).toBe(200);

    // Arrange: create checkout
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${await customerToken()}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;
    expect(checkoutRes.body.data.totals.subtotalVES).toBe(800);

    // Act: create payment
    const paymentRes = await request(app)
      .post("/api/payments")
      .send({ checkoutId, method: "pago_movil" });

    // Assert
    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    expect(paymentRes.body.data.method).toBe("pago_movil");
    expect(paymentRes.body.data.currency).toBe("VES");
    expect(paymentRes.body.data.amount).toBe(800);
    expect(paymentRes.body.data.status).toBe(PaymentStatus.PENDING);
  });

  test("should return 400 when payment method is invalid", async () => {
    // Arrange: create minimal valid checkout
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${await customerToken()}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    // Act: create payment with invalid method
    const paymentRes = await request(app)
      .post("/api/payments")
      .send({ checkoutId, method: "cash" });

    // Assert
    expect(paymentRes.status).toBe(400);
    expect(paymentRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Invalid payment method",
      })
    );
  });

  test("should return 404 when checkout does not exist", async () => {
    // Act
    const paymentRes = await request(app)
      .post("/api/payments")
      .send({ checkoutId: "invalid-checkout-id", method: "zelle" });

    // Assert
    expect(paymentRes.status).toBe(404);
    expect(paymentRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Checkout not found",
      })
    );
  });

  test("should return 400 when VES method requires exchange rate but checkout has subtotalVES null", async () => {
    // Arrange: create cart without VES configuration
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });

    // Create checkout WITHOUT patching metadata (subtotalVES will be null)
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${await customerToken()}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;
    expect(checkoutRes.body.data.totals.subtotalVES).toBeNull();

    // Act: try to create VES payment
    const paymentRes = await request(app)
      .post("/api/payments")
      .send({ checkoutId, method: "pago_movil" });

    // Assert
    expect(paymentRes.status).toBe(400);
    expect(paymentRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Exchange rate required",
      })
    );
  });
});

describe("PATCH /api/payments/:paymentId/submit", () => {
  test("should submit a pending payment and set status submitted", async () => {
    // Arrange: create valid checkout
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Submit Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${await customerToken()}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    // Arrange: create payment
    const paymentRes = await request(app)
      .post("/api/payments")
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    const paymentId = paymentRes.body.data.paymentId;
    const previousUpdatedAt = paymentRes.body.data.updatedAt;

    // Act: submit payment
    const submitRes = await request(app)
      .patch(`/api/payments/${paymentId}/submit`)
      .send({ reference: "ABC123" });

    // Assert
    expect(submitRes.status).toBe(200);
    expect(submitRes.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    expect(submitRes.body.data.paymentId).toBe(paymentId);
    expect(submitRes.body.data.status).toBe(PaymentStatus.SUBMITTED);
    expect(submitRes.body.data.proof).toEqual({ reference: "ABC123" });
    expect(typeof submitRes.body.data.updatedAt).toBe("string");
    expect(submitRes.body.data.updatedAt).not.toBe(previousUpdatedAt);
  });

  test("should return 404 when payment does not exist", async () => {
    // Act
    const submitRes = await request(app)
      .patch("/api/payments/invalid-payment-id/submit")
      .send({ reference: "X" });

    // Assert
    expect(submitRes.status).toBe(404);
    expect(submitRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Payment not found",
      })
    );
  });

  test("should return 409 when payment is not pending", async () => {
    // Arrange: create checkout and payment
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Double Submit Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${await customerToken()}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    const paymentRes = await request(app)
      .post("/api/payments")
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    const paymentId = paymentRes.body.data.paymentId;

    // Arrange: submit once successfully
    const firstSubmit = await request(app)
      .patch(`/api/payments/${paymentId}/submit`)
      .send({ reference: "FIRST123" });
    expect(firstSubmit.status).toBe(200);

    // Act: try to submit again
    const secondSubmit = await request(app)
      .patch(`/api/payments/${paymentId}/submit`)
      .send({ reference: "SECOND456" });

    // Assert
    expect(secondSubmit.status).toBe(409);
    expect(secondSubmit.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Payment is not pending",
      })
    );
  });

  test("should return 400 when proof is invalid", async () => {
    // Arrange: create checkout and payment
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Invalid Proof Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    await request(app)
      .post(`/api/cart/${cartId}/items`)
      .send({ productId, quantity: 1 });

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${await customerToken()}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    const paymentRes = await request(app)
      .post("/api/payments")
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    const paymentId = paymentRes.body.data.paymentId;

    // Act: submit with empty proof (no reference)
    const submitRes = await request(app)
      .patch(`/api/payments/${paymentId}/submit`)
      .send({});

    // Assert
    expect(submitRes.status).toBe(400);
    expect(submitRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Invalid payment proof",
      })
    );
  });
});
