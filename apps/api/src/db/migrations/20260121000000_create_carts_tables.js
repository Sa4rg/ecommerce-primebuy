/**
 * Migration: Create carts tables
 * 
 * Creates 2 tables for cart persistence:
 * - carts (main cart record with metadata as JSON)
 * - cart_items (line items)
 * 
 * No foreign keys for MVP simplicity.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // 1. carts table
    .createTable('carts', (table) => {
      table.string('cart_id', 36).primary().notNullable();
      table.string('status', 32).notNullable();
      table.json('metadata_json').notNullable();
      table.datetime('created_at').notNullable();
      table.datetime('updated_at').notNullable();
      
      table.index('status');
    })
    
    // 2. cart_items table
    .createTable('cart_items', (table) => {
      table.increments('id').primary();
      table.string('cart_id', 36).notNullable();
      table.string('product_id', 36).notNullable();
      table.string('name', 255).notNullable();
      table.decimal('unit_price_usd', 12, 2).notNullable();
      table.integer('quantity').notNullable();
      table.decimal('line_total_usd', 12, 2).notNullable();
      
      table.index('cart_id');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('cart_items')
    .dropTableIfExists('carts');
};
