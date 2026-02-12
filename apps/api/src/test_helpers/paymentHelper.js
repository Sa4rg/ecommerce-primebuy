/**
 * Payment Helper for HTTP Integration Tests
 *
 * Provides utilities for creating payments in various states.
 * Each helper creates its own user token internally for ownership consistency.
 */
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { expect } from 'vitest';
import { registerAndLogin } from '../test_helpers/authHelper.js';
import { completeCheckout } from '../test_helpers/checkoutHelper.js';

/**
 * Generate an admin JWT token for test purposes
 */
function adminToken() {
  return jwt.sign(
    { sub: 'admin-payment-helper', role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Create a confirmed USD payment through the full flow:
 * cart → product → add item → checkout → payment → submit → confirm
 * 
 * Creates its own user token internally for ownership consistency.
 * 
 * @param {Express.Application} app - Express app instance
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.customerEmail] - Customer email to associate with order
 * @param {string} [options.prefix] - Unique prefix for user registration (default: 'payment-helper')
 * @returns {Promise<{ cartId: string, checkoutId: string, paymentId: string }>}
 */
async function createConfirmedUsdPayment(app, options = {}) {
  const { customerEmail, prefix = 'payment-helper' } = options;

  // Create user token for this flow (same token for checkout, payment, submit)
  const userToken = await registerAndLogin(app, `${prefix}-${Date.now()}`);

  // Create cart
  const createCartRes = await request(app).post('/api/cart');
  expect(createCartRes.status).toBe(201);
  const cartId = createCartRes.body.data.cartId;
  const cartSecret = createCartRes.body.data.cartSecret;

  // Create product (requires admin)
  const createProductRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken()}`)
    .send({
      name: 'Payment Test Product',
      priceUSD: 10,
      stock: 5,
      category: 'Test',
    });
  expect(createProductRes.status).toBe(201);
  const productId = createProductRes.body.data.id;

  // Add item to cart (quantity 2 → total 20 USD)
  const addItemRes = await request(app)
    .post(`/api/cart/${cartId}/items`)
    .set('X-Cart-Secret', cartSecret)
    .send({ productId, quantity: 2 });
  expect(addItemRes.status).toBe(200);

  // Set customer email if provided
  if (customerEmail) {
    const metadataRes = await request(app)
      .patch(`/api/cart/${cartId}/metadata`)
      .set('X-Cart-Secret', cartSecret)
      .send({ customer: { email: customerEmail } });
    expect(metadataRes.status).toBe(200);
  }

  // Create checkout (requires auth)
  const checkoutRes = await request(app)
    .post('/api/checkout')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ cartId });
  expect(checkoutRes.status).toBe(200);
  const checkoutId = checkoutRes.body.data.checkoutId;

  // Complete checkout with customer and shipping data
  await completeCheckout(app, checkoutId, userToken);

  // Create payment (requires auth - same user)
  const paymentRes = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ checkoutId, method: 'zelle' });
  expect(paymentRes.status).toBe(201);
  const paymentId = paymentRes.body.data.paymentId;

  // Submit payment (requires auth - same user/owner)
  const submitRes = await request(app)
    .patch(`/api/payments/${paymentId}/submit`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ reference: 'ABC123' });
  expect(submitRes.status).toBe(200);

  // Confirm payment (requires admin)
  const confirmRes = await request(app)
    .patch(`/api/payments/${paymentId}/confirm`)
    .set('Authorization', `Bearer ${adminToken()}`)
    .send({ note: 'Confirmed' });
  expect(confirmRes.status).toBe(200);

  return { cartId, checkoutId, paymentId, userToken };
}

/**
 * Create a submitted (not confirmed) payment
 * 
 * Creates its own user token internally for ownership consistency.
 * 
 * @param {Express.Application} app - Express app instance
 * @param {Object} [options] - Optional configuration
 * @param {string} [options.prefix] - Unique prefix for user registration (default: 'submitted-payment')
 * @returns {Promise<{ cartId: string, checkoutId: string, paymentId: string }>}
 */
async function createSubmittedPayment(app, options = {}) {
  const { prefix = 'submitted-payment' } = options;

  // Create user token for this flow (same token for checkout, payment, submit)
  const userToken = await registerAndLogin(app, `${prefix}-${Date.now()}`);

  // Create cart
  const createCartRes = await request(app).post('/api/cart');
  expect(createCartRes.status).toBe(201);
  const cartId = createCartRes.body.data.cartId;
  const cartSecret = createCartRes.body.data.cartSecret;

  // Create product (requires admin)
  const createProductRes = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken()}`)
    .send({
      name: 'Submitted Payment Product',
      priceUSD: 10,
      stock: 5,
      category: 'Test',
    });
  expect(createProductRes.status).toBe(201);
  const productId = createProductRes.body.data.id;

  // Add item to cart
  const addItemRes = await request(app)
    .post(`/api/cart/${cartId}/items`)
    .set('X-Cart-Secret', cartSecret)
    .send({ productId, quantity: 1 });
  expect(addItemRes.status).toBe(200);

  // Create checkout (requires auth)
  const checkoutRes = await request(app)
    .post('/api/checkout')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ cartId });
  expect(checkoutRes.status).toBe(200);
  const checkoutId = checkoutRes.body.data.checkoutId;

  // Complete checkout with customer and shipping data
  await completeCheckout(app, checkoutId, userToken);

  // Create payment (requires auth - same user)
  const paymentRes = await request(app)
    .post('/api/payments')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ checkoutId, method: 'zelle' });
  expect(paymentRes.status).toBe(201);
  const paymentId = paymentRes.body.data.paymentId;

  // Submit payment (requires auth - same user/owner)
  const submitRes = await request(app)
    .patch(`/api/payments/${paymentId}/submit`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({ reference: 'REF-SUBMITTED' });
  expect(submitRes.status).toBe(200);

  return { cartId, checkoutId, paymentId, userToken };
}

export {
  createConfirmedUsdPayment,
  createSubmittedPayment,
};
