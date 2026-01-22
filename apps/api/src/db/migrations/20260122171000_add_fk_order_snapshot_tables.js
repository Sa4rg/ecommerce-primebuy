/**
 * Migration: Add FKs for order snapshot tables
 * 
 * Adds referential integrity with CASCADE delete for:
 * - order_customer.order_id → orders.order_id
 * - order_tax.order_id → orders.order_id
 * - order_shipping.order_id → orders.order_id
 * 
 * When an order is deleted, all its snapshot data is automatically removed.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('order_customer', (table) => {
      table.foreign('order_id')
        .references('order_id')
        .inTable('orders')
        .onDelete('CASCADE')
        .onUpdate('RESTRICT');
    })
    .alterTable('order_tax', (table) => {
      table.foreign('order_id')
        .references('order_id')
        .inTable('orders')
        .onDelete('CASCADE')
        .onUpdate('RESTRICT');
    })
    .alterTable('order_shipping', (table) => {
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
    .alterTable('order_customer', (table) => {
      table.dropForeign('order_id');
    })
    .alterTable('order_tax', (table) => {
      table.dropForeign('order_id');
    })
    .alterTable('order_shipping', (table) => {
      table.dropForeign('order_id');
    });
};
