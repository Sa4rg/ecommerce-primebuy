/**
 * Migration: Create products table
 * 
 * Creates the products table with:
 * - id: INT PRIMARY KEY AUTO_INCREMENT
 * - name: VARCHAR NOT NULL
 * - price_usd: DECIMAL(10,2) NOT NULL (supports prices up to 99,999,999.99)
 * - stock: INT NOT NULL
 * - category: VARCHAR NOT NULL
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.decimal('price_usd', 10, 2).notNullable();
    table.integer('stock').notNullable();
    table.string('category', 100).notNullable();
    table.timestamps(true, true); // created_at, updated_at
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('products');
};
