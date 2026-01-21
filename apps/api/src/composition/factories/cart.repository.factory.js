/**
 * Cart Repository Factory
 * 
 * Selects the appropriate CartRepository implementation based on environment.
 * 
 * Strategy:
 * - If DB_INTEGRATION=1 (set by test:db script): Use MySQLCartRepository
 * - Otherwise: Use InMemoryCartRepository (unit tests, development)
 * 
 * This ensures:
 * - Unit tests run fast without Docker (use in-memory)
 * - Integration tests validate real MySQL persistence
 * - No breaking changes to existing test suite
 */

const { InMemoryCartRepository } = require('../../repositories/cart/cart.memory.repository');
const { MySQLCartRepository } = require('../../repositories/cart/cart.mysql.repository');

/**
 * Creates the appropriate CartRepository instance
 * @returns {InMemoryCartRepository|MySQLCartRepository}
 */
function createCartRepository() {
  const useMySQL = process.env.DB_INTEGRATION === '1';
  
  if (useMySQL) {
    return new MySQLCartRepository();
  }
  
  return new InMemoryCartRepository();
}

module.exports = { createCartRepository };
