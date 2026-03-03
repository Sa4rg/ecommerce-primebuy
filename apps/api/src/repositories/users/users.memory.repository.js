
// In-memory implementation for users repository (for unit tests, no DB)

class DuplicateEmailError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DuplicateEmailError';
    this.code = 'DUPLICATE';
  }
}

class InMemoryUsersRepository {
  constructor() {
    this.usersById = new Map();
    this.userIdsByEmail = new Map();
    this.userIdsByGoogleSub = new Map();
  }

  /**
   * @param {Object} user
   * @returns {Promise<{ userId: string }>}
   */
  async create(user) {
    if (this.userIdsByEmail.has(user.email)) {
      throw new DuplicateEmailError('Email already exists');
    }
    this.usersById.set(user.userId, { ...user });
    this.userIdsByEmail.set(user.email, user.userId);
    if (user.googleSub) {
      if (this.userIdsByGoogleSub.has(user.googleSub)) {
        throw new Error('Google sub already exists');
      }
      this.userIdsByGoogleSub.set(user.googleSub, user.userId);
    }
    return { userId: user.userId };
  }

  /**
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    const userId = this.userIdsByEmail.get(email);
    if (!userId) return null;
    return { ...this.usersById.get(userId) };
  }

  /**
   * @param {string} userId
   * @returns {Promise<Object|null>}
   */
  async findById(userId) {
    const user = this.usersById.get(userId);
    return user ? { ...user } : null;
  }

  async findByGoogleSub(googleSub) {
    const userId = this.userIdsByGoogleSub.get(googleSub);
    if (!userId) return null;
    return { ...this.usersById.get(userId) };
  }

  async linkGoogleIdentity({ userId, googleSub, name }) {
    const user = this.usersById.get(userId);
    if (!user) return;

    user.googleSub = googleSub;
    user.name = name || null;
    user.authProvider = 'google';

    this.userIdsByGoogleSub.set(googleSub, userId);
  }

  async createGoogleUser({ userId, email, googleSub, name, role = 'customer' }) {
    const user = {
      userId,
      email,
      passwordHash: null,
      role,
      googleSub,
      name: name || null,
      authProvider: 'google',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await this.create(user);
    return { userId };
  }

  async updatePasswordHash(userId, passwordHash) {
    const user = this.usersById.get(userId);
    if (!user) return;
    user.passwordHash = passwordHash;
    user.updatedAt = new Date().toISOString();
  }

  async markEmailVerified(userId, nowDate = new Date()) {
    const user = this.usersById.get(userId);
    if (!user) return;
    user.emailVerified = true;
    user.updatedAt = nowDate.toISOString();
  }
}

InMemoryUsersRepository.DuplicateEmailError = DuplicateEmailError;
module.exports = InMemoryUsersRepository;
