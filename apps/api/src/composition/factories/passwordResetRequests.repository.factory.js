const InMemoryPasswordResetRequestsRepository = require('../../repositories/password_reset/passwordReset.memory.repository');
const MySQLPasswordResetRequestsRepository = require('../../repositories/password_reset/passwordReset.mysql.repository');
const { shouldUseMySQL } = require('./repository.provider');

function createPasswordResetRequestsRepository() {
  if (shouldUseMySQL()) return new MySQLPasswordResetRequestsRepository();
  return new InMemoryPasswordResetRequestsRepository();
}

module.exports = { createPasswordResetRequestsRepository };
