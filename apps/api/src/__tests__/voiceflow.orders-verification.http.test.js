/**
 * Voiceflow Orders Verification HTTP Tests
 * 
 * Tests for POST /api/voiceflow/orders/lookup-by-verification
 * Verifies user identity using email + phone_last4
 * 
 * IMPORTANT: This test uses MySQL (not InMemory) to test real repository queries.
 * DB_INTEGRATION=1 must be set BEFORE importing app to force MySQL repositories.
 */

// Force MySQL repositories for this test file only
process.env.DB_INTEGRATION = '1';

const request = require('supertest');
const argon2 = require('argon2');
const app = require('../app');
const knex = require('../db/knex');

const VOICEFLOW_API_KEY = process.env.VOICEFLOW_API_KEY || 'VF.DM.69ceb8e36fa98681edde7e2a.Vf443jmL3kF0XHW1';

describe('POST /api/voiceflow/orders/lookup-by-verification', () => {
  let userId;
  let testOrders = [];

  beforeAll(async () => {
    await knex.migrate.latest();
  });

  beforeEach(async () => {
    // Delete in correct order to avoid FK constraint violations
    // 1. Delete order snapshots (no FK, but reference orders)
    await knex('order_shipping').del();
    await knex('order_tax').del();
    await knex('order_customer').del();
    await knex('order_items').del();
    
    // 2. Delete orders (has FK to payments, checkouts, carts, users)
    await knex('orders').del();
    
    // 3. Delete payments (has FK to checkouts, users)
    await knex('payments').del();
    
    // 4. Delete checkouts (has FK to carts, users)
    await knex('checkouts').del();
    
    // 5. Delete cart items (has FK to carts)
    await knex('cart_items').del();
    
    // 6. Delete carts (has FK to users)
    await knex('carts').del();
    
    // 7. Delete refresh_tokens (has FK to users) 
    await knex('refresh_tokens').del();
    
    // 8. Delete users (no FK dependencies after cleanup above)
    await knex('users').del();

    // Create test user
    userId = 'test-user-voiceflow-001';
    const passwordHash = await argon2.hash('password123');
    
    await knex('users').insert({
      user_id: userId,
      email: 'customer@test.com',
      password_hash: passwordHash,
      role: 'customer',
      created_at: new Date(),
      updated_at: new Date(),
    });

    // Create test orders with all required tables
    const orderData = [
      {
        orderId: 'order-001',
        status: 'processing',
        customerEmail: 'customer@test.com',
        customerName: 'Juan Pérez',
        customerPhone: '+58 412 555 1234', // last4: 1234
        totalUSD: 100.00,
        createdAt: new Date('2024-01-15'),
      },
      {
        orderId: 'order-002',
        status: 'shipped',
        customerEmail: 'customer@test.com',
        customerName: 'Juan Pérez',
        customerPhone: '+58 412 555 1234', // last4: 1234
        totalUSD: 200.00,
        createdAt: new Date('2024-02-20'),
      },
      {
        orderId: 'order-003',
        status: 'delivered',
        customerEmail: 'customer@test.com',
        customerName: 'Juan Pérez',
        customerPhone: '+58 412 555 1234',
        totalUSD: 50.00,
        createdAt: new Date('2024-01-10'),
      },
    ];

    // Insert into all order-related tables (with dependencies)
    for (const order of orderData) {
      const cartId = `cart-${order.orderId}`;
      const checkoutId = `checkout-${order.orderId}`;
      const paymentId = `payment-${order.orderId}`;

      // 1. Create cart
      await knex('carts').insert({
        cart_id: cartId,
        user_id: userId,
        status: 'active',
        metadata_json: JSON.stringify({}),
        created_at: order.createdAt,
        updated_at: order.createdAt,
      });

      // 2. Create checkout (references cart)
      await knex('checkouts').insert({
        checkout_id: checkoutId,
        cart_id: cartId,
        totals_json: JSON.stringify({ subtotalUSD: order.totalUSD, currency: 'USD' }),
        exchange_rate_json: null,
        payment_methods_json: JSON.stringify({ usd: ['bank_transfer'] }),
        status: 'completed',
        created_at: order.createdAt,
        updated_at: order.createdAt,
      });

      // 3. Create payment (references checkout)
      await knex('payments').insert({
        payment_id: paymentId,
        checkout_id: checkoutId,
        user_id: userId,
        method: 'bank_transfer',
        status: 'confirmed',
        amount: order.totalUSD,
        currency: 'USD',
        proof_reference: null,
        proof_date: null,
        proof_note: null,
        review_note: null,
        review_reason: null,
        created_at: order.createdAt,
        updated_at: order.createdAt,
      });

      // 4. Insert into orders table (references payment, checkout, cart)
      await knex('orders').insert({
        order_id: order.orderId,
        user_id: userId,
        cart_id: cartId,
        checkout_id: checkoutId,
        payment_id: paymentId,
        status: order.status,
        subtotal_usd: order.totalUSD,
        subtotal_ves: null,
        currency: 'USD',
        amount_paid: order.totalUSD,
        exchange_provider: null,
        exchange_usd_to_ves: null,
        exchange_as_of: null,
        payment_method: 'bank_transfer',
        payment_proof_reference: null,
        payment_review_note: null,
        payment_review_reason: null,
        created_at: order.createdAt,
        updated_at: order.createdAt,
      });

      // 5. Insert into order_customer
      await knex('order_customer').insert({
        order_id: order.orderId,
        email: order.customerEmail,
        name: order.customerName,
        phone: order.customerPhone,
      });

      // 6. Insert into order_tax
      await knex('order_tax').insert({
        order_id: order.orderId,
        price_includes_vat: false,
        vat_rate: 0,
      });

      // 7. Insert into order_shipping
      await knex('order_shipping').insert({
        order_id: order.orderId,
        method: 'pickup',
        status: 'pending',
        address_recipient_name: null,
        address_phone: null,
        address_state: null,
        address_city: null,
        address_line1: null,
        address_reference: null,
        carrier_name: null,
        carrier_tracking_number: null,
        dispatched_at: null,
        delivered_at: null,
      });
    }

    testOrders = orderData;
  });

  afterAll(async () => {
    await knex.destroy();
  });

  describe('Success scenarios', () => {
    test('should return active orders when email and phone_last4 match', async () => {
      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          email: 'customer@test.com',
          phone_last4: '1234',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        found: true,
        message: expect.any(String),
      });

      expect(response.body.data).toHaveProperty('orders');
      expect(Array.isArray(response.body.data.orders)).toBe(true);
      
      // Should return only active orders (processing, shipped)
      expect(response.body.data.orders.length).toBeGreaterThanOrEqual(2);
      
      // Verify order structure
      const firstOrder = response.body.data.orders[0];
      expect(firstOrder).toMatchObject({
        orderId: expect.any(String),
        status: expect.stringMatching(/processing|shipped/),
        statusES: expect.any(String),
        totalUSD: expect.any(Number),
        createdAt: expect.any(String),
      });

      // Should NOT include sensitive data
      expect(firstOrder).not.toHaveProperty('customer_phone');
      expect(firstOrder).not.toHaveProperty('customer_email');
    });

    test('should return Spanish status translations', async () => {
      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          email: 'customer@test.com',
          phone_last4: '1234',
        })
        .expect(200);

      const order = response.body.data.orders.find(o => o.status === 'processing');
      expect(order.statusES).toBe('En proceso');
    });

    test('should return empty array when user has no active orders (only delivered)', async () => {
      // Delete active orders, keep only delivered
      await knex('orders')
        .whereIn('order_id', ['order-001', 'order-002'])
        .del();

      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          email: 'customer@test.com',
          phone_last4: '1234',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        found: false,
        message: 'No tienes pedidos activos en este momento.',
        data: {
          orders: [],
        },
      });
    });

    test('should work with phone numbers in different formats', async () => {
      // Update one order with different phone format
      await knex('order_customer')
        .where('order_id', 'order-001')
        .update({ phone: '04125551234' }); // No spaces, no +58

      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          email: 'customer@test.com',
          phone_last4: '1234',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.found).toBe(true);
    });
  });

  describe('Validation errors', () => {
    test('should reject when email is missing', async () => {
      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          phone_last4: '1234',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject when phone_last4 is missing', async () => {
      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          email: 'customer@test.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject when email is invalid format', async () => {
      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          email: 'not-an-email',
          phone_last4: '1234',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject when phone_last4 is not exactly 4 digits', async () => {
      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          email: 'customer@test.com',
          phone_last4: '123', // Only 3 digits
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should reject when phone_last4 contains non-numeric characters', async () => {
      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          email: 'customer@test.com',
          phone_last4: '12ab',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Authentication errors', () => {
    test('should reject when API key is missing', async () => {
      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .send({
          email: 'customer@test.com',
          phone_last4: '1234',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should reject when API key is invalid', async () => {
      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', 'invalid-key')
        .send({
          email: 'customer@test.com',
          phone_last4: '1234',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Verification failures', () => {
    test('should reject when email does not exist', async () => {
      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          email: 'nonexistent@test.com',
          phone_last4: '1234',
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        found: false,
        message: 'No pude verificar tu identidad. Por favor verifica tus datos.',
        errorCode: 'VERIFICATION_FAILED',
      });
    });

    test('should reject when phone_last4 does not match any order', async () => {
      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          email: 'customer@test.com',
          phone_last4: '9999', // Wrong last 4 digits
        })
        .expect(403);

      expect(response.body).toMatchObject({
        success: false,
        found: false,
        message: 'No pude verificar tu identidad. Por favor verifica tus datos.',
        errorCode: 'VERIFICATION_FAILED',
      });
    });

    test('should reject when email exists but belongs to different user', async () => {
      // Create another user with different orders
      const otherUserId = 'other-user-001';
      await knex('users').insert({
        user_id: otherUserId,
        email: 'other@test.com',
        password_hash: await argon2.hash('password123'),
        role: 'customer',
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Create complete order structure
      const otherCartId = 'cart-other-001';
      const otherCheckoutId = 'checkout-other-001';
      const otherPaymentId = 'payment-other-001';
      const otherOrderId = 'other-order-001';

      await knex('carts').insert({
        cart_id: otherCartId,
        user_id: otherUserId,
        status: 'active',
        metadata_json: JSON.stringify({}),
        created_at: new Date(),
        updated_at: new Date(),
      });

      await knex('checkouts').insert({
        checkout_id: otherCheckoutId,
        cart_id: otherCartId,
        totals_json: JSON.stringify({ subtotalUSD: 150.00, currency: 'USD' }),
        exchange_rate_json: null,
        payment_methods_json: JSON.stringify({ usd: ['bank_transfer'] }),
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await knex('payments').insert({
        payment_id: otherPaymentId,
        checkout_id: otherCheckoutId,
        user_id: otherUserId,
        method: 'bank_transfer',
        status: 'confirmed',
        amount: 150.00,
        currency: 'USD',
        proof_reference: null,
        proof_date: null,
        proof_note: null,
        review_note: null,
        review_reason: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      // Insert order with all required tables
      await knex('orders').insert({
        order_id: otherOrderId,
        user_id: otherUserId,
        cart_id: otherCartId,
        checkout_id: otherCheckoutId,
        payment_id: otherPaymentId,
        status: 'processing',
        subtotal_usd: 150.00,
        subtotal_ves: null,
        currency: 'USD',
        amount_paid: 150.00,
        exchange_provider: null,
        exchange_usd_to_ves: null,
        exchange_as_of: null,
        payment_method: 'bank_transfer',
        payment_proof_reference: null,
        payment_review_note: null,
        payment_review_reason: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await knex('order_customer').insert({
        order_id: otherOrderId,
        email: 'other@test.com',
        name: 'Maria Lopez',
        phone: '+58 412 555 5678', // last4: 5678
      });

      await knex('order_tax').insert({
        order_id: otherOrderId,
        price_includes_vat: false,
        vat_rate: 0,
      });

      await knex('order_shipping').insert({
        order_id: otherOrderId,
        method: 'pickup',
        status: 'pending',
        address_recipient_name: null,
        address_phone: null,
        address_state: null,
        address_city: null,
        address_line1: null,
        address_reference: null,
        carrier_name: null,
        carrier_tracking_number: null,
        dispatched_at: null,
        delivered_at: null,
      });

      // Try to access with correct email but wrong phone
      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          email: 'other@test.com',
          phone_last4: '1234', // From first user's orders
        })
        .expect(403);

      expect(response.body.errorCode).toBe('VERIFICATION_FAILED');
    });
  });

  describe('Edge cases', () => {
    test('should handle case-insensitive email matching', async () => {
      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          email: 'CUSTOMER@TEST.COM', // Uppercase
          phone_last4: '1234',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should trim whitespace from inputs', async () => {
      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          email: '  customer@test.com  ',
          phone_last4: ' 1234 ',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should return orders sorted by most recent first', async () => {
      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          email: 'customer@test.com',
          phone_last4: '1234',
        })
        .expect(200);

      const orders = response.body.data.orders;
      const dates = orders.map(o => new Date(o.createdAt));
      
      // Verify descending order (most recent first)
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i].getTime()).toBeGreaterThanOrEqual(dates[i + 1].getTime());
      }
    });

    test('should handle user with orders but no phone in some orders', async () => {
      // Add order without phone
      const noPhoneCartId = 'cart-no-phone';
      const noPhoneCheckoutId = 'checkout-no-phone';
      const noPhonePaymentId = 'payment-no-phone';
      const noPhoneOrderId = 'order-no-phone';

      await knex('carts').insert({
        cart_id: noPhoneCartId,
        user_id: userId,
        status: 'active',
        metadata_json: JSON.stringify({}),
        created_at: new Date(),
        updated_at: new Date(),
      });

      await knex('checkouts').insert({
        checkout_id: noPhoneCheckoutId,
        cart_id: noPhoneCartId,
        totals_json: JSON.stringify({ subtotalUSD: 75.00, currency: 'USD' }),
        exchange_rate_json: null,
        payment_methods_json: JSON.stringify({ usd: ['bank_transfer'] }),
        status: 'completed',
        created_at: new Date(),
        updated_at: new Date(),
      });

      await knex('payments').insert({
        payment_id: noPhonePaymentId,
        checkout_id: noPhoneCheckoutId,
        user_id: userId,
        method: 'bank_transfer',
        status: 'confirmed',
        amount: 75.00,
        currency: 'USD',
        proof_reference: null,
        proof_date: null,
        proof_note: null,
        review_note: null,
        review_reason: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await knex('orders').insert({
        order_id: noPhoneOrderId,
        user_id: userId,
        cart_id: noPhoneCartId,
        checkout_id: noPhoneCheckoutId,
        payment_id: noPhonePaymentId,
        status: 'processing',
        subtotal_usd: 75.00,
        subtotal_ves: null,
        currency: 'USD',
        amount_paid: 75.00,
        exchange_provider: null,
        exchange_usd_to_ves: null,
        exchange_as_of: null,
        payment_method: 'bank_transfer',
        payment_proof_reference: null,
        payment_review_note: null,
        payment_review_reason: null,
        created_at: new Date(),
        updated_at: new Date(),
      });

      await knex('order_customer').insert({
        order_id: noPhoneOrderId,
        email: 'customer@test.com',
        name: 'Juan Pérez',
        phone: null, // No phone
      });

      await knex('order_tax').insert({
        order_id: noPhoneOrderId,
        price_includes_vat: false,
        vat_rate: 0,
      });

      await knex('order_shipping').insert({
        order_id: noPhoneOrderId,
        method: 'pickup',
        status: 'pending',
        address_recipient_name: null,
        address_phone: null,
        address_state: null,
        address_city: null,
        address_line1: null,
        address_reference: null,
        carrier_name: null,
        carrier_tracking_number: null,
        dispatched_at: null,
        delivered_at: null,
      });

      const response = await request(app)
        .post('/api/voiceflow/orders/lookup-by-verification')
        .set('X-Voiceflow-API-Key', VOICEFLOW_API_KEY)
        .send({
          email: 'customer@test.com',
          phone_last4: '1234',
        })
        .expect(200);

      // Should still succeed because other orders have matching phone
      expect(response.body.success).toBe(true);
      expect(response.body.data.orders.length).toBeGreaterThan(0);
    });
  });
});
