import { describe, test, expect, beforeAll } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../app.js";
import { registerAndLogin } from "../test_helpers/authHelper.js";

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
});
