/**
 * Orders Repository Factory
 * 
 * Selects the appropriate OrdersRepository implementation based on environment.
 * 
 * Strategy:
 * - If DB_INTEGRATION=1 (set by test:db script): Use MySQLOrdersRepository
 * - Otherwise: Use InMemoryOrdersRepository (unit tests, development)
 * 
 * This ensures:
 * - Unit tests run fast without Docker (use in-memory)
 * - Integration tests validate real MySQL persistence
 * - No breaking changes to existing test suite
 */

const { InMemoryOrdersRepository } = require('../../repositories/orders/orders.memory.repository');
const { MySQLOrdersRepository } = require('../../repositories/orders/orders.mysql.repository');
const { shouldUseMySQL } = require('./repository.provider');

/**
 * Creates the appropriate OrdersRepository instance
 * @returns {InMemoryOrdersRepository|MySQLOrdersRepository}
 */
function createOrdersRepository() {
  const useMySQL = shouldUseMySQL();
  
  if (useMySQL) {
    return new MySQLOrdersRepository();
  }
  
  return new InMemoryOrdersRepository();
}

module.exports = { createOrdersRepository };
