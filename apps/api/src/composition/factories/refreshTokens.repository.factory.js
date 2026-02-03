/**
 * RefreshTokens Repository Factory
 *
 * Selects the appropriate RefreshTokensRepository implementation based on environment.
 *
 * Strategy:
 * - If DB_INTEGRATION=1 (set by test:db script): Use MySQLRefreshTokensRepository
 * - Otherwise: Use InMemoryRefreshTokensRepository (unit tests, development)
 *
 * This ensures:
 * - Unit tests run fast without Docker (use in-memory)
 * - Integration tests validate real MySQL persistence
 * - No breaking changes to existing test suite
 */

const { InMemoryRefreshTokensRepository } = require('../../repositories/refresh_tokens/refreshTokens.memory.repository');
const { MySQLRefreshTokensRepository } = require('../../repositories/refresh_tokens/refreshTokens.mysql.repository');
const { shouldUseMySQL } = require('./repository.provider');

/**
 * Creates the appropriate RefreshTokensRepository instance
 * @returns {InMemoryRefreshTokensRepository|MySQLRefreshTokensRepository}
 */
function createRefreshTokensRepository() {
  const useMySQL = shouldUseMySQL();

  if (useMySQL) {
    return new MySQLRefreshTokensRepository();
  }

  return new InMemoryRefreshTokensRepository();
}

module.exports = { createRefreshTokensRepository };
