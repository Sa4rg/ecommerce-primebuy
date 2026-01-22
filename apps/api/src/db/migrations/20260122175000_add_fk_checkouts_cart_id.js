/**
 * Migration: Add FK checkouts.cart_id → carts.cart_id
 * 
 * Enforces referential integrity between checkouts and their source cart.
 * ON DELETE RESTRICT: Prevents deleting a cart if a checkout references it.
 * ON UPDATE RESTRICT: Prevents updating cart_id in carts if checkouts reference it.
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
      AND TABLE_NAME = 'checkouts'
      AND CONSTRAINT_NAME = 'checkouts_cart_id_foreign'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  `);
  
  const exists = fkExists[0][0].count > 0;
  
  if (!exists) {
    // Clean orphaned checkouts (cart_id doesn't exist in carts)
    await knex.raw(`
      DELETE FROM checkouts 
      WHERE cart_id NOT IN (SELECT cart_id FROM carts)
    `);
    
    return knex.schema.alterTable('checkouts', (table) => {
      table.foreign('cart_id')
        .references('cart_id')
        .inTable('carts')
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
    .alterTable('checkouts', (table) => {
      table.dropForeign('cart_id');
    });
};
