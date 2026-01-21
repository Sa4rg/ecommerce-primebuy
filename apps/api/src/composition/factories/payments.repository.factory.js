/**
 * Payments Repository Factory
 * 
 * Selects the appropriate PaymentsRepository implementation based on environment.
 * 
 * Strategy:
 * - If DB_INTEGRATION=1 (set by test:db script): Use MySQLPaymentsRepository
 * - Otherwise: Use InMemoryPaymentsRepository (unit tests, development)
 * 
 * This ensures:
 * - Unit tests run fast without Docker (use in-memory)
 * - Integration tests validate real MySQL persistence
 * - No breaking changes to existing test suite
 */

const { InMemoryPaymentsRepository } = require('../../repositories/payments/payments.memory.repository');
const { MySQLPaymentsRepository } = require('../../repositories/payments/payments.mysql.repository');

/**
 * Creates the appropriate PaymentsRepository instance
 * @returns {InMemoryPaymentsRepository|MySQLPaymentsRepository}
 */
function createPaymentsRepository() {
  const useMySQL = process.env.DB_INTEGRATION === '1';
  
  if (useMySQL) {
    return new MySQLPaymentsRepository();
  }
  
  return new InMemoryPaymentsRepository();
}

module.exports = { createPaymentsRepository };
