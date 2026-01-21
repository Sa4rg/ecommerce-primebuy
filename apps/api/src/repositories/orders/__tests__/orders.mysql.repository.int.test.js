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

describe('MySQLOrdersRepository - Integration Tests', () => {
  let repository;

  beforeAll(async () => {
    // Run migrations to ensure table exists
    await db.migrate.latest();
    repository = new MySQLOrdersRepository();
  });

  beforeEach(async () => {
    // Clean tables before each test (in correct order)
    await db('order_items').del();
    await db('order_shipping').del();
    await db('order_tax').del();
    await db('order_customer').del();
    await db('orders').del();
  });

  afterAll(async () => {
    // Close database connection
    await db.destroy();
  });

  describe('create() and findById()', () => {
    it('should persist and return an order snapshot', async () => {
      // Arrange: Create a realistic order object
      const order = {
        orderId: 'ord_test_12345',
        cartId: 'cart_test_67890',
        checkoutId: 'chk_test_11111',
        paymentId: 'pay_test_22222',
        status: 'pending_payment',
        
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
          status: 'pending',
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
      expect(typeof found.orderId).toBe('string');
      expect(found.status).toBe('pending_payment');
      expect(found.paymentId).toBe('pay_test_22222');
      expect(found.totals.currency).toBe('USD');
      expect(found.items).toHaveLength(1);
      expect(found.items[0].productId).toBe('prod_001');
      expect(found.customer.email).toBe('test@example.com');
      expect(found.shipping.method).toBe('local_delivery');
    });
  });
});
