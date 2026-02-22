// Repository for password_reset_requests table (MySQL implementation)

const db = require("../../db/knex");

class MySQLPasswordResetRequestsRepository {
  constructor() {
    this.table = "password_reset_requests";
  }

  /**
   * Create a new password reset request
   */
  async create({ requestId, userId, email, codeHash, expiresAt, createdAt }) {
    await db(this.table).insert({
      request_id: requestId,
      user_id: userId || null,
      email: String(email || "").trim().toLowerCase(),
      code_hash: codeHash,
      attempts: 0,
      expires_at: expiresAt,
      used_at: null,
      created_at: createdAt,
    });

    return { requestId };
  }

  /**
   * Find latest active request by email (not used, not expired)
   */
  async findLatestActiveByEmail(email, now = new Date()) {
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const row = await db(this.table)
      .where("email", normalizedEmail)
      .whereNull("used_at")
      .where("expires_at", ">", now)
      .orderBy("created_at", "desc")
      .first();

    if (!row) return null;

    return this._mapRow(row);
  }

  /**
   * Mark a request as used
   */
  async markUsed(requestId, usedAt = new Date()) {
    await db(this.table)
      .where("request_id", requestId)
      .update({ used_at: usedAt });
  }

  /**
   * Increment attempts (used to rate-limit brute force)
   * Returns updated attempts count
   */
  async incrementAttempts(requestId) {
    await db(this.table)
      .where("request_id", requestId)
      .increment("attempts", 1);

    const row = await db(this.table)
      .select("attempts")
      .where("request_id", requestId)
      .first();

    return Number(row?.attempts || 0);
  }

  /**
   * Count recent reset requests by email since a given Date
   */
  async countRecentByEmail(email, since) {
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const result = await db(this.table)
      .where("email", normalizedEmail)
      .where("created_at", ">=", since)
      .count({ count: "*" })
      .first();

    return Number(result?.count || 0);
  }

  _mapRow(row) {
    return {
      requestId: row.request_id,
      userId: row.user_id,
      email: row.email,
      codeHash: row.code_hash,
      attempts: Number(row.attempts || 0),
      expiresAt: row.expires_at,
      usedAt: row.used_at,
      createdAt: row.created_at,
    };
  }
}

module.exports = MySQLPasswordResetRequestsRepository;