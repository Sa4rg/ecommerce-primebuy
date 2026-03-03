// auth.service.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
const { createAuthService } = require('../auth.service');
const UsersMemoryRepository = require('../../repositories/users/users.memory.repository');
const { InMemoryRefreshTokensRepository } = require('../../repositories/refresh_tokens/refreshTokens.memory.repository');
const InMemoryPasswordResetRequestsRepository = require('../../repositories/password_reset/passwordReset.memory.repository');
const jwt = require('jsonwebtoken');

const TEST_SECRET = 'test_jwt_secret';
const TEST_EXPIRES_IN = '1h';
const FIXED_DATE = new Date('2026-01-31T12:00:00.000Z');
const FIXED_DATE_ISO = FIXED_DATE.toISOString();
const FIXED_ID = 'fixed-user-id';

function deterministicIdGenerator() { return FIXED_ID; }
function deterministicNowProvider() { return FIXED_DATE; }
function deterministicJwtSigner(payload, options) {
  return jwt.sign(payload, TEST_SECRET, { ...options, algorithm: 'HS256' });
}

function createSequentialIdGenerator() {
  let counter = 0;
  return () => `id-${++counter}`;
}

describe('auth.service', () => {
  let usersRepository;
  let refreshTokensRepository;
  let passwordResetRequestsRepository;
  let emailSender;
  let authService;

  beforeEach(() => {
    usersRepository = new UsersMemoryRepository();
    refreshTokensRepository = new InMemoryRefreshTokensRepository({ nowProvider: deterministicNowProvider });
    passwordResetRequestsRepository = new InMemoryPasswordResetRequestsRepository({ nowProvider: deterministicNowProvider });
    emailSender = { sendPasswordResetCode: vi.fn().mockResolvedValue(undefined) };
    authService = createAuthService({
      usersRepository,
      refreshTokensRepository,
      idGenerator: deterministicIdGenerator,
      nowProvider: deterministicNowProvider,
      jwtSigner: deterministicJwtSigner,
      refreshTokenPepper: 'test-pepper',
      passwordResetRequestsRepository,
      emailSender,
    });
  });

  // 1) should register a user and return safe user data (no passwordHash)
  it('should register a user and return safe user data', async () => {
    const result = await authService.register('Test@Email.com', 'Password123!');
    expect(result).toEqual({
      userId: FIXED_ID,
      email: 'test@email.com',
      role: 'customer',
      name: null,
      emailVerified: false,
      pendingVerification: true,
      createdAt: FIXED_DATE_ISO,
      updatedAt: FIXED_DATE_ISO,
    });
    // Ensure passwordHash is not returned
    expect(result.passwordHash).toBeUndefined();
  });

  // 2) should throw 409 when email already exists
  it('should throw 409 when email already exists', async () => {
    await authService.register('duplicate@email.com', 'Password123!');
    await expect(authService.register('duplicate@email.com', 'Password123!'))
      .rejects.toMatchObject({ message: 'Email already exists', statusCode: 409 });
  });

  // 3) should throw 400 for invalid email
  it('should throw 400 for invalid email', async () => {
    await expect(authService.register('', 'Password123!'))
      .rejects.toMatchObject({ message: 'Email is required', statusCode: 400 });
    await expect(authService.register(null, 'Password123!'))
      .rejects.toMatchObject({ message: 'Email is required', statusCode: 400 });
    await expect(authService.register(123, 'Password123!'))
      .rejects.toMatchObject({ message: 'Email is required', statusCode: 400 });
  });

  // 4) should throw 400 for password that doesn't meet policy
  it('should throw 400 for password policy violation', async () => {
    await expect(authService.register('short@pw.com', '123'))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  // Helper to register and verify a user (for tests that need to login)
  async function registerAndVerify(email, password) {
    const user = await authService.register(email, password);
    await usersRepository.markEmailVerified(user.userId);
    return user;
  }

  // 5) should return accessToken and refreshToken for valid credentials
  it('should return accessToken for valid credentials', async () => {
    await registerAndVerify('login@email.com', 'Password123!');
    const result = await authService.login('login@email.com', 'Password123!');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    // Verify JWT
    const decoded = jwt.verify(result.accessToken, TEST_SECRET);
    expect(decoded).toMatchObject({ sub: FIXED_ID, role: 'customer' });
  });

  // 6) should throw 401 for invalid credentials (wrong password)
  it('should throw 401 for invalid credentials (wrong password)', async () => {
    await registerAndVerify('wrongpw@email.com', 'Password123!');
    await expect(authService.login('wrongpw@email.com', 'wrongpassword'))
      .rejects.toMatchObject({ message: 'Invalid credentials', statusCode: 401 });
  });

  // 7) should throw 401 for invalid credentials (email not found)
  it('should throw 401 for invalid credentials (email not found)', async () => {
    await expect(authService.login('notfound@email.com', 'Password123!'))
      .rejects.toMatchObject({ message: 'Invalid credentials', statusCode: 401 });
  });

  // 8) refresh should return new accessToken and new refreshToken for valid refreshToken
  it('should return new accessToken and refreshToken for valid refreshToken', async () => {
    const user = await authService.register('refresh@email.com', 'Password123!');
    await usersRepository.markEmailVerified(user.userId);
    const loginResult = await authService.login('refresh@email.com', 'Password123!');
    const { refreshToken: oldRefreshToken } = loginResult;

    const result = await authService.refresh(oldRefreshToken);

    expect(result).toHaveProperty('accessToken');
    expect(typeof result.accessToken).toBe('string');
    expect(result).toHaveProperty('refreshToken');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.refreshToken.length).toBeGreaterThan(0);
    expect(result.refreshToken).not.toBe(oldRefreshToken);
    // Verify JWT
    const decoded = jwt.verify(result.accessToken, TEST_SECRET);
    expect(decoded).toMatchObject({ sub: FIXED_ID, role: 'customer' });
  });

  // 8b) refresh should throw 401 when reusing the same refreshToken (rotation / single-use)
  it('should throw 401 when reusing the same refreshToken after refresh (rotation)', async () => {
    const sequentialIdGenerator = createSequentialIdGenerator();
    const rotationAuthService = createAuthService({
      usersRepository,
      refreshTokensRepository,
      idGenerator: sequentialIdGenerator,
      nowProvider: deterministicNowProvider,
      jwtSigner: deterministicJwtSigner,
      passwordResetRequestsRepository,
      emailSender,
    });

    const user1 = await rotationAuthService.register('rotation@email.com', 'Password123!');
    await usersRepository.markEmailVerified(user1.userId);
    const loginResult = await rotationAuthService.login('rotation@email.com', 'Password123!');
    const { refreshToken: refreshTokenA } = loginResult;

    const refreshResult = await rotationAuthService.refresh(refreshTokenA);
    const { refreshToken: refreshTokenB } = refreshResult;

    expect(refreshTokenB).toBeDefined();
    expect(refreshTokenB).not.toBe(refreshTokenA);

    await expect(rotationAuthService.refresh(refreshTokenA))
      .rejects.toMatchObject({ message: 'Unauthorized', statusCode: 401 });
  });

  // 8c) refresh should throw 401 if refresh token is verified with a different pepper
  it('should throw 401 if refresh token is verified with a different pepper', async () => {
    const sequentialIdGenerator = createSequentialIdGenerator();
    const serviceWithPepperA = createAuthService({
      usersRepository,
      refreshTokensRepository,
      idGenerator: sequentialIdGenerator,
      nowProvider: deterministicNowProvider,
      jwtSigner: deterministicJwtSigner,
      refreshTokenPepper: 'pepper-A',
      passwordResetRequestsRepository,
      emailSender,
    });

    const serviceWithPepperB = createAuthService({
      usersRepository,
      refreshTokensRepository,
      idGenerator: sequentialIdGenerator,
      nowProvider: deterministicNowProvider,
      jwtSigner: deterministicJwtSigner,
      refreshTokenPepper: 'pepper-B',
      passwordResetRequestsRepository,
      emailSender,
    });

    const user2 = await serviceWithPepperA.register('pepper-test@email.com', 'Password123!');
    await usersRepository.markEmailVerified(user2.userId);
    const loginResult = await serviceWithPepperA.login('pepper-test@email.com', 'Password123!');
    const { refreshToken } = loginResult;

    await expect(serviceWithPepperB.refresh(refreshToken))
      .rejects.toMatchObject({ message: 'Unauthorized', statusCode: 401 });
  });

  // 9) refresh should throw 401 for invalid refreshToken
  it('should throw 401 for invalid refreshToken', async () => {
    await expect(authService.refresh('invalid-token'))
      .rejects.toMatchObject({ message: 'Unauthorized', statusCode: 401 });
  });

  // 10) refresh should throw 401 for missing refreshToken
  it('should throw 401 for missing refreshToken', async () => {
    await expect(authService.refresh(null))
      .rejects.toMatchObject({ message: 'Unauthorized', statusCode: 401 });
    await expect(authService.refresh(''))
      .rejects.toMatchObject({ message: 'Unauthorized', statusCode: 401 });
  });

  // 11) logout should return success true
  it('should return success true on logout', async () => {
    const user = await authService.register('logout@email.com', 'Password123!');
    await usersRepository.markEmailVerified(user.userId);
    const loginResult = await authService.login('logout@email.com', 'Password123!');
    const { refreshToken } = loginResult;

    const result = await authService.logout(refreshToken);

    expect(result).toEqual({ success: true });
  });

  // 12) logout should succeed even with invalid token
  it('should succeed on logout even with invalid token', async () => {
    const result = await authService.logout('nonexistent-token');
    expect(result).toEqual({ success: true });
  });

  // 13) refresh should fail after logout (token revoked)
  it('should throw 401 on refresh after logout', async () => {
    const user = await authService.register('revoke@email.com', 'Password123!');
    await usersRepository.markEmailVerified(user.userId);
    const loginResult = await authService.login('revoke@email.com', 'Password123!');
    const { refreshToken } = loginResult;

    await authService.logout(refreshToken);

    await expect(authService.refresh(refreshToken))
      .rejects.toMatchObject({ message: 'Unauthorized', statusCode: 401 });
  });

  // 14) logoutAll should revoke all refresh tokens for the user
  it('should revoke all refresh tokens for the user on logoutAll', async () => {
    const sequentialIdGenerator = createSequentialIdGenerator();
    const logoutAllAuthService = createAuthService({
      usersRepository,
      refreshTokensRepository,
      idGenerator: sequentialIdGenerator,
      nowProvider: deterministicNowProvider,
      jwtSigner: deterministicJwtSigner,
      refreshTokenPepper: 'test-pepper',
      passwordResetRequestsRepository,
      emailSender,
    });

    // Register and login to get refreshTokenA
    const registerResult = await logoutAllAuthService.register('logoutall@email.com', 'Password123!');
    const userId = registerResult.userId;
    await usersRepository.markEmailVerified(userId);

    const loginResult = await logoutAllAuthService.login('logoutall@email.com', 'Password123!');
    const { refreshToken: refreshTokenA } = loginResult;

    // Rotate to get refreshTokenB
    const refreshResult = await logoutAllAuthService.refresh(refreshTokenA);
    const { refreshToken: refreshTokenB } = refreshResult;

    // Call logoutAll
    const result = await logoutAllAuthService.logoutAll(userId);

    // Expect success
    expect(result).toEqual({ success: true });

    // Both tokens should now be rejected
    await expect(logoutAllAuthService.refresh(refreshTokenA))
      .rejects.toMatchObject({ message: 'Unauthorized', statusCode: 401 });

    await expect(logoutAllAuthService.refresh(refreshTokenB))
      .rejects.toMatchObject({ message: 'Unauthorized', statusCode: 401 });
  });

  // 15) logoutAll should succeed even if user has no active tokens
  it('should succeed on logoutAll even if user has no active tokens', async () => {
    const result = await authService.logoutAll('some-user-id-without-tokens');

    expect(result).toEqual({ success: true });
  });
});
