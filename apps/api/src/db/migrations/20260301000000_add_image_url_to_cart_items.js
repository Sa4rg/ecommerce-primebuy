/**
 * Migration: Add image_url column to cart_items
 * 
 * Allows cart items to store the product image URL for displaying
 * in cart and checkout without refetching products.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('cart_items', (table) => {
    table.string('image_url', 2048).nullable().after('line_total_usd');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('cart_items', (table) => {
    table.dropColumn('image_url');
  });
};
