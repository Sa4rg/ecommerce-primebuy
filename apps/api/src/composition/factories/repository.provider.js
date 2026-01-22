/**
 * Repository Provider Helper
 * 
 * Centralized logic to determine which repository implementation to use
 * based on environment variables.
 * 
 * Strategy:
 * 1. DB_INTEGRATION=1 → Always use MySQL (integration tests)
 * 2. DB_PROVIDER=mysql or DB_USE_MYSQL=1 → Use MySQL (runtime/development)
 * 3. Otherwise → Use InMemory (default)
 */

/**
 * Determines if MySQL repositories should be used
 * @returns {boolean} true if MySQL should be used, false for InMemory
 */
function shouldUseMySQL() {
  if (process.env.DB_INTEGRATION === "1") return true;

  // IMPORTANT: unit tests should NOT use MySQL by default
  if (process.env.NODE_ENV === "test") return false;

  if (process.env.DB_PROVIDER === "mysql" || process.env.DB_USE_MYSQL === "1") {
    return true;
  }

  return false;
}
module.exports = { shouldUseMySQL };
