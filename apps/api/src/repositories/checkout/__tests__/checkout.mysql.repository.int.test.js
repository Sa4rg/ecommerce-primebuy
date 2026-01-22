/**
 * Integration Tests: MySQLCheckoutRepository
 * 
 * Tests the MySQL implementation against a real database.
 * Requires Docker MySQL to be running (pnpm db:up).
 * 
 * Run: DB_INTEGRATION=1 pnpm test checkout.mysql.repository.int.test.js
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { MySQLCheckoutRepository } from '../checkout.mysql.repository';
import db from '../../../db/knex';
import { cleanupDb } from '../../../test_helpers/dbCleanup';

describe('MySQLCheckoutRepository - Integration Tests', () => {
  let repository;

  beforeAll(async () => {
    // Run migrations to ensure table exists
    await db.migrate.latest();
    repository = new MySQLCheckoutRepository();
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
    it('should persist and return a checkout snapshot', async () => {
      // Arrange: Create cart first (FK dependency)
      await db('carts').insert({
        cart_id: 'cart_integration_001',
        status: 'active',
        metadata_json: JSON.stringify({}),
        created_at: new Date(),
        updated_at: new Date(),
      });

      const checkout = {
        checkoutId: 'chk_integration_001',
        cartId: 'cart_integration_001',
        totals: {
          subtotalUSD: 100,
          subtotalVES: null,
        },
        exchangeRate: null,
        paymentMethods: {
          usd: ['zelle', 'zinli'],
          ves: ['bank_transfer', 'pago_movil'],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Act
      const result = await repository.create(checkout);
      const found = await repository.findById(checkout.checkoutId);

      // Assert
      expect(result).toEqual({ checkoutId: 'chk_integration_001' });
      expect(found).not.toBeNull();
      expect(found.checkoutId).toBe('chk_integration_001');
      expect(typeof found.checkoutId).toBe('string');
      expect(found.cartId).toBe('cart_integration_001');
      expect(typeof found.cartId).toBe('string');
      
      // Verify totals
      expect(found.totals).toEqual({
        subtotalUSD: 100,
        subtotalVES: null,
      });
      
      // Verify exchangeRate is null
      expect(found.exchangeRate).toBeNull();
      
      // Verify paymentMethods
      expect(found.paymentMethods).toEqual({
        usd: ['zelle', 'zinli'],
        ves: ['bank_transfer', 'pago_movil'],
      });
    });

    it('should return null for nonexistent checkout', async () => {
      const found = await repository.findById('nonexistent-checkout-id');
      
      expect(found).toBeNull();
    });

    it('should persist checkout with exchangeRate', async () => {
      // Arrange: Create cart first (FK dependency)
      await db('carts').insert({
        cart_id: 'cart_integration_002',
        status: 'active',
        metadata_json: JSON.stringify({}),
        created_at: new Date(),
        updated_at: new Date(),
      });

      const checkout = {
        checkoutId: 'chk_integration_002',
        cartId: 'cart_integration_002',
        totals: {
          subtotalUSD: 250,
          subtotalVES: 9125,
        },
        exchangeRate: {
          provider: 'BCV',
          usdToVes: 36.5,
          asOf: '2026-01-21T10:00:00.000Z',
        },
        paymentMethods: {
          usd: ['zelle'],
          ves: ['pago_movil'],
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Act
      await repository.create(checkout);
      const found = await repository.findById(checkout.checkoutId);

      // Assert
      expect(found).not.toBeNull();
      expect(found.exchangeRate).toEqual({
        provider: 'BCV',
        usdToVes: 36.5,
        asOf: '2026-01-21T10:00:00.000Z',
      });
      expect(found.totals.subtotalVES).toBe(9125);
    });
  });
});
