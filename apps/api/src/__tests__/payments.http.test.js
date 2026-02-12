import { describe, test, expect } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { PaymentStatus } from "../constants/paymentStatus.js";
import { checkoutStatus } from "../constants/checkoutStatus.js";
import { registerAndLogin } from "../test_helpers/authHelper.js";
import { completeCheckout } from "../test_helpers/checkoutHelper.js";

function adminToken() {
  return jwt.sign(
    { sub: "admin-test", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

describe("POST /api/payments", () => {
  it("should create payment when checkout is valid", async () => {
    const token = await registerAndLogin(app, "payments-valid");

    // 1️⃣ Create cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;
    const cartSecret = createCartRes.body.data.cartSecret;

    // 2️⃣ Create product
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ name: "Valid Product", priceUSD: 10, stock: 5, category: "Test" });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // 3️⃣ Add item to cart
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

    // 5️⃣ Complete checkout with customer and shipping
    await completeCheckout(app, checkoutId, token);

    // 6️⃣ Create payment
    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });

    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body.data.status).toBe(PaymentStatus.PENDING);
    expect(paymentRes.body.data.checkoutId).toBe(checkoutId);
  });

  test("should create a USD payment for zelle using checkout subtotalUSD", async () => {
    const token = await registerAndLogin(app, "payments-usd");

    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;
    const cartSecret = createCartRes.body.data.cartSecret;

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

    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 2 });
    expect(addItemRes.status).toBe(200);

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    await completeCheckout(app, checkoutId, token);

    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });

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
    const token = await registerAndLogin(app, "payments-ves");

    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;
    const cartSecret = createCartRes.body.data.cartSecret;

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

    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 2 });
    expect(addItemRes.status).toBe(200);

    const patchRes = await request(app)
      .patch(`/api/cart/${cartId}/metadata`)
      .set("X-Cart-Secret", cartSecret)
      .send({
        displayCurrency: "VES",
        exchangeRate: { usdToVes: 40, asOf: "2023-01-01T00:00:00.000Z" },
      });
    expect(patchRes.status).toBe(200);

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;
    expect(checkoutRes.body.data.totals.subtotalVES).toBe(800);

    await completeCheckout(app, checkoutId, token);

    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "pago_movil" });

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

  test("should return 401 when creating payment without auth", async () => {
    const paymentRes = await request(app)
      .post("/api/payments")
      .send({ checkoutId: "some-checkout", method: "zelle" });

    expect(paymentRes.status).toBe(401);
  });

  test("should return 400 when payment method is invalid", async () => {
    const token = await registerAndLogin(app, "payments-invalid-method");

    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;
    const cartSecret = createCartRes.body.data.cartSecret;

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
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "cash" });

    expect(paymentRes.status).toBe(400);
    expect(paymentRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Invalid payment method",
      })
    );
  });

  test("should return 404 when checkout does not exist", async () => {
    const token = await registerAndLogin(app, "payments-checkout-404");

    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId: "invalid-checkout-id", method: "zelle" });

    expect(paymentRes.status).toBe(404);
    expect(paymentRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Checkout not found",
      })
    );
  });

  test("should return 400 when VES method requires exchange rate but checkout has subtotalVES null", async () => {
    const token = await registerAndLogin(app, "payments-ves-no-rate");

    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;
    const cartSecret = createCartRes.body.data.cartSecret;

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
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;
    expect(checkoutRes.body.data.totals.subtotalVES).toBeNull();

    await completeCheckout(app, checkoutId, token);

    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "pago_movil" });

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
    const token = await registerAndLogin(app, "payments-submit");

    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;
    const cartSecret = createCartRes.body.data.cartSecret;

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
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    await completeCheckout(app, checkoutId, token);

    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    const paymentId = paymentRes.body.data.paymentId;
    const previousUpdatedAt = paymentRes.body.data.updatedAt;

    const submitRes = await request(app)
      .patch(`/api/payments/${paymentId}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reference: "ABC123" });

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

  test("should return 401 when submitting without auth", async () => {
    const submitRes = await request(app)
      .patch("/api/payments/some-payment-id/submit")
      .send({ reference: "X" });

    expect(submitRes.status).toBe(401);
  });

  test("should return 403 when submitting payment owned by another user", async () => {
    const ownerToken = await registerAndLogin(app, "payments-owner");
    const otherToken = await registerAndLogin(app, "payments-other");

    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;
    const cartSecret = createCartRes.body.data.cartSecret;

    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Ownership Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    await completeCheckout(app, checkoutId, ownerToken);

    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    const paymentId = paymentRes.body.data.paymentId;

    const submitRes = await request(app)
      .patch(`/api/payments/${paymentId}/submit`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ reference: "STOLEN" });

    expect(submitRes.status).toBe(403);
  });

  test("should return 404 when payment does not exist", async () => {
    const token = await registerAndLogin(app, "payments-404");

    const submitRes = await request(app)
      .patch("/api/payments/invalid-payment-id/submit")
      .set("Authorization", `Bearer ${token}`)
      .send({ reference: "X" });

    expect(submitRes.status).toBe(404);
    expect(submitRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Payment not found",
      })
    );
  });

  test("should return 409 when payment is not pending", async () => {
    const token = await registerAndLogin(app, "payments-double-submit");

    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;
    const cartSecret = createCartRes.body.data.cartSecret;

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
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    await completeCheckout(app, checkoutId, token);

    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    const paymentId = paymentRes.body.data.paymentId;

    const firstSubmit = await request(app)
      .patch(`/api/payments/${paymentId}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reference: "FIRST123" });
    expect(firstSubmit.status).toBe(200);

    const secondSubmit = await request(app)
      .patch(`/api/payments/${paymentId}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reference: "SECOND456" });

    expect(secondSubmit.status).toBe(409);
    expect(secondSubmit.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Payment is not pending",
      })
    );
  });

  test("should return 400 when proof is invalid", async () => {
    const token = await registerAndLogin(app, "payments-invalid-proof");

    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;
    const cartSecret = createCartRes.body.data.cartSecret;

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
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    await completeCheckout(app, checkoutId, token);

    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    const paymentId = paymentRes.body.data.paymentId;

    const submitRes = await request(app)
      .patch(`/api/payments/${paymentId}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(submitRes.status).toBe(400);
    expect(submitRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Invalid payment proof",
      })
    );
  });

  test("should lock cart after payment submission", async () => {
    const token = await registerAndLogin(app, "payments-lock-cart");

    // 1️⃣ Create cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;
    const cartSecret = createCartRes.body.data.cartSecret;

    // 2️⃣ Create product
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Lock Cart Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    // 3️⃣ Add item to cart
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

    // 6️⃣ Create payment
    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    const paymentId = paymentRes.body.data.paymentId;

    // 7️⃣ Submit payment
    const submitRes = await request(app)
      .patch(`/api/payments/${paymentId}/submit`)
      .set("Authorization", `Bearer ${token}`)
      .send({ reference: "LOCK-REF-123" });
    expect(submitRes.status).toBe(200);

    // 8️⃣ Verify cart is locked - cannot add items
    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("Authorization", `Bearer ${token}`)
      .send({ productId, quantity: 1 });

    expect(addItemRes.status).toBe(409);
    expect(addItemRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Cart is not active",
      })
    );
  });

  test("should allow cart modifications when payment is only PENDING (not submitted)", async () => {
    const token = await registerAndLogin(app, "payments-pending-cart");

    // 1️⃣ Create cart
    const createCartRes = await request(app).post("/api/cart");
    expect(createCartRes.status).toBe(201);
    const cartId = createCartRes.body.data.cartId;
    const cartSecret = createCartRes.body.data.cartSecret;

    // 2️⃣ Create products
    const createProductRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Pending Cart Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(createProductRes.status).toBe(201);
    const productId = createProductRes.body.data.id;

    const createProduct2Res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({
        name: "Pending Cart Product 2",
        priceUSD: 15,
        stock: 5,
        category: "Test",
      });
    expect(createProduct2Res.status).toBe(201);
    const productId2 = createProduct2Res.body.data.id;

    // 3️⃣ Add item to cart
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

    // 6️⃣ Create payment (status = PENDING, not submitted yet)
    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body.data.status).toBe(PaymentStatus.PENDING);

    // 7️⃣ Cart should still be modifiable (payment is only PENDING)
    const addItemRes = await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("Authorization", `Bearer ${token}`)
      .send({ productId: productId2, quantity: 1 });

    expect(addItemRes.status).toBe(200);
  });
});

