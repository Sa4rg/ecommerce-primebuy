/**
 * Checkout Repository Factory
 * 
 * Selects the appropriate CheckoutRepository implementation based on environment.
 * 
 * Strategy:
 * - If DB_INTEGRATION=1 (set by test:db script): Use MySQLCheckoutRepository
 * - Otherwise: Use InMemoryCheckoutRepository (unit tests, development)
 * 
 * This ensures:
 * - Unit tests run fast without Docker (use in-memory)
 * - Integration tests validate real MySQL persistence
 * - No breaking changes to existing test suite
 */

const { InMemoryCheckoutRepository } = require('../../repositories/checkout/checkout.memory.repository');
const { MySQLCheckoutRepository } = require('../../repositories/checkout/checkout.mysql.repository');
const { shouldUseMySQL } = require('./repository.provider');

/**
 * Creates the appropriate CheckoutRepository instance
 * @returns {InMemoryCheckoutRepository|MySQLCheckoutRepository}
 */
function createCheckoutRepository() {
  const useMySQL = shouldUseMySQL();
  
  if (useMySQL) {
    return new MySQLCheckoutRepository();
  }
  
  return new InMemoryCheckoutRepository();
}

module.exports = { createCheckoutRepository };
