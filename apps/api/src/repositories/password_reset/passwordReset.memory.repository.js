class InMemoryPasswordResetRequestsRepository {
  constructor({ nowProvider = () => new Date() } = {}) {
    this.items = [];
    this.nowProvider = nowProvider;
  }

  async create({ requestId, userId, email, codeHash, expiresAt, createdAt }) {
    const normalizedEmail = String(email || "").trim().toLowerCase();

    this.items.push({
      requestId,
      userId: userId || null,
      email: normalizedEmail,
      codeHash,
      attempts: 0,
      expiresAt,
      usedAt: null,
      createdAt,
    });

    return { requestId };
  }

  async findLatestActiveByEmail(email, now = this.nowProvider()) {
    const normalizedEmail = String(email || "").trim().toLowerCase();

    const candidates = this.items
      .filter((x) => x.email === normalizedEmail && !x.usedAt && x.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return candidates[0] ? { ...candidates[0] } : null;
  }

  async markUsed(requestId, usedAt = this.nowProvider()) {
    const item = this.items.find((x) => x.requestId === requestId);
    if (item) item.usedAt = usedAt;
  }

  async incrementAttempts(requestId) {
    const item = this.items.find((x) => x.requestId === requestId);
    if (!item) return 0;
    item.attempts += 1;
    return item.attempts;
  }

  async countRecentByEmail(email, since) {
    const normalizedEmail = String(email || "").trim().toLowerCase();
    return this.items.filter((x) => x.email === normalizedEmail && x.createdAt >= since).length;
  }

  async findLatestActiveByUserId(userId, now = this.nowProvider()) {
    const candidates = this.items
      .filter((x) => x.userId === userId && !x.usedAt && x.expiresAt > now)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return candidates[0] ? { ...candidates[0] } : null;
  }

  async countRecentByUserId(userId, since) {
    return this.items.filter(
      (x) => x.userId === userId && x.createdAt >= since
    ).length;
  }

  clear() {
    this.items = [];
  }
}

module.exports = InMemoryPasswordResetRequestsRepository;