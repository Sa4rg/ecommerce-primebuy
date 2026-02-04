/**
 * Order Helper for HTTP Integration Tests
 *
 * Provides utilities for creating orders in various states.
 */
import app from "../app.js";
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { registerAndLogin } from '../test_helpers/authHelper.js';

/**
 * Generate an admin JWT token for test purposes
 */
function adminToken() {
  return jwt.sign(
    { sub: 'admin-order-helper', role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

async function customerToken() {
  return registerAndLogin(app, "customer-payments");
}

/**
 * Create a confirmed USD order through the full HTTP flow:
 * cart → product → add item → checkout → payment → submit → confirm → order
 * @param {Express.Application} app - Express app instance
 * @param {string} [prefix='order'] - Prefix for the test user email
 * @returns {Promise<{ orderId: string, paymentId: string, cartId: string, checkoutId: string }>}
 */
async function createConfirmedUsdOrder(app, prefix = 'order') {
  // 1) Create cart
  const cartRes = await request(app).post('/api/cart');
  const cartId = cartRes.body.data.cartId;

  // 2) Create product (requires admin)
  const productRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken()}`)
    .send({
      name: 'Order Test Product',
      priceUSD: 10,
      stock: 5,
      category: 'Test',
    });
  const productId = productRes.body.data.id;

  // 3) Add item to cart
  await request(app)
    .post(`/api/cart/${cartId}/items`)
    .send({ productId, quantity: 2 });

  // 4) Create checkout
  const checkoutRes = await request(app)
  .post('/api/checkout')
  .set('Authorization', `Bearer ${await customerToken()}`)
  .send({ cartId });
  expect(checkoutRes.status).toBe(200);
  const checkoutId = checkoutRes.body.data.checkoutId;

  // 5) Create payment
  const paymentRes = await request(app)
    .post('/api/payments')
    .send({ checkoutId, method: 'zelle' });
  const paymentId = paymentRes.body.data.paymentId;

  // 6) Submit payment
  await request(app)
    .patch(`/api/payments/${paymentId}/submit`)
    .send({ reference: 'ABC123' });

  // 7) Confirm payment (requires admin)
  await request(app)
    .patch(`/api/payments/${paymentId}/confirm`)
    .set('Authorization', `Bearer ${adminToken()}`)
    .send({ note: 'Confirmed' });

  // 8) Create order with auth
  const token = await registerAndLogin(app, prefix);
  const orderRes = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ paymentId });
  const orderId = orderRes.body.data.orderId;

  return { orderId, paymentId, cartId, checkoutId };
}

export {
  createConfirmedUsdOrder,
};
