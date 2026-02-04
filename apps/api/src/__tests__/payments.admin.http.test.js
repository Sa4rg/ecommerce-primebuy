import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { PaymentStatus } from "../constants/paymentStatus.js";
const jwt = require("jsonwebtoken");
import { registerAndLogin } from "../test_helpers/authHelper.js";

function adminToken() {
  return jwt.sign(
    { sub: "admin-test-user", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

async function customerToken() {
  return registerAndLogin(app, "customer-payments");
}


async function createSubmittedPayment() {
  // Create cart
  const createCartRes = await request(app).post("/api/cart");
  expect(createCartRes.status).toBe(201);
  const cartId = createCartRes.body.data.cartId;

  // Create product (requires admin)
  const createProductRes = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${adminToken()}`)
    .send({
      name: "Admin Review Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
    });
  expect(createProductRes.status).toBe(201);
  const productId = createProductRes.body.data.id;

  // Add item to cart
  await request(app)
    .post(`/api/cart/${cartId}/items`)
    .send({ productId, quantity: 1 });

  // Create checkout
  const checkoutRes = await request(app)
    .post("/api/checkout")
    .set("Authorization", `Bearer ${await customerToken()}`)
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
    .set("Authorization", `Bearer ${await customerToken()}`)
    .send({ reference: "ABC123" });
  expect(submitRes.status).toBe(200);
  const previousUpdatedAt = submitRes.body.data.updatedAt;

  return { paymentId, previousUpdatedAt };
}


describe("PATCH /api/payments/:id/confirm - authorization", () => {
    it("should return 401 without token", async () => {
    const { paymentId } = await createSubmittedPayment();

    const res = await request(app)
      .patch(`/api/payments/${paymentId}/confirm`)
      .send({ note: "ok" });

    expect(res.status).toBe(401);
  });


  it("should return 403 for non-admin token", async () => {
    const token = await customerToken();
    const { paymentId } = await createSubmittedPayment();

    const res = await request(app)
      .patch(`/api/payments/${paymentId}/confirm`)
      .set("Authorization", `Bearer ${token}`)
      .send({ note: "ok" });

    expect(res.status).toBe(403);
  });
});


describe("PATCH /api/payments/:paymentId/confirm", () => {
  test("should confirm a submitted payment and update updatedAt", async () => {
    // Arrange
    const { paymentId, previousUpdatedAt } = await createSubmittedPayment();

    // Act
    const confirmRes = await request(app)
      .patch(`/api/payments/${paymentId}/confirm`)
       .set("Authorization", `Bearer ${adminToken()}`)
      .send({ note: "Confirmed in bank" });

    // Assert
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    expect(confirmRes.body.data.paymentId).toBe(paymentId);
    expect(confirmRes.body.data.status).toBe(PaymentStatus.CONFIRMED);
    expect(confirmRes.body.data.review.note).toBe("Confirmed in bank");
    expect(typeof confirmRes.body.data.updatedAt).toBe("string");
    expect(confirmRes.body.data.updatedAt).not.toBe(previousUpdatedAt);
  });

  test("should confirm without note and set review.note null", async () => {
    // Arrange
    const { paymentId, previousUpdatedAt } = await createSubmittedPayment();

    // Act
    const confirmRes = await request(app)
      .patch(`/api/payments/${paymentId}/confirm`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ note: null });  

    // Assert
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe(PaymentStatus.CONFIRMED);
    expect(confirmRes.body.data.review.note).toBeNull();
    expect(confirmRes.body.data.updatedAt).not.toBe(previousUpdatedAt);
  });

  test("should return 404 when payment not found", async () => {
    // Act
    const confirmRes = await request(app)
      .patch("/api/payments/invalid-payment/confirm")
       .set("Authorization", `Bearer ${adminToken()}`)
      .send({ note: "x" });

    // Assert
    expect(confirmRes.status).toBe(404);
    expect(confirmRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Payment not found",
      })
    );
  });

  test("should return 409 when payment is not submitted", async () => {
    // Arrange: create pending payment (do NOT submit)
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Pending Product",
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
    expect(paymentRes.body.data.status).toBe(PaymentStatus.PENDING);

    // Act: try to confirm pending payment
    const confirmRes = await request(app)
      .patch(`/api/payments/${paymentId}/confirm`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ note: "x" });

    // Assert
    expect(confirmRes.status).toBe(409);
    expect(confirmRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Payment is not submitted",
      })
    );
  });

  test("should return 400 when note is invalid", async () => {
    // Arrange
    const { paymentId } = await createSubmittedPayment();

    // Act + Assert: empty note
    const emptyNoteRes = await request(app)
      .patch(`/api/payments/${paymentId}/confirm`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ note: "" });

    expect(emptyNoteRes.status).toBe(400);
    expect(emptyNoteRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Invalid payment review",
      })
    );

    // Act + Assert: whitespace-only note
    const whitespaceNoteRes = await request(app)
      .patch(`/api/payments/${paymentId}/confirm`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ note: "   " });

    expect(whitespaceNoteRes.status).toBe(400);
    expect(whitespaceNoteRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Invalid payment review",
      })
    );
  });
});

describe("PATCH /api/payments/:paymentId/reject", () => {
  test("should reject a submitted payment and update updatedAt", async () => {
    // Arrange
    const { paymentId, previousUpdatedAt } = await createSubmittedPayment();

    // Act
    const rejectRes = await request(app)
      .patch(`/api/payments/${paymentId}/reject`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ reason: "Reference not found" });

    // Assert
    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.any(Object),
      })
    );

    expect(rejectRes.body.data.paymentId).toBe(paymentId);
    expect(rejectRes.body.data.status).toBe(PaymentStatus.REJECTED);
    expect(rejectRes.body.data.review.reason).toBe("Reference not found");
    expect(typeof rejectRes.body.data.updatedAt).toBe("string");
    expect(rejectRes.body.data.updatedAt).not.toBe(previousUpdatedAt);
  });

  test("should return 404 when payment not found", async () => {
    // Act
    const rejectRes = await request(app)
      .patch("/api/payments/invalid-payment/reject")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ reason: "x" });

    // Assert
    expect(rejectRes.status).toBe(404);
    expect(rejectRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Payment not found",
      })
    );
  });

  test("should return 409 when payment is not submitted", async () => {
    // Arrange: create pending payment (do NOT submit)
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;

    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Pending Reject Product",
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

    // Act: try to reject pending payment
    const rejectRes = await request(app)
      .patch(`/api/payments/${paymentId}/reject`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ reason: "x" });

    // Assert
    expect(rejectRes.status).toBe(409);
    expect(rejectRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Payment is not submitted",
      })
    );
  });

  test("should return 400 when reason is invalid", async () => {
    // Arrange
    const { paymentId } = await createSubmittedPayment();

    // Act + Assert: empty reason
    const emptyReasonRes = await request(app)
      .patch(`/api/payments/${paymentId}/reject`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ reason: "" });

    expect(emptyReasonRes.status).toBe(400);
    expect(emptyReasonRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Invalid payment review",
      })
    );

    // Act + Assert: whitespace-only reason
    const whitespaceReasonRes = await request(app)
      .patch(`/api/payments/${paymentId}/reject`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ reason: "   " });

    expect(whitespaceReasonRes.status).toBe(400);
    expect(whitespaceReasonRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Invalid payment review",
      })
    );
  });
});
