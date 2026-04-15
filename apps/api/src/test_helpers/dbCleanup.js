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
  // Tables with FK to users MUST be deleted before users
  const tables = [
    // Order-related tables (FK to orders)
    'order_items',
    'order_shipping',
    'order_tax',
    'order_customer',
    
    // Orders (FK to users, payments, checkouts, carts)
    'orders',
    
    // Payments (FK to users, checkouts)
    'payments',
    
    // Checkouts (FK to carts)
    'checkouts',
    
    // Cart-related tables (FK to carts)
    'cart_items',
    
    // Carts (FK to users)
    'carts',
    
    // User-related tables (FK to users) - MUST be before users
    'refresh_tokens',        // ON DELETE RESTRICT - blocks user deletion
    'email_verifications',   // ON DELETE CASCADE
    'password_reset_requests', // ON DELETE SET NULL
    
    // Independent tables
    'products',
    
    // Users (last - referenced by many tables)
    'users'
  ];

  for (const table of tables) {
    const exists = await db.schema.hasTable(table);
    if (exists) {
      await db(table).del();
    }
  }
}

module.exports = { cleanupDb };
