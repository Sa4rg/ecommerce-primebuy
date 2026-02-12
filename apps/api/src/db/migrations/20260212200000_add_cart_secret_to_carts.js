/**
 * Migration: Add cart_secret to carts table
 * 
 * Adds cart_secret column for anonymous cart mutation authorization.
 * Anonymous carts require this secret in X-Cart-Secret header to modify.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('carts', (table) => {
    table.string('cart_secret', 64).nullable().after('cart_id');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('carts', (table) => {
    table.dropColumn('cart_secret');
  });
};
