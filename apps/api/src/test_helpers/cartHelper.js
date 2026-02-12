/**
 * Cart Helper for HTTP Integration Tests
 *
 * Provides utilities for creating carts and handling cart secret headers.
 */
import request from 'supertest';
import { expect } from 'vitest';

/**
 * Create a new cart and return cartId and cartSecret
 * @param {Express.Application} app - Express app instance
 * @returns {Promise<{ cartId: string, cartSecret: string }>}
 */
async function createCart(app) {
  const res = await request(app).post('/api/cart');
  expect(res.status).toBe(201);
  const { cartId, cartSecret } = res.body.data;
  return { cartId, cartSecret };
}

/**
 * Returns header object with X-Cart-Secret
 * @param {string} cartSecret 
 * @returns {{ "X-Cart-Secret": string }}
 */
function cartSecretHeader(cartSecret) {
  return { 'X-Cart-Secret': cartSecret };
}

export { createCart, cartSecretHeader };
