/**
 * Database Cleanup Helper for Integration Tests
 * 
 * Deletes all records from tables in FK-safe order.
 * Children first, then parents.
 */

/**
 * Clean all database tables in FK-safe order
 * @param {import('knex').Knex} db - Knex database instance
 */
async function cleanupDb(db) {
  // Delete in FK-safe order: children first, then parents
  const tables = [
    'order_items',
    'order_shipping',
    'order_tax',
    'order_customer',
    'orders',
    'payments',
    'checkouts',
    'cart_items',
    'carts',
    'products'
  ];

  for (const table of tables) {
    const exists = await db.schema.hasTable(table);
    if (exists) {
      await db(table).del();
    }
  }
}

module.exports = { cleanupDb };
