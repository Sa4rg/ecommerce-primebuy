// auth.service.js
// Auth service for user registration and login

const argon2 = require('argon2');
const { AppError } = require('../utils/errors');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/env');
const jwt = require('jsonwebtoken');

function defaultIdGenerator() {
  return require('crypto').randomUUID();
}

function defaultNowProvider() {
  return new Date().toISOString();
}

function defaultJwtSigner(payload, options) {
  return jwt.sign(payload, JWT_SECRET, options);
}

function createAuthService({
  usersRepository,
  idGenerator = defaultIdGenerator,
  nowProvider = defaultNowProvider,
  jwtSigner = defaultJwtSigner,
} = {}) {
  if (!usersRepository) throw new Error('usersRepository is required');

  async function register(email, password) {
    // Minimal validation
    if (!email || typeof email !== 'string') {
      throw new AppError('Email is required', 400);
    }
    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await argon2.hash(password);
    const now = nowProvider();
    const user = {
      userId: idGenerator(),
      email: normalizedEmail,
      passwordHash,
      role: 'customer',
      createdAt: now,
      updatedAt: now,
    };
    try {
      await usersRepository.create(user);
    } catch (err) {
      // MySQL duplicate: err.code === 'ER_DUP_ENTRY', InMemory: err.code === 'DUPLICATE'
      if (err && (err.code === 'ER_DUP_ENTRY' || err.code === 'DUPLICATE')) {
        throw new AppError('Email already exists', 409);
      }
      throw err;
    }
    // Return safe user object
    return {
      userId: user.userId,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async function login(email, password) {
    if (!email || typeof email !== 'string') {
      throw new AppError('Email is required', 400);
    }
    if (!password || typeof password !== 'string') {
      throw new AppError('Password is required', 400);
    }
    const normalizedEmail = email.trim().toLowerCase();
    const user = await usersRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }
    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) {
      throw new AppError('Invalid credentials', 401);
    }
    const accessToken = jwtSigner(
      { sub: user.userId, role: user.role },
      { expiresIn: JWT_EXPIRES_IN }
    );
    return { accessToken };
  }

  return {
    register,
    login,
  };
}
module.exports = { createAuthService };