describe("GET /api/payments/:paymentId", () => {
  test("should return payment details for owner", async () => {
    const token = await registerAndLogin(app, "payments-get-owner");

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
        name: "Get Payment Product",
        priceUSD: 25,
        stock: 5,
        category: "Test",
      });
    expect(productRes.status).toBe(201);
    const productId = productRes.body.data.id;

    // 3️⃣ Add item
    await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 2 });

    // 4️⃣ Create checkout
    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${token}`)
      .send({ cartId });
    expect(checkoutRes.status).toBe(200);
    const checkoutId = checkoutRes.body.data.checkoutId;

    // 5️⃣ Complete checkout
    await completeCheckout(app, checkoutId, token);

    // 6️⃣ Create payment
    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    const paymentId = paymentRes.body.data.paymentId;

    // 7️⃣ GET payment
    const getRes = await request(app)
      .get(`/api/payments/${paymentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body).toEqual(
      expect.objectContaining({
        success: true,
        message: expect.any(String),
        data: expect.objectContaining({
          paymentId,
          checkoutId,
          method: "zelle",
          currency: "USD",
          amount: 50,
          status: PaymentStatus.PENDING,
        }),
      })
    );
  });

  test("should return payment details for admin", async () => {
    const ownerToken = await registerAndLogin(app, "payments-get-admin-owner");

    // Create payment as owner
    const cartRes = await request(app).post("/api/cart");
    const cartId = cartRes.body.data.cartId;
    const cartSecret = cartRes.body.data.cartSecret;

    const productRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ name: "Admin Get Product", priceUSD: 10, stock: 5, category: "Test" });
    const productId = productRes.body.data.id;

    await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ cartId });
    const checkoutId = checkoutRes.body.data.checkoutId;

    await completeCheckout(app, checkoutId, ownerToken);

    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ checkoutId, method: "zelle" });
    const paymentId = paymentRes.body.data.paymentId;

    // Admin can GET payment
    const getRes = await request(app)
      .get(`/api/payments/${paymentId}`)
      .set("Authorization", `Bearer ${adminToken()}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.paymentId).toBe(paymentId);
  });

  test("should return 401 without auth", async () => {
    const getRes = await request(app).get("/api/payments/any-payment-id");

    expect(getRes.status).toBe(401);
  });

  test("should return 403 when accessing payment owned by another user", async () => {
    const ownerToken = await registerAndLogin(app, "payments-get-forbidden-owner");
    const otherToken = await registerAndLogin(app, "payments-get-forbidden-other");

    // Create payment as owner
    const cartRes = await request(app).post("/api/cart");
    const cartId = cartRes.body.data.cartId;
    const cartSecret = cartRes.body.data.cartSecret;

    const productRes = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken()}`)
      .send({ name: "Forbidden Get Product", priceUSD: 10, stock: 5, category: "Test" });
    const productId = productRes.body.data.id;

    await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set("X-Cart-Secret", cartSecret)
      .send({ productId, quantity: 1 });

    const checkoutRes = await request(app)
      .post("/api/checkout")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ cartId });
    const checkoutId = checkoutRes.body.data.checkoutId;

    await completeCheckout(app, checkoutId, ownerToken);

    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ checkoutId, method: "zelle" });
    const paymentId = paymentRes.body.data.paymentId;

    // Other user tries to GET
    const getRes = await request(app)
      .get(`/api/payments/${paymentId}`)
      .set("Authorization", `Bearer ${otherToken}`);

    expect(getRes.status).toBe(403);
  });

  test("should return 404 when payment does not exist", async () => {
    const token = await registerAndLogin(app, "payments-get-404");

    const getRes = await request(app)
      .get("/api/payments/non-existent-payment-id")
      .set("Authorization", `Bearer ${token}`);

    expect(getRes.status).toBe(404);
  });
});
