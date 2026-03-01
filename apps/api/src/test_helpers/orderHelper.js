/**
 * Order Helper for HTTP Integration Tests
 */
import request from "supertest";
import jwt from "jsonwebtoken";
import { expect } from "vitest";
import { registerAndLogin } from "../test_helpers/authHelper.js";

function adminToken() {
  return jwt.sign(
    { sub: "admin-order-helper", role: "admin" },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
}

/**
 * Create a confirmed USD order through the full HTTP flow:
 * cart → product → add item → checkout → payment → submit → confirm → order
 *
 * @param {Express.Application} app
 * @param {Object} [options]
 * @param {string} [options.prefix='order']
 * @param {string} [options.userToken] - If provided, uses this token (same user) instead of registering new one
 * @param {'local_delivery'|'pickup'|'national_shipping'} [options.shippingMethod='local_delivery']
 * @returns {Promise<{ orderId: string, paymentId: string, cartId: string, checkoutId: string, userToken: string }>}
 */
async function createConfirmedUsdOrder(app, options = {}) {
  const {
    prefix = "order",
    userToken: providedToken,
    shippingMethod = "local_delivery",
  } = options;

  const userToken = providedToken || (await registerAndLogin(app, `${prefix}-${Date.now()}`));

  // 1) Create cart (anonymous)
  const cartRes = await request(app).post("/api/cart");
  expect(cartRes.status).toBe(201);
  const cartId = cartRes.body.data.cartId;
  const cartSecret = cartRes.body.data.cartSecret;

  // 2) Create product (admin)
  const productRes = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${adminToken()}`)
    .send({
      name: "Order Test Product",
      priceUSD: 10,
      stock: 5,
      category: "Test",
    });
  expect(productRes.status).toBe(201);
  const productId = productRes.body.data.id;

  // 3) Add item to cart (anonymous requires secret)
  const addItemRes = await request(app)
    .post(`/api/cart/${cartId}/items`)
    .set("X-Cart-Secret", cartSecret)
    .send({ productId, quantity: 2 });
  expect(addItemRes.status).toBe(200);

  // 4) Create checkout (claims cart, requires auth)
  const checkoutRes = await request(app)
    .post("/api/checkout")
    .set("Authorization", `Bearer ${userToken}`)
    .send({ cartId });
  expect(checkoutRes.status).toBe(200);
  const checkoutId = checkoutRes.body.data.checkoutId;

  // 4.5) Set customer info
  const customerRes = await request(app)
    .patch(`/api/checkout/${checkoutId}/customer`)
    .set("Authorization", `Bearer ${userToken}`)
    .send({ name: "Test User", email: "test@example.com", phone: "0414-1234567" });
  expect(customerRes.status).toBe(200);

  // 4.6) Set shipping info
  const shippingPayload =
    shippingMethod === "pickup"
      ? { method: "pickup", address: null }
      : {
          method: shippingMethod,
          address: {
            recipientName: "Test User",
            phone: "0414-1234567",
            state: "Carabobo",
            city: "Valencia",
            line1: "Av Principal",
            reference: "Near the park",
          },
        };

  const shippingRes = await request(app)
    .patch(`/api/checkout/${checkoutId}/shipping`)
    .set("Authorization", `Bearer ${userToken}`)
    .send(shippingPayload);
  expect(shippingRes.status).toBe(200);

  // 5) Create payment
  const paymentRes = await request(app)
    .post("/api/payments")
    .set("Authorization", `Bearer ${userToken}`)
    .send({ checkoutId, method: "zelle" });
  expect(paymentRes.status).toBe(201);
  const paymentId = paymentRes.body.data.paymentId;

  // 6) Submit payment
  const submitRes = await request(app)
    .patch(`/api/payments/${paymentId}/submit`)
    .set("Authorization", `Bearer ${userToken}`)
    .send({ reference: "ABC123" });
  expect(submitRes.status).toBe(200);

  // 7) Confirm payment (admin) -> order auto-created
  const confirmRes = await request(app)
    .patch(`/api/payments/${paymentId}/confirm`)
    .set("Authorization", `Bearer ${adminToken()}`)
    .send({ note: "Confirmed" });
  expect(confirmRes.status).toBe(200);

  const orderId = confirmRes.body.data.order.orderId;

  return { orderId, paymentId, cartId, checkoutId, userToken };
}

export { createConfirmedUsdOrder };