import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { completeCheckout } from '../test_helpers/checkoutHelper.js';

function adminToken() {
  return jwt.sign(
    { sub: 'admin-test', role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
}

describe('User routes (/api/me)', () => {
  let authToken;
  let testUserId;
  let paymentId;
  let orderId;

  beforeAll(async () => {
    // Register and login a test user with unique email
    const email = `testuser-${Date.now()}@example.com`;
    const password = 'Test123!';

    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({ email, password });

    testUserId = registerRes.body.data.userId;

    // Login to get token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    authToken = loginRes.body.data.accessToken;

    // 1️⃣ Create a cart
    const cartRes = await request(app).post('/api/cart');
    const cartId = cartRes.body.data.cartId;
    const cartSecret = cartRes.body.data.cartSecret;

    // 2️⃣ Create a product (requires admin)
    const createProductRes = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({ name: 'User Test Product', priceUSD: 10, stock: 5, category: 'Test' });
    const productId = createProductRes.body.data.id;

    // 3️⃣ Add item to cart
    await request(app)
      .post(`/api/cart/${cartId}/items`)
      .set('X-Cart-Secret', cartSecret)
      .send({ productId, quantity: 1 });

    // 4️⃣ Create checkout from cart
    const checkoutRes = await request(app)
      .post('/api/checkout')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ cartId });

    const checkoutId = checkoutRes.body.data.checkoutId;

    // 5️⃣ Complete checkout with customer and shipping
    await completeCheckout(app, checkoutId, authToken);

    // 6️⃣ Create payment
    const paymentRes = await request(app)
      .post('/api/payments')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ checkoutId, method: 'zelle' });

    paymentId = paymentRes.body.data.paymentId;

    // 7️⃣ Submit payment
    await request(app)
      .patch(`/api/payments/${paymentId}/submit`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ reference: 'REF-12345' });

    // 8️⃣ Admin confirms payment (which creates order)
    const confirmRes = await request(app)
      .patch(`/api/payments/${paymentId}/confirm`)
      .set('Authorization', `Bearer ${adminToken()}`)
      .send({});

    expect(confirmRes.status).toBe(200);
    orderId = confirmRes.body.data.order?.orderId;
    expect(orderId).toBeDefined();
  });

  describe('GET /api/me/payments', () => {
    it('should return payments for authenticated user', async () => {
      const res = await request(app)
        .get('/api/me/payments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const payment = res.body.data.find((p) => p.paymentId === paymentId);
      expect(payment).toBeDefined();
      expect(payment.userId).toBe(testUserId);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/me/payments');

      expect(res.status).toBe(401);
    });

    it('should return empty array when user has no payments', async () => {
      // Register a new user with no payments
      const email = `nopayments-${Date.now()}@example.com`;
      const password = 'Test123!';

      await request(app)
        .post('/api/auth/register')
        .send({ email, password });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

      const newToken = loginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/me/payments')
        .set('Authorization', `Bearer ${newToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/me/orders', () => {
    it('should return orders for authenticated user', async () => {
      const res = await request(app)
        .get('/api/me/orders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);

      const order = res.body.data.find((o) => o.orderId === orderId);
      expect(order).toBeDefined();
      expect(order.userId).toBe(testUserId);
    });

    it('should return 401 when not authenticated', async () => {
      const res = await request(app).get('/api/me/orders');

      expect(res.status).toBe(401);
    });

    it('should return empty array when user has no orders', async () => {
      // Register a new user with no orders
      const email = `noorders-${Date.now()}@example.com`;
      const password = 'Test123!';

      await request(app)
        .post('/api/auth/register')
        .send({ email, password });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

      const newToken = loginRes.body.data.accessToken;

      const res = await request(app)
        .get('/api/me/orders')
        .set('Authorization', `Bearer ${newToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });
});
