/**
 * Integration Tests: MySQLPaymentsRepository
 * 
 * Tests the MySQL implementation against a real database.
 * Requires Docker MySQL to be running (pnpm db:up).
 * 
 * TDD Approach: RED → GREEN → REFACTOR
 * This file starts with one RED test.
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { MySQLPaymentsRepository } from '../payments.mysql.repository.js';
import db from '../../../db/knex.js';

describe('MySQLPaymentsRepository - Integration Tests', () => {
  let repository;

  beforeAll(async () => {
    // Run migrations to ensure table exists
    await db.migrate.latest();
    repository = new MySQLPaymentsRepository();
  });

  beforeEach(async () => {
    // Clean table before each test
    await db('payments').truncate();
  });

  afterAll(async () => {
    // Close database connection
    await db.destroy();
  });

  function mysqlDatetimeToIsoUtc(mysqlDatetime) {
    // mysqlDatetime: "YYYY-MM-DD HH:mm:ss"
    // Convert to "YYYY-MM-DDTHH:mm:ss.000Z"
    return mysqlDatetime.replace(" ", "T") + ".000Z";
}

  describe('create() and findById()', () => {
    it('should persist and return the same payment fields', async () => {
      // Arrange: Build a full payment object
      const payment = {
        paymentId: 'pay_test_12345',
        checkoutId: 'chk_test_67890',
        method: 'zelle',
        currency: 'USD',
        amount: 99.99,
        status: 'pending',
        proof: null,
        createdAt: '2026-01-15 10:00:00',
        updatedAt: '2026-01-15 10:00:00',
      };

      // Act: Create and retrieve
      await repository.create(payment);
      const found = await repository.findById(payment.paymentId);

      // Assert: Found payment matches original
      expect(found).not.toBeNull();
      expect(found).toMatchObject({
        paymentId: 'pay_test_12345',
        checkoutId: 'chk_test_67890',
        method: 'zelle',
        currency: 'USD',
        amount: 99.99,
        status: 'pending',
        proof: null,
      });
      
      // Ensure paymentId is a string
      expect(typeof found.paymentId).toBe('string');
      expect(typeof found.checkoutId).toBe('string');

      
      // Verify timestamps are preserved
      expect(found.createdAt).toBe(mysqlDatetimeToIsoUtc(payment.createdAt));
      expect(found.updatedAt).toBe(mysqlDatetimeToIsoUtc(payment.updatedAt));
    });
  });
});
