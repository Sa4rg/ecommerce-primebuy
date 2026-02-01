/**
 * Payment Helper for HTTP Integration Tests
 *
 * Provides utilities for creating payments in various states.
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { expect } from 'vitest';

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
 * @param {Express.Application} app - Express app instance
 * @returns {Promise<{ cartId: string, checkoutId: string, paymentId: string }>}
 */
async function createConfirmedUsdPayment(app) {
  // Create cart
  const createCartRes = await request(app).post('/api/cart');
  expect(createCartRes.status).toBe(201);
  const cartId = createCartRes.body.data.cartId;

  // Create product
  const createProductRes = await request(app).post('/api/products').send({
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
    .send({ productId, quantity: 2 });
  expect(addItemRes.status).toBe(200);

  // Create checkout
  const checkoutRes = await request(app).post('/api/checkout').send({ cartId });
  expect(checkoutRes.status).toBe(200);
  const checkoutId = checkoutRes.body.data.checkoutId;

  // Create payment
  const paymentRes = await request(app)
    .post('/api/payments')
    .send({ checkoutId, method: 'zelle' });
  expect(paymentRes.status).toBe(201);
  const paymentId = paymentRes.body.data.paymentId;

  // Submit payment
  const submitRes = await request(app)
    .patch(`/api/payments/${paymentId}/submit`)
    .send({ reference: 'ABC123' });
  expect(submitRes.status).toBe(200);

  // Confirm payment (requires admin)
  const confirmRes = await request(app)
    .patch(`/api/payments/${paymentId}/confirm`)
    .set('Authorization', `Bearer ${adminToken()}`)
    .send({ note: 'Confirmed' });
  expect(confirmRes.status).toBe(200);

  return { cartId, checkoutId, paymentId };
}

/**
 * Create a submitted (not confirmed) payment
 * @param {Express.Application} app - Express app instance
 * @returns {Promise<{ cartId: string, checkoutId: string, paymentId: string }>}
 */
async function createSubmittedPayment(app) {
  // Create cart
  const createCartRes = await request(app).post('/api/cart');
  expect(createCartRes.status).toBe(201);
  const cartId = createCartRes.body.data.cartId;

  // Create product
  const createProductRes = await request(app).post('/api/products').send({
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
    .send({ productId, quantity: 1 });
  expect(addItemRes.status).toBe(200);

  // Create checkout
  const checkoutRes = await request(app).post('/api/checkout').send({ cartId });
  expect(checkoutRes.status).toBe(200);
  const checkoutId = checkoutRes.body.data.checkoutId;

  // Create payment
  const paymentRes = await request(app)
    .post('/api/payments')
    .send({ checkoutId, method: 'zelle' });
  expect(paymentRes.status).toBe(201);
  const paymentId = paymentRes.body.data.paymentId;

  // Submit payment (but DO NOT confirm)
  const submitRes = await request(app)
    .patch(`/api/payments/${paymentId}/submit`)
    .send({ reference: 'REF-SUBMITTED' });
  expect(submitRes.status).toBe(200);

  return { cartId, checkoutId, paymentId };
}

export {
  createConfirmedUsdPayment,
  createSubmittedPayment,
};
