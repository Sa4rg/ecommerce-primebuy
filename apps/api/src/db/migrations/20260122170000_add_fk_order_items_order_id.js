/**
 * Migration: Add FK order_items.order_id → orders.order_id
 * 
 * Adds referential integrity with CASCADE delete.
 * When an order is deleted, its items are automatically removed.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('order_items', (table) => {
      table.foreign('order_id')
        .references('order_id')
        .inTable('orders')
        .onDelete('CASCADE')
        .onUpdate('RESTRICT');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('order_items', (table) => {
      table.dropForeign('order_id');
    });
};
