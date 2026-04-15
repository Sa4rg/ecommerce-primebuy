/**
 * Migration: Add UNIQUE constraint to orders.payment_id
 * 
 * Prevents creating multiple orders for the same payment.
 * The service layer already handles this with try/catch, but the constraint
 * wasn't present in the original migration.
 * 
 * Context: Tests expect 409 when trying to create an order for a payment that
 * already has an order (auto-created during payment confirmation).
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add UNIQUE constraint to payment_id
  // Name it explicitly so we can reference it in service error handling
  await knex.schema.alterTable('orders', (table) => {
    table.unique('payment_id', 'orders_payment_id_unique');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('orders', (table) => {
    table.dropUnique('payment_id', 'orders_payment_id_unique');
  });
};
