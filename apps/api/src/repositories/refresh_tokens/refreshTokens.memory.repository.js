/**
 * InMemoryRefreshTokensRepository
 *
 * In-memory implementation of the RefreshTokensRepository contract.
 * Used for unit tests and development.
 */
class InMemoryRefreshTokensRepository {
  constructor() {
    /** @type {Map<string, object>} Store by refreshTokenId */
    this.tokensById = new Map();
    /** @type {Map<string, string>} Map tokenHash -> refreshTokenId for uniqueness */
    this.hashIndex = new Map();
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
   * @throws {Error} If tokenHash already exists
   */
  async create({ refreshTokenId, userId, tokenHash, expiresAt, createdAt }) {
    if (this.hashIndex.has(tokenHash)) {
      throw new Error('Token hash already exists');
    }

    const record = {
      refreshTokenId,
      userId,
      tokenHash,
      expiresAt,
      revokedAt: null,
      createdAt,
    };

    this.tokensById.set(refreshTokenId, record);
    this.hashIndex.set(tokenHash, refreshTokenId);

    return { refreshTokenId };
  }

  /**
   * Finds an active (not revoked, not expired) refresh token by its hash.
   * @param {string} tokenHash
   * @returns {Promise<object|null>} The token record or null if not found/invalid
   */
  async findActiveByHash(tokenHash) {
    const refreshTokenId = this.hashIndex.get(tokenHash);
    if (!refreshTokenId) {
      return null;
    }

    const record = this.tokensById.get(refreshTokenId);
    if (!record) {
      return null;
    }

    // Check if revoked
    if (record.revokedAt !== null) {
      return null;
    }

    // Check if expired
    const now = new Date();
    if (record.expiresAt <= now) {
      return null;
    }

    return { ...record };
  }

  /**
   * Revokes a refresh token by its hash.
   * @param {string} tokenHash
   * @param {Date} revokedAt
   * @returns {Promise<void>}
   */
  async revokeByHash(tokenHash, revokedAt) {
    const refreshTokenId = this.hashIndex.get(tokenHash);
    if (!refreshTokenId) {
      return;
    }

    const record = this.tokensById.get(refreshTokenId);
    if (record) {
      record.revokedAt = revokedAt;
    }
  }

  /**
   * Revokes all refresh tokens for a given user.
   * @param {string} userId
   * @param {Date} revokedAt
   * @returns {Promise<void>}
   */
  async revokeAllByUserId(userId, revokedAt) {
    for (const record of this.tokensById.values()) {
      if (record.userId === userId && record.revokedAt === null) {
        record.revokedAt = revokedAt;
      }
    }
  }

  /**
   * Clears all tokens. Used for testing.
   */
  clear() {
    this.tokensById.clear();
    this.hashIndex.clear();
  }
}

module.exports = { InMemoryRefreshTokensRepository };
