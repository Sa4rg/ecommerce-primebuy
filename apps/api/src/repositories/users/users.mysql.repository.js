
// Repository for users table (MySQL implementation)

const knex = require('../../db/knex');
const { isoToMySQLDatetime, mysqlDatetimeToISO } = require('../../utils/datetime');

class MySQLUsersRepository {
  /**
   * @param {Object} user
   * @returns {Promise<{ userId: string }>}
   */
  async create(user) {
    const now = isoToMySQLDatetime(new Date().toISOString());
    const dbUser = {
      user_id: user.userId,
      email: user.email,
      password_hash: user.passwordHash,
      role: user.role || 'customer',
      created_at: now,
      updated_at: now,
    };
    await knex('users').insert(dbUser);
    return { userId: user.userId };
  }

  /**
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    const row = await knex('users').where({ email }).first();
    return row ? this._mapRowToUser(row) : null;
  }

  /**
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async findById(userId) {
    const row = await knex('users').where({ user_id: userId }).first();
    return row ? this._mapRowToUser(row) : null;
  }

    async findByGoogleSub(googleSub) {
    const row = await knex('users').where({ google_sub: googleSub }).first();
    return row ? this._mapRowToUser(row) : null;
  }

  async updatePasswordHash(userId, passwordHash, nowDate = new Date()) {
    const now = isoToMySQLDatetime(nowDate.toISOString());
    await knex('users')
      .where({ user_id: userId })
      .update({
        password_hash: passwordHash,
        updated_at: now,
      });
  }

  _mapRowToUser(row) {
    return {
      userId: row.user_id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      name: row.name || null,
      authProvider: row.auth_provider || 'local',
      googleSub: row.google_sub || null,
      createdAt: mysqlDatetimeToISO(row.created_at),
      updatedAt: mysqlDatetimeToISO(row.updated_at),
    };
  }
}

module.exports = MySQLUsersRepository;
