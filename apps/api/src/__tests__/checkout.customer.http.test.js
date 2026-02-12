import { describe, test, expect, beforeAll } from "vitest";
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

let customerAccessToken;
let otherCustomerAccessToken;

beforeAll(async () => {
  customerAccessToken = await registerAndLogin(app, "customer-checkout-customer");
  otherCustomerAccessToken = await registerAndLogin(app, "customer-checkout-other");
});

async function createCheckoutOwnedByCustomer(token) {
  // Create cart
  const cartRes = await request(app).post("/api/cart");
  expect(cartRes.status).toBe(201);
  const cartId = cartRes.body.data.cartId;
  const cartSecret = cartRes.body.data.cartSecret;

  // Create product (admin)
  const productRes = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${adminToken()}`)
    .send({
      name: "Customer Patch Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
    });

  expect(productRes.status).toBe(201);
  const productId = productRes.body.data.id;

  // Add item
  const addRes = await request(app)
    .post(`/api/cart/${cartId}/items`)
    .set("X-Cart-Secret", cartSecret)
    .send({ productId, quantity: 1 });
  expect(addRes.status).toBe(200);

  // Create checkout (auth required)
  const checkoutRes = await request(app)
    .post("/api/checkout")
    .set("Authorization", `Bearer ${token}`)
    .send({ cartId });

  expect(checkoutRes.status).toBe(200);
  return checkoutRes.body.data.checkoutId;
}

describe("PATCH /api/checkout/:checkoutId/customer", () => {
  test("should return 401 when patching customer without auth", async () => {
    const res = await request(app)
      .patch("/api/checkout/any-id/customer")
      .send({ name: "Sara" });

    expect(res.status).toBe(401);
    expect(res.body).toEqual(
      expect.objectContaining({ success: false, message: "Unauthorized" })
    );
  });

  test("should return 404 when checkout does not exist", async () => {
    const res = await request(app)
      .patch("/api/checkout/non-existent/customer")
      .set("Authorization", `Bearer ${customerAccessToken}`)
      .send({ name: "Sara" });

    expect(res.status).toBe(404);
    expect(res.body.message).toBe("Checkout not found");
  });

  test("should return 403 when checkout belongs to another user", async () => {
    const checkoutId = await createCheckoutOwnedByCustomer(customerAccessToken);

    const res = await request(app)
      .patch(`/api/checkout/${checkoutId}/customer`)
      .set("Authorization", `Bearer ${otherCustomerAccessToken}`)
      .send({ name: "Hacker" });

    expect(res.status).toBe(403);
    expect(res.body.message).toBe("Forbidden");
  });

  test("should update customer and return updated checkout", async () => {
    const checkoutId = await createCheckoutOwnedByCustomer(customerAccessToken);

    const patchRes = await request(app)
      .patch(`/api/checkout/${checkoutId}/customer`)
      .set("Authorization", `Bearer ${customerAccessToken}`)
      .send({
        name: "Sara",
        email: "sara@gmail.com",
        phone: "0414-0000000",
      });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.success).toBe(true);

    expect(patchRes.body.data).toEqual(
      expect.objectContaining({
        checkoutId,
        customer: {
          name: "Sara",
          email: "sara@gmail.com",
          phone: "0414-0000000",
        },
      })
    );

    // Bonus: verify GET returns customer too (si ya tienes GET /api/checkout/:id)
    const getRes = await request(app)
      .get(`/api/checkout/${checkoutId}`)
      .set("Authorization", `Bearer ${customerAccessToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.customer).toEqual({
      name: "Sara",
      email: "sara@gmail.com",
      phone: "0414-0000000",
    });
  });

  test("should return 409 when trying to update customer after payment is submitted", async () => {
    const token = await registerAndLogin(app, "checkout-locked-customer");

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
        name: "Lock Test Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });

    expect(productRes.status).toBe(201);
    const productId = productRes.body.data.id;

    // 3️⃣ Add item
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
      .send({ reference: "LOCK123" });

    expect(submitRes.status).toBe(200);

    // 8️⃣ Try to update customer again
    const patchRes = await request(app)
      .patch(`/api/checkout/${checkoutId}/customer`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Hacker Edit" });

    expect(patchRes.status).toBe(409);
    expect(patchRes.body).toEqual(
      expect.objectContaining({
        success: false,
        message: "Checkout is not editable",
      })
    );
  });

  test("should allow customer update when payment is only PENDING (not submitted)", async () => {
    const token = await registerAndLogin(app, "checkout-pending-edit");

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
        name: "Pending Edit Product",
        priceUSD: 10,
        stock: 5,
        category: "Test",
      });
    expect(productRes.status).toBe(201);
    const productId = productRes.body.data.id;

    // 3️⃣ Add item
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

    // 6️⃣ Create payment (status = PENDING)
    const paymentRes = await request(app)
      .post("/api/payments")
      .set("Authorization", `Bearer ${token}`)
      .send({ checkoutId, method: "zelle" });
    expect(paymentRes.status).toBe(201);
    expect(paymentRes.body.data.status).toBe("pending");
    // NOTE: Payment NOT submitted yet

    // 7️⃣ Update customer should still work
    const patchRes = await request(app)
      .patch(`/api/checkout/${checkoutId}/customer`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Updated While Pending" });

    expect(patchRes.status).toBe(200);
    expect(patchRes.body.data.customer.name).toBe("Updated While Pending");
  });

});
