/**
 * Migration: Add FK orders.cart_id → carts.cart_id
 * 
 * Enforces referential integrity between orders and their source cart.
 * ON DELETE RESTRICT: Prevents deleting a cart if an order references it.
 * ON UPDATE RESTRICT: Prevents updating cart_id in carts if orders reference it.
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
      AND TABLE_NAME = 'orders'
      AND CONSTRAINT_NAME = 'orders_cart_id_foreign'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  `);
  
  const exists = fkExists[0][0].count > 0;
  
  if (!exists) {
    // Clean orphaned orders (cart_id doesn't exist in carts)
    await knex.raw(`
      DELETE FROM orders 
      WHERE cart_id NOT IN (SELECT cart_id FROM carts)
    `);
    
    return knex.schema.alterTable('orders', (table) => {
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
    .alterTable('orders', (table) => {
      table.dropForeign('cart_id');
    });
};
