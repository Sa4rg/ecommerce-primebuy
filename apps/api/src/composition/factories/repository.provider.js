/**
 * Repository Provider Helper
 * 
 * Centralized logic to determine which repository implementation to use
 * based on environment variables.
 * 
 * Strategy (evaluated in order):
 * 1. DB_INTEGRATION=1 → MySQL (HTTP integration tests)
 * 2. NODE_ENV=test → InMemory (unit tests must not require Docker)
 * 3. DB_PROVIDER=mysql OR DB_USE_MYSQL=1 → MySQL (runtime/development/production)
 * 4. Otherwise → InMemory (default fallback)
 */

/**
 * Determines if MySQL repositories should be used
 * @returns {boolean} true if MySQL should be used, false for InMemory
 */
function shouldUseMySQL() {
  // Rule 1: Integration tests use MySQL (HTTP tests with Docker)
  if (process.env.DB_INTEGRATION === "1") return true;

  // Rule 2: Unit tests use InMemory (no Docker required)
  if (process.env.NODE_ENV === "test") return false;

  // Rule 3: Runtime/development/production with explicit flag
  if (process.env.DB_PROVIDER === "mysql" || process.env.DB_USE_MYSQL === "1") {
    return true;
  }

  // Rule 4: Default to InMemory
  return false;
}
module.exports = { shouldUseMySQL };
