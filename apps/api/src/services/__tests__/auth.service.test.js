// auth.service.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
const { createAuthService } = require('../auth.service');
const UsersMemoryRepository = require('../../repositories/users/users.memory.repository');
const { InMemoryRefreshTokensRepository } = require('../../repositories/refresh_tokens/refreshTokens.memory.repository');
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

describe('auth.service', () => {
  let usersRepository;
  let refreshTokensRepository;
  let authService;

  beforeEach(() => {
    usersRepository = new UsersMemoryRepository();
    refreshTokensRepository = new InMemoryRefreshTokensRepository();
    authService = createAuthService({
      usersRepository,
      refreshTokensRepository,
      idGenerator: deterministicIdGenerator,
      nowProvider: deterministicNowProvider,
      jwtSigner: deterministicJwtSigner,
    });
  });

  // 1) should register a user and return safe user data (no passwordHash)
  it('should register a user and return safe user data', async () => {
    const result = await authService.register('Test@Email.com', 'password123');
    expect(result).toEqual({
      userId: FIXED_ID,
      email: 'test@email.com',
      role: 'customer',
      createdAt: FIXED_DATE_ISO,
      updatedAt: FIXED_DATE_ISO,
    });
    // Ensure passwordHash is not returned
    expect(result.passwordHash).toBeUndefined();
  });

  // 2) should throw 409 when email already exists
  it('should throw 409 when email already exists', async () => {
    await authService.register('duplicate@email.com', 'password123');
    await expect(authService.register('duplicate@email.com', 'password123'))
      .rejects.toMatchObject({ message: 'Email already exists', statusCode: 409 });
  });

  // 3) should throw 400 for invalid email
  it('should throw 400 for invalid email', async () => {
    await expect(authService.register('', 'password123'))
      .rejects.toMatchObject({ message: 'Email is required', statusCode: 400 });
    await expect(authService.register(null, 'password123'))
      .rejects.toMatchObject({ message: 'Email is required', statusCode: 400 });
    await expect(authService.register(123, 'password123'))
      .rejects.toMatchObject({ message: 'Email is required', statusCode: 400 });
  });

  // 4) should throw 400 for short password (< 8)
  it('should throw 400 for short password', async () => {
    await expect(authService.register('short@pw.com', '123'))
      .rejects.toMatchObject({ message: 'Password must be at least 8 characters', statusCode: 400 });
  });

  // 5) should return accessToken and refreshToken for valid credentials
  it('should return accessToken for valid credentials', async () => {
    await authService.register('login@email.com', 'password123');
    const result = await authService.login('login@email.com', 'password123');
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('refreshToken');
    // Verify JWT
    const decoded = jwt.verify(result.accessToken, TEST_SECRET);
    expect(decoded).toMatchObject({ sub: FIXED_ID, role: 'customer' });
  });

  // 6) should throw 401 for invalid credentials (wrong password)
  it('should throw 401 for invalid credentials (wrong password)', async () => {
    await authService.register('wrongpw@email.com', 'password123');
    await expect(authService.login('wrongpw@email.com', 'wrongpassword'))
      .rejects.toMatchObject({ message: 'Invalid credentials', statusCode: 401 });
  });

  // 7) should throw 401 for invalid credentials (email not found)
  it('should throw 401 for invalid credentials (email not found)', async () => {
    await expect(authService.login('notfound@email.com', 'password123'))
      .rejects.toMatchObject({ message: 'Invalid credentials', statusCode: 401 });
  });

  // 8) refresh should return new accessToken for valid refreshToken
  it('should return new accessToken for valid refreshToken', async () => {
    await authService.register('refresh@email.com', 'password123');
    const loginResult = await authService.login('refresh@email.com', 'password123');
    const { refreshToken } = loginResult;

    const result = await authService.refresh(refreshToken);

    expect(result).toHaveProperty('accessToken');
    expect(typeof result.accessToken).toBe('string');
    // Verify JWT
    const decoded = jwt.verify(result.accessToken, TEST_SECRET);
    expect(decoded).toMatchObject({ sub: FIXED_ID, role: 'customer' });
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
    await authService.register('logout@email.com', 'password123');
    const loginResult = await authService.login('logout@email.com', 'password123');
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
    await authService.register('revoke@email.com', 'password123');
    const loginResult = await authService.login('revoke@email.com', 'password123');
    const { refreshToken } = loginResult;

    await authService.logout(refreshToken);

    await expect(authService.refresh(refreshToken))
      .rejects.toMatchObject({ message: 'Unauthorized', statusCode: 401 });
  });
});
