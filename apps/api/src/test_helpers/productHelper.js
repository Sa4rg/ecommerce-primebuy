/**
 * Product Helper for HTTP Integration Tests
 *
 * Provides utilities for creating products with admin authentication.
 */

import request from 'supertest';
import jwt from 'jsonwebtoken';
import { expect } from 'vitest';

/**
 * Generate an admin JWT token for test purposes
 */
function adminToken() {
  return jwt.sign(
    { sub: 'admin-product-helper', role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Create a product with admin authentication
 * @param {Express.Application} app - Express app instance
 * @param {Object} [productData] - Optional product data override
 * @returns {Promise<{ productId: string, product: Object }>}
 */
async function createTestProduct(app, productData = {}) {
  const defaultProduct = {
    name: 'Test Product',
    priceUSD: 10,
    stock: 5,
    category: 'Test',
  };

  const payload = { ...defaultProduct, ...productData };

  const response = await request(app)
    .post('/api/products')
    .set('Authorization', `Bearer ${adminToken()}`)
    .send(payload);

  expect(response.status).toBe(201);

  return {
    productId: response.body.data.id,
    product: response.body.data,
  };
}

export {
  adminToken,
  createTestProduct,
};
