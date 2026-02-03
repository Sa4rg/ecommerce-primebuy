/**
 * Integration Tests: MySQLOrdersRepository
 * 
 * Tests the MySQL implementation against a real database.
 * Requires Docker MySQL to be running (pnpm db:up).
 * 
 * TDD Approach: RED → GREEN → REFACTOR
 * This file starts with one RED test (table doesn't exist yet).
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { MySQLOrdersRepository } from '../orders.mysql.repository.js';
import db from '../../../db/knex.js';
import { cleanupDb } from '../../../test_helpers/dbCleanup.js';
import { OrderStatus } from '../../../constants/orderStatus.js';
import { PaymentStatus } from '../../../constants/paymentStatus.js';
import { ShippingStatus } from '../../../constants/shippingStatus.js';


describe('MySQLOrdersRepository - Integration Tests', () => {
  let repository;

  beforeAll(async () => {
    // Run migrations to ensure table exists
    await db.migrate.latest();
    repository = new MySQLOrdersRepository();
  });

  beforeEach(async () => {
    // Clean all tables in FK-safe order
    await cleanupDb(db);
  });

  afterAll(async () => {
    // Close database connection
    await db.destroy();
  });

  describe('create() and findById()', () => {
    it('should persist and return an order snapshot', async () => {
      // Arrange: Create FK dependencies in order (user → cart → checkout → payment → order)
      await db('users').insert({
        user_id: 'user_test_99999',
        email: 'testuser@example.com',
        password_hash: 'hashed_password_placeholder',
        role: 'customer',
        created_at: '2026-01-15 10:00:00',
        updated_at: '2026-01-15 10:00:00',
      });

      await db('carts').insert({
        cart_id: 'cart_test_67890',
        status: 'active',
        metadata_json: JSON.stringify({}),
        created_at: '2026-01-15 10:00:00',
        updated_at: '2026-01-15 10:00:00',
      });

      await db('checkouts').insert({
        checkout_id: 'chk_test_11111',
        cart_id: 'cart_test_67890',
        status: ShippingStatus.PENDING,
        totals_json: JSON.stringify({ subtotalUSD: 999.99 }),
        payment_methods_json: JSON.stringify({ usd: ['zelle'] }),
        exchange_rate_json: null,
        created_at: '2026-01-15 10:00:00',
        updated_at: '2026-01-15 10:00:00',
      });

      await db('payments').insert({
        payment_id: 'pay_test_22222',
        checkout_id: 'chk_test_11111',
        method: 'zelle',
        currency: 'USD',
        amount: 999.99,
        status: PaymentStatus.PENDING,
        created_at: '2026-01-15 10:00:00',
        updated_at: '2026-01-15 10:00:00',
      });

      // Create a realistic order object
      const order = {
        orderId: 'ord_test_12345',
        userId: 'user_test_99999',
        cartId: 'cart_test_67890',
        checkoutId: 'chk_test_11111',
        paymentId: 'pay_test_22222',
        status: OrderStatus.PAID,
        
        items: [
          {
            productId: "prod_001",
            name: "Laptop",
            unitPriceUSD: 999.99,
            quantity: 1,
            lineTotalUSD: 999.99,
          }
        ],
        
        totals: {
          subtotalUSD: 999.99,
          subtotalVES: null,
          currency: 'USD',
          amountPaid: 0,
        },
        
        exchangeRate: null,
        
        tax: {
          vatRate: 0.16,
          priceIncludesVAT: false,
        },
        
        customer: {
          email: 'test@example.com',
          name: 'John Doe',
          phone: null,
        },
        
        payment: {
          method: 'zelle',
          proof: null,
          review: undefined,
        },
        
        shipping: {
          method: 'local_delivery',
          address: {
            recipientName: 'John Doe',
            phone: '+58123456789',
            state: 'Miranda',
            city: 'Caracas',
            line1: '123 Main St, Apt 4B',
            reference: 'Near the park',
          },
          carrier: {
            name: null,
            trackingNumber: null,
          },
          status: ShippingStatus.PENDING,
          dispatchedAt: null,
          deliveredAt: null,
        },
        
        createdAt: '2026-01-15 10:00:00',
        updatedAt: '2026-01-15 10:00:00',
      };

      // Act: Create and retrieve
      const result = await repository.create(order);
      const found = await repository.findById(order.orderId);

      // Assert: Verify creation result
      expect(result).toEqual({ orderId: 'ord_test_12345' });
      
      // Assert: Found order matches key fields
      expect(found).not.toBeNull();
      expect(found.orderId).toBe('ord_test_12345');
      expect(found.userId).toBe('user_test_99999');
      expect(typeof found.orderId).toBe('string');
      expect(found.status).toBe(OrderStatus.PAID);
      expect(found.paymentId).toBe('pay_test_22222');
      expect(found.totals.currency).toBe('USD');
      expect(found.items).toHaveLength(1);
      expect(found.items[0].productId).toBe('prod_001');
      expect(found.customer.email).toBe('test@example.com');
      expect(found.shipping.method).toBe('local_delivery');
    });
  });
});
