/**
 * Migration: Add index on orders.created_at
 * 
 * Adds a performance index for queries that filter/sort by order creation date.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('orders', (table) => {
    table.index('created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('orders', (table) => {
    table.dropIndex(['created_at']);
  });
};
