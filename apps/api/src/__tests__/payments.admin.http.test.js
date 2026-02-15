import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../app.js";
import { PaymentStatus } from "../constants/paymentStatus.js";
import jwt from "jsonwebtoken";
import { registerAndLogin } from "../test_helpers/authHelper.js";
import { completeCheckout } from "../test_helpers/checkoutHelper.js";

function adminToken() {
  return jwt.sign(
    { sub: "admin-test-user", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

/**
 * Creates a payment in SUBMITTED status (ready for admin review).
 * Full flow: cart → product → checkout → complete → payment → submit
 */
async function createSubmittedPayment({ testId, productName = "Test Product" }) {
  const customerToken = await registerAndLogin(app, testId);

  const cartRes = await request(app).post("/api/cart");
  expect(cartRes.status).toBe(201);
  const cartId = cartRes.body.data.cartId;
  const cartSecret = cartRes.body.data.cartSecret;

  const productRes = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${adminToken()}`)
    .send({ name: productName, priceUSD: 10, stock: 5, category: "Test" });
  expect(productRes.status).toBe(201);
  const productId = productRes.body.data.id;

  await request(app)
    .post(`/api/cart/${cartId}/items`)
    .set("X-Cart-Secret", cartSecret)
    .send({ productId, quantity: 1 });

  const checkoutRes = await request(app)
    .post("/api/checkout")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ cartId });
  expect(checkoutRes.status).toBe(200);
  const checkoutId = checkoutRes.body.data.checkoutId;

  await completeCheckout(app, checkoutId, customerToken);

  const paymentRes = await request(app)
    .post("/api/payments")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ checkoutId, method: "zelle" });
  expect(paymentRes.status).toBe(201);
  const paymentId = paymentRes.body.data.paymentId;

  const submitRes = await request(app)
    .patch(`/api/payments/${paymentId}/submit`)
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ reference: "ABC123" });
  expect(submitRes.status).toBe(200);

  return {
    customerToken,
    paymentId,
    previousUpdatedAt: submitRes.body.data.updatedAt,
  };
}

/**
 * Creates a payment in PENDING status (not yet submitted).
 * Full flow: cart → product → checkout → complete → payment (no submit)
 */
async function createPendingPayment({ testId, productName = "Test Product" }) {
  const customerToken = await registerAndLogin(app, testId);

  const cartRes = await request(app).post("/api/cart");
  expect(cartRes.status).toBe(201);
  const cartId = cartRes.body.data.cartId;
  const cartSecret = cartRes.body.data.cartSecret;

  const productRes = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${adminToken()}`)
    .send({ name: productName, priceUSD: 10, stock: 5, category: "Test" });
  expect(productRes.status).toBe(201);
  const productId = productRes.body.data.id;

  await request(app)
    .post(`/api/cart/${cartId}/items`)
    .set("X-Cart-Secret", cartSecret)
    .send({ productId, quantity: 1 });

  const checkoutRes = await request(app)
    .post("/api/checkout")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ cartId });
  expect(checkoutRes.status).toBe(200);
  const checkoutId = checkoutRes.body.data.checkoutId;

  await completeCheckout(app, checkoutId, customerToken);

  const paymentRes = await request(app)
    .post("/api/payments")
    .set("Authorization", `Bearer ${customerToken}`)
    .send({ checkoutId, method: "zelle" });
  expect(paymentRes.status).toBe(201);

  return {
    customerToken,
    paymentId: paymentRes.body.data.paymentId,
  };
}


describe("PATCH /api/payments/:id/confirm - authorization", () => {
  test("should return 401 without token", async () => {
    const { paymentId } = await createSubmittedPayment({ testId: "confirm-401-test" });

    // Act: confirm WITHOUT token
    const res = await request(app)
      .patch(`/api/payments/${paymentId}/confirm`)
      .send({ note: "ok" });

    expect(res.status).toBe(401);
  });


  test("should return 403 for non-admin token", async () => {
    const { customerToken, paymentId } = await createSubmittedPayment({ testId: "confirm-403-test" });

    // Act: confirm with customer token (non-admin)
    const res = await request(app)
      .patch(`/api/payments/${paymentId}/confirm`)
      .set("Authorization", `Bearer ${customerToken}`)
      .send({ note: "ok" });

    expect(res.status).toBe(403);
  });
});


describe("PATCH /api/payments/:paymentId/confirm", () => {
  test("should confirm a submitted payment and update updatedAt", async () => {
    const { paymentId, previousUpdatedAt } = await createSubmittedPayment({ testId: "confirm-success-test" });

    // Admin action
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

    expect(confirmRes.body.data.payment.paymentId).toBe(paymentId);
    expect(confirmRes.body.data.payment.status).toBe(PaymentStatus.CONFIRMED);
    expect(confirmRes.body.data.payment.review.note).toBe("Confirmed in bank");
    expect(typeof confirmRes.body.data.payment.updatedAt).toBe("string");
    expect(confirmRes.body.data.payment.updatedAt).not.toBe(previousUpdatedAt);
    // Order should be auto-created
    expect(confirmRes.body.data.order).toBeDefined();
    expect(confirmRes.body.data.order.orderId).toBeDefined();
  });

  test("should confirm without note and set review.note null", async () => {
    const { paymentId, previousUpdatedAt } = await createSubmittedPayment({ testId: "confirm-no-note-test" });

    // Admin action
    const confirmRes = await request(app)
      .patch(`/api/payments/${paymentId}/confirm`)
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ note: null });

    // Assert
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.payment.status).toBe(PaymentStatus.CONFIRMED);
    expect(confirmRes.body.data.payment.review.note).toBeNull();
    expect(confirmRes.body.data.payment.updatedAt).not.toBe(previousUpdatedAt);
    expect(confirmRes.body.data.order).toBeDefined();
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
    const { paymentId } = await createPendingPayment({ testId: "confirm-409-test" });

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
    const { paymentId } = await createSubmittedPayment({ testId: "confirm-400-note-test" });

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
    const { paymentId, previousUpdatedAt } = await createSubmittedPayment({ testId: "reject-success-test" });

    // Admin action
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
    const { paymentId } = await createPendingPayment({ testId: "reject-409-test" });

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
    const { paymentId } = await createSubmittedPayment({ testId: "reject-400-reason-test" });

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

describe("GET /api/payments (admin list)", () => {
  test("should return list of all payments for admin", async () => {
    // Create a pending payment to ensure list is not empty
    await createPendingPayment({ testId: "list-payments-admin" });

    // Admin lists payments
    const listRes = await request(app)
      .get("/api/payments")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data)).toBe(true);
    expect(listRes.body.data.length).toBeGreaterThan(0);
  });

  test("should filter payments by status", async () => {
    // Create a submitted payment to filter by
    await createSubmittedPayment({ testId: "list-payments-filter" });

    // Filter by status=submitted
    const listRes = await request(app)
      .get("/api/payments?status=submitted")
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThan(0);
    expect(listRes.body.data.every(p => p.status === PaymentStatus.SUBMITTED)).toBe(true);
  });

  test("should return 401 without auth", async () => {
    const listRes = await request(app).get("/api/payments");

    expect(listRes.status).toBe(401);
  });

  test("should return 403 for non-admin user", async () => {
    const customerToken = await registerAndLogin(app, "list-payments-forbidden");

    const listRes = await request(app)
      .get("/api/payments")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(listRes.status).toBe(403);
  });
});
