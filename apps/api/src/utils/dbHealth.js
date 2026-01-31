const db = require('../db/knex');

/**
 * Database Health Check
 * 
 * Performs a minimal connectivity test against the database.
 * 
 * @returns {Promise<boolean>} true if database is reachable, false otherwise
 */
async function pingDb() {
  try {
    await db.raw('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
}

module.exports = { pingDb };
