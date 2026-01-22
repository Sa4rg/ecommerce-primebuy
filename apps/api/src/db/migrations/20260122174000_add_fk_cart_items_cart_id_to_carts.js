/**
 * Migration: Add FK cart_items.cart_id → carts.cart_id
 * 
 * Enforces referential integrity between cart items and their parent cart.
 * ON DELETE CASCADE: When a cart is deleted, all its items are automatically deleted.
 * ON UPDATE RESTRICT: Prevents updating cart_id in carts if items reference it.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .alterTable('cart_items', (table) => {
      table.foreign('cart_id')
        .references('cart_id')
        .inTable('carts')
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
    .alterTable('cart_items', (table) => {
      table.dropForeign('cart_id');
    });
};
