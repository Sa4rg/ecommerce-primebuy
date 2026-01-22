/**
 * Migration: Add FK payments.checkout_id → checkouts.checkout_id
 * 
 * Enforces referential integrity between payments and their source checkout.
 * ON DELETE RESTRICT: Prevents deleting a checkout if a payment references it.
 * ON UPDATE RESTRICT: Prevents updating checkout_id in checkouts if payments reference it.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Check if FK already exists (from manual work or previous attempts)
  const fkExists = await knex.raw(`
    SELECT COUNT(*) as count 
    FROM information_schema.TABLE_CONSTRAINTS 
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'payments'
      AND CONSTRAINT_NAME = 'payments_checkout_id_foreign'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  `);
  
  const exists = fkExists[0][0].count > 0;
  
  if (!exists) {
    // Clean orphaned payments (checkout_id doesn't exist in checkouts)
    await knex.raw(`
      DELETE FROM payments 
      WHERE checkout_id NOT IN (SELECT checkout_id FROM checkouts)
    `);
    
    return knex.schema.alterTable('payments', (table) => {
      table.foreign('checkout_id')
        .references('checkout_id')
        .inTable('checkouts')
        .onDelete('RESTRICT')
        .onUpdate('RESTRICT');
    });
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .alterTable('payments', (table) => {
      table.dropForeign('checkout_id');
    });
};
