// In-memory repository for email_verifications (for testing)

class InMemoryEmailVerificationsRepository {
  constructor() {
    this.store = new Map();
  }

  async create({ verificationId, userId, codeHash, expiresAt, createdAt }) {
    const record = {
      verificationId,
      userId,
      codeHash,
      attempts: 0,
      expiresAt,
      usedAt: null,
      createdAt,
    };
    this.store.set(verificationId, record);
    return { verificationId };
  }

  async findLatestActiveByUserId(userId, now = new Date()) {
    let latest = null;
    for (const record of this.store.values()) {
      if (
        record.userId === userId &&
        record.usedAt === null &&
        new Date(record.expiresAt) > now
      ) {
        if (!latest || new Date(record.createdAt) > new Date(latest.createdAt)) {
          latest = record;
        }
      }
    }
    return latest;
  }

  async markUsed(verificationId, usedAt = new Date()) {
    const record = this.store.get(verificationId);
    if (record) {
      record.usedAt = usedAt;
    }
  }

  async incrementAttempts(verificationId) {
    const record = this.store.get(verificationId);
    if (record) {
      record.attempts += 1;
      return record.attempts;
    }
    return 0;
  }

  async countRecentByUserId(userId, since) {
    let count = 0;
    for (const record of this.store.values()) {
      if (
        record.userId === userId &&
        new Date(record.createdAt) >= since
      ) {
        count++;
      }
    }
    return count;
  }

  // For testing
  clear() {
    this.store.clear();
  }
}

module.exports = { InMemoryEmailVerificationsRepository };
