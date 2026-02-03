/**
 * MySQLRefreshTokensRepository
 *
 * MySQL implementation of RefreshTokensRepository contract.
 * Uses Knex for database operations.
 */

const db = require('../../db/knex');

class MySQLRefreshTokensRepository {
  constructor() {
    this.table = 'refresh_tokens';
  }

  /**
   * Creates a new refresh token record.
   * @param {object} params
   * @param {string} params.refreshTokenId
   * @param {string} params.userId
   * @param {string} params.tokenHash
   * @param {Date} params.expiresAt
   * @param {Date} params.createdAt
   * @returns {Promise<{ refreshTokenId: string }>}
   */
  async create({ refreshTokenId, userId, tokenHash, expiresAt, createdAt }) {
    await db(this.table).insert({
      refresh_token_id: refreshTokenId,
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      revoked_at: null,
      created_at: createdAt,
    });

    return { refreshTokenId };
  }

  /**
   * Finds an active (not revoked, not expired) refresh token by its hash.
   * @param {string} tokenHash
   * @returns {Promise<object|null>} The token record or null if not found/invalid
   */
  async findActiveByHash(tokenHash) {
    const now = new Date();

    const row = await db(this.table)
      .where('token_hash', tokenHash)
      .whereNull('revoked_at')
      .where('expires_at', '>', now)
      .first();

    if (!row) {
      return null;
    }

    return {
      refreshTokenId: row.refresh_token_id,
      userId: row.user_id,
      tokenHash: row.token_hash,
      expiresAt: row.expires_at,
      revokedAt: row.revoked_at,
      createdAt: row.created_at,
    };
  }

  /**
   * Revokes a refresh token by its hash.
   * @param {string} tokenHash
   * @param {Date} revokedAt
   * @returns {Promise<void>}
   */
  async revokeByHash(tokenHash, revokedAt) {
    await db(this.table)
      .where('token_hash', tokenHash)
      .update({ revoked_at: revokedAt });
  }
}

module.exports = { MySQLRefreshTokensRepository };
