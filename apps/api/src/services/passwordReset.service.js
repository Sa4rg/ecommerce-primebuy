const crypto = require('crypto');
const argon2 = require('argon2');
const { AppError } = require('../utils/errors');
const {
  RESET_CODE_PEPPER,
  RESET_CODE_EXPIRES_MINUTES,
} = require('../config/env');

function hashCode(code) {
  return crypto
    .createHash('sha256')
    .update(code + RESET_CODE_PEPPER)
    .digest('hex');
}

function generate6DigitCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createPasswordResetService({
  usersRepository,
  passwordResetRepository,
  emailService,
  idGenerator = () => crypto.randomUUID(),
  nowProvider = () => new Date(),
}) {
  async function requestReset(email) {
    if (!email) return;

    const normalizedEmail = email.trim().toLowerCase();
    const user = await usersRepository.findByEmail(normalizedEmail);

    const now = nowProvider();
    const expiresAt = new Date(
      now.getTime() + RESET_CODE_EXPIRES_MINUTES * 60 * 1000
    );

    const code = generate6DigitCode();
    const codeHash = hashCode(code);

    await passwordResetRepository.create({
      requestId: idGenerator(),
      userId: user?.userId || null,
      codeHash,
      expiresAt,
      createdAt: now,
    });

    // Only send email if user exists (no enumeration leak)
    if (user) {
      await emailService.sendPasswordResetEmail({
        to: normalizedEmail,
        code,
      });
    }

    return { success: true };
  }

  async function resetPassword(email, code, newPassword) {
    if (!email || !code || !newPassword) {
      throw new AppError('Invalid request', 400);
    }

    if (newPassword.length < 8) {
      throw new AppError('Password must be at least 8 characters', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await usersRepository.findByEmail(normalizedEmail);
    if (!user) {
      throw new AppError('Invalid code or email', 400);
    }

    const now = nowProvider();
    const activeRequest =
      await passwordResetRepository.findLatestActiveByUserId(
        user.userId,
        now
      );

    if (!activeRequest) {
      throw new AppError('Invalid code or expired', 400);
    }

    const providedHash = hashCode(code);

    if (providedHash !== activeRequest.codeHash) {
      throw new AppError('Invalid code', 400);
    }

    const passwordHash = await argon2.hash(newPassword);

    await usersRepository.updatePassword(user.userId, passwordHash);

    await passwordResetRepository.markUsed(activeRequest.requestId, now);

    return { success: true };
  }

  return {
    requestReset,
    resetPassword,
  };
}

module.exports = { createPasswordResetService };