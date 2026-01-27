/**
 * Integration Tests: Database Foreign Key Constraints
 * 
 * Tests all FK constraints to ensure referential integrity.
 * These are schema-level tests, not business logic tests.
 * 
 * Run: pnpm --filter api test:db
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import db from '../knex';
import { cleanupDb } from '../../test_helpers/dbCleanup';

describe('Database Foreign Key Constraints', () => {
  
  beforeAll(async () => {
    // Run migrations to ensure all tables and FKs exist
    await db.migrate.latest();
  });

  beforeEach(async () => {
    // Clean all tables in FK-safe order
    await cleanupDb(db);
  });

  afterAll(async () => {
    // Close database connection
    await db.destroy();
  });

  describe('Cart Constraints', () => {
    it('cart_items.cart_id should reject item when cart does not exist', async () => {
      // Act & Assert: Try to insert cart_item with non-existent cart_id
      const invalidInsert = db('cart_items').insert({
        cart_id: 'cart_fk_missing_001',
        product_id: 'prod_001',
        name: 'Test Product',
        unit_price_usd: 99.99,
        quantity: 1,
        line_total_usd: 99.99,
      });

      // Expect FK constraint violation
      await expect(invalidInsert).rejects.toBeDefined();
    });
  });

  describe('Checkout Constraints', () => {
    it('checkouts.cart_id should reject checkout when cart does not exist', async () => {
      // Act & Assert: Try to insert checkout with non-existent cart_id
      const invalidInsert = db('checkouts').insert({
        checkout_id: 'chk_test_001',
        cart_id: 'cart_missing_001',
        totals_json: JSON.stringify({ subtotalUSD: 100 }),
        payment_methods_json: JSON.stringify({ usd: ['zelle'] }),
        status: 'pending',
        created_at: '2026-01-22 20:00:00',
        updated_at: '2026-01-22 20:00:00',
      });

      // Expect FK constraint violation
      await expect(invalidInsert).rejects.toBeDefined();
    });
  });

  describe('Payment Constraints', () => {
    it('payments.checkout_id should reject payment when checkout does not exist', async () => {
      // Act & Assert: Try to insert payment with non-existent checkout_id
      const invalidInsert = db('payments').insert({
        payment_id: 'pay_test_001',
        checkout_id: 'chk_missing_001',
        method: 'zelle',
        currency: 'USD',
        amount: 100.00,
        status: 'pending',
        created_at: '2026-01-22 22:10:00',
        updated_at: '2026-01-22 22:10:00',
      });

      // Expect FK constraint violation
      await expect(invalidInsert).rejects.toBeDefined();
    });
  });

  describe('Order Constraints', () => {
    it('orders.cart_id should reject order when cart does not exist', async () => {
      // Arrange: Create FK dependencies (cart → checkout → payment)
      // but order will reference a non-existent cart
      await db('carts').insert({
        cart_id: 'cart_ok_001',
        status: 'active',
        metadata_json: JSON.stringify({}),
        created_at: '2026-01-22 22:20:00',
        updated_at: '2026-01-22 22:20:00',
      });

      await db('checkouts').insert({
        checkout_id: 'chk_ok_001',
        cart_id: 'cart_ok_001',
        status: 'pending',
        totals_json: JSON.stringify({ subtotalUSD: 100 }),
        payment_methods_json: JSON.stringify({ usd: ['zelle'] }),
        exchange_rate_json: null,
        created_at: '2026-01-22 22:20:00',
        updated_at: '2026-01-22 22:20:00',
      });

      await db('payments').insert({
        payment_id: 'pay_ok_001',
        checkout_id: 'chk_ok_001',
        method: 'zelle',
        currency: 'USD',
        amount: 100.00,
        status: 'pending',
        created_at: '2026-01-22 22:20:00',
        updated_at: '2026-01-22 22:20:00',
      });

      // Act & Assert: Try to insert order with non-existent cart_id
      const invalidInsert = db('orders').insert({
        order_id: 'ord_test_001',
        cart_id: 'cart_missing_001', // Does NOT exist
        checkout_id: 'chk_ok_001',
        payment_id: 'pay_ok_001',
        status: 'paid',
        currency: 'USD',
        subtotal_usd: 100.00,
        subtotal_ves: null,
        amount_paid: 0,
        exchange_as_of: null,
        exchange_provider: null,
        exchange_usd_to_ves: null,
        payment_method: 'zelle',
        payment_proof_reference: null,
        payment_review_note: null,
        payment_review_reason: null,
        created_at: '2026-01-22 22:20:00',
        updated_at: '2026-01-22 22:20:00',
      });

      // Expect FK constraint violation
      await expect(invalidInsert).rejects.toBeDefined();
    });
  });
});
