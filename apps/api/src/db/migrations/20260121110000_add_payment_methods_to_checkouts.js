/**
 * Migration: Add payment_methods_json to checkouts table
 * 
 * Adds the missing payment_methods_json column to store
 * available payment methods for each checkout.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('checkouts', (table) => {
    table.json('payment_methods_json').notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('checkouts', (table) => {
    table.dropColumn('payment_methods_json');
  });
};
