/**
 * Checkout Helper for HTTP Integration Tests
 *
 * Provides utilities for completing checkout with customer and shipping info.
 */

import request from 'supertest';
import { expect } from 'vitest';

/**
 * Complete a checkout by setting customer and shipping info.
 * Must be called before creating a payment.
 *
 * @param {Express.Application} app - Express app instance
 * @param {string} checkoutId - The checkout ID to complete
 * @param {string} userToken - JWT token for authentication
 * @returns {Promise<void>}
 */
async function completeCheckout(app, checkoutId, userToken) {
  // Set customer info
  const customerRes = await request(app)
    .patch(`/api/checkout/${checkoutId}/customer`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      name: 'Test Customer',
      email: 'customer@example.com',
      phone: '0414-1234567',
    });
  expect(customerRes.status).toBe(200);

  // Set shipping info
  const shippingRes = await request(app)
    .patch(`/api/checkout/${checkoutId}/shipping`)
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      method: 'delivery',
      address: {
        recipientName: 'Test Customer',
        phone: '0414-1234567',
        state: 'Carabobo',
        city: 'Valencia',
        line1: 'Av Principal 123',
        reference: 'Near the park',
      },
    });
  expect(shippingRes.status).toBe(200);
}

export { completeCheckout };
