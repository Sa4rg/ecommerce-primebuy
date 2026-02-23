// auth.service.js
// Auth service for user registration, login, refresh, and logout

const crypto = require('crypto');
const argon2 = require('argon2');
const { AppError } = require('../utils/errors');
const { JWT_SECRET, JWT_EXPIRES_IN, REFRESH_TOKEN_EXPIRES_IN_DAYS, REFRESH_TOKEN_PEPPER } = require('../config/env');
const { RESET_CODE_PEPPER, RESET_CODE_EXPIRES_MINUTES } = require('../config/env');
const jwt = require('jsonwebtoken');

function generate6DigitCode() {
  return String(crypto.randomInt(100000, 999999));
}

function hashResetCode(code, pepper) {
  return crypto.createHash('sha256').update(code + pepper).digest('hex');
}

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
  passwordResetRequestsRepository,
  emailSender,
} = {}) {

  if (!usersRepository) throw new Error('usersRepository is required');
  if (!refreshTokensRepository) throw new Error('refreshTokensRepository is required');
  if (!passwordResetRequestsRepository) throw new Error('passwordResetRequestsRepository is required');
  if (!emailSender) throw new Error('emailSender is required');

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

  async function issueTokensForUser(user) {
    const accessToken = jwtSigner(
      { sub: user.userId, role: user.role, email: user.email },
      { expiresIn: JWT_EXPIRES_IN }
    );

    const refreshToken = refreshTokenGenerator();
    const tokenHash = hashToken(refreshToken, refreshTokenPepper);
    const now = nowProvider();
    const expiresAt = new Date(
      now.getTime() + REFRESH_TOKEN_EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000
    );

    await refreshTokensRepository.create({
      refreshTokenId: idGenerator(),
      userId: user.userId,
      tokenHash,
      expiresAt,
      createdAt: now,
    });

    return { accessToken, refreshToken };
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

    async function loginWithGoogle({ googleSub, email, name }) {
    if (!googleSub || typeof googleSub !== 'string') {
      throw new AppError('Unauthorized', 401);
    }
    if (!email || typeof email !== 'string') {
      throw new AppError('Unauthorized', 401);
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1) if google_sub already linked -> login
    const bySub = await usersRepository.findByGoogleSub(googleSub);
    if (bySub) {
      return issueTokensForUser(bySub);
    }

    // 2) else if email exists -> link google identity
    const existing = await usersRepository.findByEmail(normalizedEmail);
    if (existing) {
      await usersRepository.linkGoogleIdentity({
        userId: existing.userId,
        googleSub,
        name: name || null,
      });
      // re-fetch not necessary; existing already has role/email/userId
      return issueTokensForUser(existing);
    }

    // 3) else create new google user
    const nowISO = nowProvider().toISOString();
    const newUserId = idGenerator();

    await usersRepository.createGoogleUser({
      userId: newUserId,
      email: normalizedEmail,
      googleSub,
      name: name || null,
      role: 'customer',
      createdAt: nowISO,
      updatedAt: nowISO,
    });

    const createdUser = await usersRepository.findById(newUserId);
    return issueTokensForUser(createdUser);
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

    async function requestPasswordReset(email) {
    // Always respond OK (no user enumeration)
    if (!email || typeof email !== 'string') {
      return { success: true };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await usersRepository.findByEmail(normalizedEmail);

    if (!user) {
      // Do not reveal
      return { success: true };
    }

    // Optional simple rate limit: max 1 request per 60s (example)
    // You can tune this later or remove.
    const now = nowProvider();
    const since = new Date(now.getTime() - 60 * 1000);
    try {
      const recent = await passwordResetRequestsRepository.countRecentByUserId(user.userId, since);
      if (recent >= 3) {
        // silently succeed (avoid giving attacker signal)
        return { success: true };
      }
    } catch {
      // ignore rate limit failures
    }

    if (!RESET_CODE_PEPPER) {
      // In production you MUST set this. For dev, you can allow empty, but it's weaker.
      // We'll allow for now to avoid blocking.
    }

    const code = generate6DigitCode();
    const codeHash = hashResetCode(code, RESET_CODE_PEPPER || '');

    const expiresAt = new Date(now.getTime() + RESET_CODE_EXPIRES_MINUTES * 60 * 1000);

    await passwordResetRequestsRepository.create({
      requestId: idGenerator(),
      userId: user.userId,
      codeHash,
      expiresAt,
      createdAt: now,
    });

    // Send email (real)
    await emailSender.sendPasswordResetCode({ to: user.email, code });

    return { success: true };
  }

  async function resetPasswordWithCode(email, code, newPassword) {
    if (!email || typeof email !== 'string') {
      throw new AppError('Invalid request', 400);
    }
    if (!code || typeof code !== 'string') {
      throw new AppError('Invalid request', 400);
    }
    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await usersRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new AppError('Invalid code', 400);
    }

    const now = nowProvider();
    const reqRecord = await passwordResetRequestsRepository.findLatestActiveByUserId(user.userId, now);
    if (!reqRecord) {
      throw new AppError('Invalid code', 400);
    }

    const expectedHash = reqRecord.codeHash;
    const providedHash = hashResetCode(code.trim(), RESET_CODE_PEPPER || '');

    if (!crypto.timingSafeEqual(
        Buffer.from(providedHash),
        Buffer.from(expectedHash)
    )) {
      throw new AppError('Invalid code', 400);
    }

    const passwordHash = await argon2.hash(newPassword);

    // you need an updatePassword method in users repo
    await usersRepository.updatePasswordHash(user.userId, passwordHash, now);

    await passwordResetRequestsRepository.markUsed(reqRecord.requestId, now);

    // Optional: revoke all refresh tokens after reset (recommended)
    try {
      await refreshTokensRepository.revokeAllByUserId(user.userId, now);
    } catch {}

    return { success: true };
  }

  return {
    register,
    login,
    refresh,
    logout,
    logoutAll,
    requestPasswordReset,
    resetPasswordWithCode,
    loginWithGoogle,
  };
}

module.exports = { createAuthService };


