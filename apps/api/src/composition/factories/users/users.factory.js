// users.factory.js
// Factory for creating the appropriate UsersRepository implementation


const InMemoryUsersRepository = require('../../../repositories/users/users.memory.repository');
const MySQLUsersRepository = require('../../../repositories/users/users.mysql.repository');
const { shouldUseMySQL } = require('../repository.provider');


/**
 * Creates the appropriate UsersRepository instance
 * @returns {InMemoryUsersRepository|MySQLUsersRepository}
 */
function createUsersRepository() {
  if (shouldUseMySQL()) {
    return new MySQLUsersRepository();
  }
  return new InMemoryUsersRepository();
}

module.exports = { createUsersRepository };
