/**
 * Products Repository Factory
 * 
 * Selects the appropriate ProductsRepository implementation based on environment.
 * 
 * Strategy:
 * - If DB_INTEGRATION=1 (set by test:db script): Use MySQLProductsRepository
 * - Otherwise: Use InMemoryProductsRepository (unit tests, development)
 * 
 * This ensures:
 * - Unit tests run fast without Docker (use in-memory)
 * - Integration tests validate real MySQL persistence
 * - No breaking changes to existing test suite
 */

const { InMemoryProductsRepository } = require('../../repositories/products/products.memory.repository');
const { MySQLProductsRepository } = require('../../repositories/products/products.mysql.repository');
const { shouldUseMySQL } = require('./repository.provider');

/**
 * Creates the appropriate ProductsRepository instance
 * @param {Array} initialProducts - Initial seed data for InMemoryProductsRepository
 * @returns {InMemoryProductsRepository|MySQLProductsRepository}
 */
function createProductsRepository(initialProducts = []) {
  const useMySQL = shouldUseMySQL();
  
  if (useMySQL) {
    return new MySQLProductsRepository();
  }
  
  return new InMemoryProductsRepository(initialProducts);
}

module.exports = { createProductsRepository };
