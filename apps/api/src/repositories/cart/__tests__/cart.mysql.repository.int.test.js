/**
 * Integration Tests: MySQLCartRepository
 * 
 * Tests the MySQL implementation against a real database.
 * Requires Docker MySQL to be running (pnpm db:up).
 * 
 * Run: DB_INTEGRATION=1 pnpm test cart.mysql.repository.int.test.js
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { MySQLCartRepository } from '../cart.mysql.repository';
import db from '../../../db/knex';
import { cleanupDb } from '../../../test_helpers/dbCleanup';

describe('MySQLCartRepository - Integration Tests', () => {
  let repository;

  beforeAll(async () => {
    // Run migrations to ensure tables exist
    await db.migrate.latest();
    repository = new MySQLCartRepository();
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
    it('should persist and return a cart snapshot', async () => {
      // Arrange
      const cart = {
        cartId: 'cart-integration-test-001',
        items: [
          {
            productId: '1',
            productName: 'Laptop',
            unitPriceUSD: 1000,
            quantity: 2,
            lineTotalUSD: 2000,
          },
          {
            productId: '2',
            productName: 'Mouse',
            unitPriceUSD: 20,
            quantity: 1,
            lineTotalUSD: 20,
          },
        ],
        summary: {
          itemsCount: 3,
          subtotalUSD: 2020,
        },
        metadata: {
          market: 'VE',
          baseCurrency: 'USD',
          displayCurrency: 'VES',
          exchangeRate: {
            provider: 'BCV',
            usdToVes: 36.5,
            asOf: '2026-01-20T12:00:00.000Z',
          },
          tax: {
            priceIncludesVAT: true,
            vatRate: 0.16,
          },
          customer: {
            email: 'test@example.com',
            name: 'John Doe',
            phone: '+58-414-1234567',
          },
          status: 'active',
          createdAt: '2026-01-21T10:00:00.000Z',
          updatedAt: '2026-01-21T10:00:00.000Z',
        },
      };

      // Act
      const result = await repository.create(cart);
      const found = await repository.findById('cart-integration-test-001');

      // Assert
      expect(result).toEqual({ cartId: 'cart-integration-test-001' });
      expect(found).not.toBeNull();
      expect(found.cartId).toBe('cart-integration-test-001');
      expect(typeof found.cartId).toBe('string');
      
      // Verify items
      expect(found.items).toHaveLength(2);
      expect(found.items[0].productId).toBe('1');
      expect(found.items[0].productName).toBe('Laptop');
      expect(found.items[0].unitPriceUSD).toBe(1000);
      expect(found.items[0].quantity).toBe(2);
      expect(found.items[0].lineTotalUSD).toBe(2000);
      expect(found.items[1].productId).toBe('2');
      
      // Verify summary
      expect(found.summary.itemsCount).toBe(3);
      expect(found.summary.subtotalUSD).toBe(2020);
      
      // Verify metadata
      expect(found.metadata.status).toBe('active');
      expect(found.metadata.market).toBe('VE');
      expect(found.metadata.exchangeRate.provider).toBe('BCV');
      expect(found.metadata.exchangeRate.usdToVes).toBe(36.5);
      expect(found.metadata.tax.priceIncludesVAT).toBe(true);
      expect(found.metadata.tax.vatRate).toBe(0.16);
      expect(found.metadata.customer.email).toBe('test@example.com');
      expect(found.metadata.customer.name).toBe('John Doe');
      expect(found.metadata.createdAt).toBe('2026-01-21T10:00:00.000Z');
      expect(found.metadata.updatedAt).toBe('2026-01-21T10:00:00.000Z');
    });

    it('should return null for nonexistent cart', async () => {
      const found = await repository.findById('nonexistent-cart-id');
      
      expect(found).toBeNull();
    });
  });

  describe('save()', () => {
    it('should persist updates', async () => {
      // Arrange - create initial cart
      const cart = {
        cartId: 'cart-update-test-001',
        items: [
          {
            productId: '1',
            productName: 'Laptop',
            unitPriceUSD: 1000,
            quantity: 1,
            lineTotalUSD: 1000,
          },
        ],
        summary: {
          itemsCount: 1,
          subtotalUSD: 1000,
        },
        metadata: {
          market: 'VE',
          baseCurrency: 'USD',
          displayCurrency: 'USD',
          exchangeRate: {
            provider: 'BCV',
            usdToVes: null,
            asOf: null,
          },
          tax: {
            priceIncludesVAT: true,
            vatRate: 0.16,
          },
          customer: {
            email: null,
            name: null,
            phone: null,
          },
          status: 'active',
          createdAt: '2026-01-21T10:00:00.000Z',
          updatedAt: '2026-01-21T10:00:00.000Z',
        },
      };

      await repository.create(cart);

      // Act - mutate cart
      cart.items[0].quantity = 3;
      cart.items[0].lineTotalUSD = 3000;
      cart.items.push({
        productId: '2',
        productName: 'Mouse',
        unitPriceUSD: 25,
        quantity: 2,
        lineTotalUSD: 50,
      });
      cart.summary.itemsCount = 5;
      cart.summary.subtotalUSD = 3050;
      cart.metadata.updatedAt = '2026-01-21T11:30:00.000Z';
      cart.metadata.status = 'checked_out';
      cart.metadata.customer.email = 'customer@example.com';

      await repository.save(cart);

      // Assert - re-fetch and verify
      const updated = await repository.findById('cart-update-test-001');

      expect(updated).not.toBeNull();
      expect(updated.items).toHaveLength(2);
      expect(updated.items[0].quantity).toBe(3);
      expect(updated.items[0].lineTotalUSD).toBe(3000);
      expect(updated.items[1].productId).toBe('2');
      expect(updated.items[1].productName).toBe('Mouse');
      expect(updated.items[1].quantity).toBe(2);
      expect(updated.summary.itemsCount).toBe(5);
      expect(updated.summary.subtotalUSD).toBe(3050);
      expect(updated.metadata.updatedAt).toBe('2026-01-21T11:30:00.000Z');
      expect(updated.metadata.status).toBe('checked_out');
      expect(updated.metadata.customer.email).toBe('customer@example.com');
    });
  });
});
