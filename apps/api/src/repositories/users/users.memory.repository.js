
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
}

InMemoryUsersRepository.DuplicateEmailError = DuplicateEmailError;
module.exports = InMemoryUsersRepository;
