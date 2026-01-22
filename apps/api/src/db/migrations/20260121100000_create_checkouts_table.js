/**
 * Migration: Create checkouts table
 * 
 * Creates checkouts table for transient snapshots between Cart and Payment.
 * Stores totals and exchange rate as JSON for MVP simplicity.
 * 
 * No foreign keys for MVP simplicity.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('checkouts', (table) => {
    table.string('checkout_id', 36).primary().notNullable();
    table.string('cart_id', 36).notNullable();
    table.json('totals_json').notNullable();
    table.json('exchange_rate_json').nullable();
    table.string('status', 32).notNullable();
    table.datetime('created_at').notNullable();
    table.datetime('updated_at').notNullable();
    
    table.index('cart_id');
    table.index('status');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('checkouts');
};
