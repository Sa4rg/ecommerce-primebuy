import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { registerAndLogin } from '../test_helpers/authHelper.js';
import { createConfirmedUsdPayment } from '../test_helpers/paymentHelper.js';


describe('Orders Auth', () => {
  it('POST /api/orders → 401 without token', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({ paymentId: 'any-payment-id' });

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: 'Unauthorized',
    });
  });

  it('POST /api/orders → 401 with invalid token', async () => {
  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', 'Bearer invalid.token.here')
    .send({ paymentId: 'any-payment-id' });

  expect(res.status).toBe(401);
  });

  it('POST /api/orders → with valid token reaches controller (not 401)', async () => {
  const token = await registerAndLogin(app, 'auth');

  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${token}`)
    .send({ paymentId: 'nonexistent-payment-id' });

  expect(res.status).not.toBe(401);
 });


 it('POST /api/orders → 409 since order is auto-created on confirmation', async () => {
  // Order is auto-created during payment confirmation
  const { paymentId, orderId, userToken } = await createConfirmedUsdPayment(app);

  // Trying to create order manually should fail - already exists
  const res = await request(app)
    .post('/api/orders')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ paymentId });

  expect(res.status).toBe(409);
  expect(orderId).toBeDefined();
 });

});

