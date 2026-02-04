/**
 * Order Helper for HTTP Integration Tests
 *
 * Provides utilities for creating orders in various states.
 * Each helper creates its own user token internally for ownership consistency.
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { expect } from 'vitest';
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

/**
 * Create a confirmed USD order through the full HTTP flow:
 * cart → product → add item → checkout → payment → submit → confirm → order
 * 
 * Creates its own user token internally for ownership consistency.
 * Uses the same token throughout the entire flow.
 * 
 * @param {Express.Application} app - Express app instance
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.prefix='order'] - Prefix for the test user email
 * @returns {Promise<{ orderId: string, paymentId: string, cartId: string, checkoutId: string, userToken: string }>}
 */
async function createConfirmedUsdOrder(app, options = {}) {
  const { prefix = 'order' } = options;
  
  // Create user token for this flow (same token for all operations)
  const userToken = await registerAndLogin(app, `${prefix}-${Date.now()}`);

  // 1) Create cart (anonymous, will be claimed at checkout)
  const cartRes = await request(app).post('/api/cart');
  expect(cartRes.status).toBe(201);
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
  expect(productRes.status).toBe(201);
  const productId = productRes.body.data.id;

  // 3) Add item to cart (cart is still anonymous)
  const addItemRes = await request(app)
    .post(`/api/cart/${cartId}/items`)
    .send({ productId, quantity: 2 });
  expect(addItemRes.status).toBe(200);

  // 4) Create checkout (claims cart and requires auth - same user)
  const checkoutRes = await request(app)
    .post('/api/checkout')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ cartId });
  expect(checkoutRes.status).toBe(200);
  const checkoutId = checkoutRes.body.data.checkoutId;

  // 5) Create payment (requires auth - same user owns the checkout)
  const paymentRes = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ checkoutId, method: 'zelle' });
  expect(paymentRes.status).toBe(201);
  const paymentId = paymentRes.body.data.paymentId;

  // 6) Submit payment (requires auth - same user owns the payment)
  const submitRes = await request(app)
    .patch(`/api/payments/${paymentId}/submit`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ reference: 'ABC123' });
  expect(submitRes.status).toBe(200);

  // 7) Confirm payment (requires admin)
  const confirmRes = await request(app)
    .patch(`/api/payments/${paymentId}/confirm`)
    .set('Authorization', `Bearer ${adminToken()}`)
    .send({ note: 'Confirmed' });
  expect(confirmRes.status).toBe(200);

  // 8) Create order (requires auth - same user owns the payment)
  const orderRes = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ paymentId });
  expect(orderRes.status).toBe(201);
  const orderId = orderRes.body.data.orderId;

  return { orderId, paymentId, cartId, checkoutId, userToken };
}

export {
  createConfirmedUsdOrder,
};
