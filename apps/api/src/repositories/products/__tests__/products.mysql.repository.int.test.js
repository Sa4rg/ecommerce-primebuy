/**
 * Integration Tests: MySQLProductsRepository
 * 
 * Tests the MySQL implementation against a real database.
 * Requires Docker MySQL to be running (pnpm db:up).
 * 
 * Run: pnpm test products.mysql.repository.int.test.js
 */

import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import { MySQLProductsRepository } from '../products.mysql.repository';
import db from '../../../db/knex';

describe('MySQLProductsRepository - Integration Tests', () => {
  let repository;

  beforeAll(async () => {
    // Run migrations to ensure table exists
    await db.migrate.latest();
    repository = new MySQLProductsRepository();
  });

  beforeEach(async () => {
    // Clean table before each test
    await db('products').truncate();
  });

  afterAll(async () => {
    // Close database connection
    await db.destroy();
  });

  describe('create()', () => {
    it('should persist product and return it with id as string', async () => {
      const productData = {
        name: 'Laptop',
        priceUSD: 999.99,
        stock: 10,
        category: 'Electronics',
      };

      const created = await repository.create(productData);

      expect(created).toMatchObject({
        name: 'Laptop',
        priceUSD: 999.99,
        stock: 10,
        category: 'Electronics',
      });
      expect(typeof created.id).toBe('string');
      expect(created.id).toBeTruthy();
    });

    it('should persist multiple products with auto-increment ids', async () => {
      const product1 = await repository.create({
        name: 'Product 1',
        priceUSD: 10.00,
        stock: 5,
        category: 'Category A',
      });

      const product2 = await repository.create({
        name: 'Product 2',
        priceUSD: 20.00,
        stock: 3,
        category: 'Category B',
      });

      expect(product1.id).not.toBe(product2.id);
      expect(parseInt(product2.id, 10)).toBeGreaterThan(parseInt(product1.id, 10));
    });
  });

  describe('findAll()', () => {
    it('should return empty array when no products exist', async () => {
      const products = await repository.findAll();
      expect(products).toEqual([]);
    });

    it('should return all persisted products in creation order', async () => {
      await repository.create({
        name: 'First',
        priceUSD: 10.00,
        stock: 1,
        category: 'A',
      });

      await repository.create({
        name: 'Second',
        priceUSD: 20.00,
        stock: 2,
        category: 'B',
      });

      await repository.create({
        name: 'Third',
        priceUSD: 30.00,
        stock: 3,
        category: 'C',
      });

      const products = await repository.findAll();

      expect(products).toHaveLength(3);
      expect(products[0].name).toBe('First');
      expect(products[1].name).toBe('Second');
      expect(products[2].name).toBe('Third');
      
      // Verify all ids are strings
      products.forEach(p => {
        expect(typeof p.id).toBe('string');
      });
    });

    it('should convert price_usd DECIMAL to number', async () => {
      await repository.create({
        name: 'Test',
        priceUSD: 123.45,
        stock: 1,
        category: 'Test',
      });

      const products = await repository.findAll();
      expect(typeof products[0].priceUSD).toBe('number');
      expect(products[0].priceUSD).toBe(123.45);
    });
  });

  describe('findById()', () => {
    it('should return product when it exists', async () => {
      const created = await repository.create({
        name: 'Mouse',
        priceUSD: 25.50,
        stock: 100,
        category: 'Accessories',
      });

      const found = await repository.findById(created.id);

      expect(found).toMatchObject({
        id: created.id,
        name: 'Mouse',
        priceUSD: 25.50,
        stock: 100,
        category: 'Accessories',
      });
    });

    it('should return null when product does not exist', async () => {
      const found = await repository.findById('99999');
      expect(found).toBeNull();
    });

    it('should accept string id and query correctly', async () => {
      const created = await repository.create({
        name: 'Keyboard',
        priceUSD: 75.00,
        stock: 50,
        category: 'Accessories',
      });

      // Explicitly pass string id
      const found = await repository.findById(String(created.id));
      expect(found).not.toBeNull();
      expect(found.name).toBe('Keyboard');
    });
  });

  describe('update()', () => {
    it('should update existing product and return updated version', async () => {
      const created = await repository.create({
        name: 'Old Name',
        priceUSD: 50.00,
        stock: 10,
        category: 'Old Category',
      });

      const updated = await repository.update(created.id, {
        name: 'New Name',
        priceUSD: 60.00,
      });

      expect(updated).toMatchObject({
        id: created.id,
        name: 'New Name',
        priceUSD: 60.00,
        stock: 10, // unchanged
        category: 'Old Category', // unchanged
      });
    });

    it('should update only provided fields', async () => {
      const created = await repository.create({
        name: 'Product',
        priceUSD: 100.00,
        stock: 20,
        category: 'Electronics',
      });

      const updated = await repository.update(created.id, {
        stock: 15,
      });

      expect(updated).toMatchObject({
        id: created.id,
        name: 'Product',
        priceUSD: 100.00,
        stock: 15,
        category: 'Electronics',
      });
    });

    it('should return null when product does not exist', async () => {
      const updated = await repository.update('99999', {
        name: 'Non-existent',
      });

      expect(updated).toBeNull();
    });
  });

  describe('delete()', () => {
    it('should delete existing product and return it', async () => {
      const created = await repository.create({
        name: 'To Delete',
        priceUSD: 10.00,
        stock: 5,
        category: 'Test',
      });

      const deleted = await repository.delete(created.id);

      expect(deleted).toMatchObject({
        id: created.id,
        name: 'To Delete',
        priceUSD: 10.00,
        stock: 5,
        category: 'Test',
      });

      // Verify it's actually deleted
      const found = await repository.findById(created.id);
      expect(found).toBeNull();
    });

    it('should return null when product does not exist', async () => {
      const deleted = await repository.delete('99999');
      expect(deleted).toBeNull();
    });

    it('should not affect other products', async () => {
      const product1 = await repository.create({
        name: 'Keep',
        priceUSD: 10.00,
        stock: 1,
        category: 'A',
      });

      const product2 = await repository.create({
        name: 'Delete',
        priceUSD: 20.00,
        stock: 2,
        category: 'B',
      });

      await repository.delete(product2.id);

      const remaining = await repository.findAll();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(product1.id);
    });
  });
});
