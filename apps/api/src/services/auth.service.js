// auth.service.js
// Auth service for user registration, login, refresh, and logout

const crypto = require('crypto');
const argon2 = require('argon2');
const { AppError } = require('../utils/errors');
const { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN_DAYS, REFRESH_TOKEN_PEPPER } = require('../config/env');
const jwt = require('jsonwebtoken');

function defaultIdGenerator() {
  return crypto.randomUUID();
}

function defaultNowProvider() {
  return new Date();
}

function defaultJwtSigner(payload, options) {
  return jwt.sign(payload, JWT_SECRET, options);
}

function defaultRefreshTokenGenerator() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token, pepper) {
  return crypto.createHash('sha256').update(token + pepper).digest('hex');
}

function createAuthService({
  usersRepository,
  refreshTokensRepository,
  idGenerator = defaultIdGenerator,
  nowProvider = defaultNowProvider,
  jwtSigner = defaultJwtSigner,
  refreshTokenGenerator = defaultRefreshTokenGenerator,
  refreshTokenPepper = REFRESH_TOKEN_PEPPER,
} = {}) {
  if (!usersRepository) throw new Error('usersRepository is required');
  if (!refreshTokensRepository) throw new Error('refreshTokensRepository is required');

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
    const nowISO = now.toISOString();
    const user = {
      userId: idGenerator(),
      email: normalizedEmail,
      passwordHash,
      role: 'customer',
      createdAt: nowISO,
      updatedAt: nowISO,
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

    // Generate access token
    const accessToken = jwtSigner(
      { sub: user.userId, role: user.role, email: user.email },
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Generate and store refresh token
    const refreshToken = refreshTokenGenerator();
    const tokenHash = hashToken(refreshToken, refreshTokenPepper);
    const now = nowProvider();
    const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

    await refreshTokensRepository.create({
      refreshTokenId: idGenerator(),
      userId: user.userId,
      tokenHash,
      expiresAt,
      createdAt: now,
    });

    return { accessToken, refreshToken };
  }

  async function refresh(refreshToken) {
    if (!refreshToken || typeof refreshToken !== 'string') {
      throw new AppError('Unauthorized', 401);
    }

    const tokenHash = hashToken(refreshToken, refreshTokenPepper);
    const tokenRecord = await refreshTokensRepository.findActiveByHash(tokenHash);

    if (!tokenRecord) {
      throw new AppError('Unauthorized', 401);
    }

    const user = await usersRepository.findById(tokenRecord.userId);
    if (!user) {
      throw new AppError('Unauthorized', 401);
    }

    const now = nowProvider();

    await refreshTokensRepository.revokeByHash(tokenHash, now);

    const newRefreshToken = refreshTokenGenerator();
    const newTokenHash = hashToken(newRefreshToken, refreshTokenPepper);
    const expiresAt = new Date(now.getTime() + REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000);

    await refreshTokensRepository.create({
      refreshTokenId: idGenerator(),
      userId: user.userId,
      tokenHash: newTokenHash,
      expiresAt,
      createdAt: now,
    });

    const accessToken = jwtSigner(
      { sub: user.userId, role: user.role, email: user.email },
      { expiresIn: JWT_EXPIRES_IN }
    );

    return { accessToken, refreshToken: newRefreshToken };
  }

  async function logout(refreshToken) {
    if (!refreshToken || typeof refreshToken !== 'string') {
      // Still succeed even if no token provided
      return { success: true };
    }

    const tokenHash = hashToken(refreshToken, refreshTokenPepper);
    const now = nowProvider();
    await refreshTokensRepository.revokeByHash(tokenHash, now);

    return { success: true };
  }

  async function logoutAll(userId) {
    if (!userId || typeof userId !== 'string') {
      throw new AppError('Unauthorized', 401);
    }

    const now = nowProvider();
    await refreshTokensRepository.revokeAllByUserId(userId, now);

    return { success: true };
  }

  return {
    register,
    login,
    refresh,
    logout,
    logoutAll,
  };
}
module.exports = { createAuthService };


