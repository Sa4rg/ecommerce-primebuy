/**
 * Migration: Add FK orders.payment_id → payments.payment_id
 * 
 * Adds referential integrity with RESTRICT.
 * Cannot delete a payment if orders reference it.
 * Cannot create an order with a non-existent payment_id.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('orders', (table) => {
      table.foreign('payment_id')
        .references('payment_id')
        .inTable('payments')
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
      table.dropForeign('payment_id');
    });
};
