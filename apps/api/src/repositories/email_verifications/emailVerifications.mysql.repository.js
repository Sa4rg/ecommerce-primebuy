// MySQL repository for email_verifications table

const db = require("../../db/knex");
const { isoToMySQLDatetime, mysqlDatetimeToISO } = require("../../utils/datetime");

class MySQLEmailVerificationsRepository {
  constructor() {
    this.table = "email_verifications";
  }

  async create({ verificationId, userId, codeHash, expiresAt, createdAt }) {
    await db(this.table).insert({
      verification_id: verificationId,
      user_id: userId,
      code_hash: codeHash,
      attempts: 0,
      expires_at: isoToMySQLDatetime(expiresAt.toISOString()),
      used_at: null,
      created_at: isoToMySQLDatetime(createdAt.toISOString()),
    });
    return { verificationId };
  }

  async findLatestActiveByUserId(userId, now = new Date()) {
    const row = await db(this.table)
      .where("user_id", userId)
      .whereNull("used_at")
      .where("expires_at", ">", isoToMySQLDatetime(now.toISOString()))
      .orderBy("created_at", "desc")
      .first();

    if (!row) return null;

    return this._mapRow(row);
  }

  async markUsed(verificationId, usedAt = new Date()) {
    await db(this.table)
      .where("verification_id", verificationId)
      .update({ used_at: isoToMySQLDatetime(usedAt.toISOString()) });
  }

  async incrementAttempts(verificationId) {
    await db(this.table)
      .where("verification_id", verificationId)
      .increment("attempts", 1);

    const row = await db(this.table)
      .select("attempts")
      .where("verification_id", verificationId)
      .first();

    return Number(row?.attempts || 0);
  }

  async countRecentByUserId(userId, since) {
    const result = await db(this.table)
      .where("user_id", userId)
      .where("created_at", ">=", isoToMySQLDatetime(since.toISOString()))
      .count("* as count")
      .first();

    return Number(result?.count || 0);
  }

  _mapRow(row) {
    return {
      verificationId: row.verification_id,
      userId: row.user_id,
      codeHash: row.code_hash,
      attempts: Number(row.attempts),
      expiresAt: row.expires_at instanceof Date 
        ? row.expires_at 
        : new Date(mysqlDatetimeToISO(row.expires_at)),
      usedAt: row.used_at 
        ? (row.used_at instanceof Date ? row.used_at : new Date(mysqlDatetimeToISO(row.used_at)))
        : null,
      createdAt: row.created_at instanceof Date 
        ? row.created_at 
        : new Date(mysqlDatetimeToISO(row.created_at)),
    };
  }
}

module.exports = { MySQLEmailVerificationsRepository };
