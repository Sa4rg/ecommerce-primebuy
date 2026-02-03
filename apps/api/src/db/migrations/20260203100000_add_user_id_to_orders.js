/**
 * Migration: Add user_id to orders table
 * 
 * Enforces real order ownership: every order must belong to a registered user.
 * 
 * Steps:
 * 1. Add user_id column (initially nullable for existing rows)
 * 2. Add index on user_id for query performance
 * 3. Make user_id NOT NULL (after data migration if needed)
 * 4. Add FK: orders.user_id → users.user_id
 * 
 * ON DELETE RESTRICT: Prevents deleting a user if they have orders.
 * ON UPDATE RESTRICT: Prevents updating user_id in users if orders reference it.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Step 1: Add user_id column as nullable and add index
  await knex.schema.alterTable('orders', (table) => {
    table.string('user_id', 36).nullable();
    table.index('user_id');
  });

  // Step 2: Alter to make user_id NOT NULL and add FK constraint
  // Note: In production, you'd first run a data migration to populate user_id
  // for existing orders before making it NOT NULL
  await knex.schema.alterTable('orders', (table) => {
    table.string('user_id', 36).notNullable().alter();
    table.foreign('user_id')
      .references('user_id')
      .inTable('users')
      .onDelete('RESTRICT')
      .onUpdate('RESTRICT');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('orders', (table) => {
    table.dropForeign('user_id');
    table.dropIndex('user_id');
    table.dropColumn('user_id');
  });
};
