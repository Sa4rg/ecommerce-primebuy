/**
 * Migration: Add FK orders.checkout_id → checkouts.checkout_id
 * 
 * Adds referential integrity with RESTRICT.
 * Cannot delete a checkout if orders reference it.
 * Cannot create an order with a non-existent checkout_id.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('orders', (table) => {
      table.foreign('checkout_id')
        .references('checkout_id')
        .inTable('checkouts')
        .onDelete('RESTRICT')
        .onUpdate('RESTRICT');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('orders', (table) => {
      table.dropForeign('checkout_id');
    });
};
