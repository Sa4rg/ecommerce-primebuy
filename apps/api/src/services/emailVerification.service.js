// emailVerification.service.js
// Service for email verification OTP flow

const crypto = require("crypto");
const { AppError } = require("../utils/errors");
const { RESET_CODE_PEPPER, RESET_CODE_EXPIRES_MINUTES } = require("../config/env");

function hashCode(code, pepper = RESET_CODE_PEPPER) {
  return crypto.createHash("sha256").update(code + pepper).digest("hex");
}

function generate6DigitCode() {
  return crypto.randomInt(100000, 999999).toString();
}

const MAX_ATTEMPTS = 5;
const RESEND_RATE_LIMIT_MINUTES = 1; // 1 code per minute
const RESEND_RATE_LIMIT_COUNT = 5;   // max 5 codes per 10 minutes

function createEmailVerificationService({
  emailVerificationsRepository,
  usersRepository,
  emailService,
  idGenerator = () => crypto.randomUUID(),
  nowProvider = () => new Date(),
  codeExpiresMinutes = RESET_CODE_EXPIRES_MINUTES,
}) {
  if (!emailVerificationsRepository) throw new Error("emailVerificationsRepository is required");
  if (!usersRepository) throw new Error("usersRepository is required");
  if (!emailService) throw new Error("emailService is required");

  /**
   * Create and send verification code for a user
   */
  async function sendVerificationCode(userId, email) {
    const now = nowProvider();
    const expiresAt = new Date(now.getTime() + codeExpiresMinutes * 60 * 1000);

    const code = generate6DigitCode();
    const codeHash = hashCode(code);

    console.log("[EMAIL VERIFICATION] creating code", {
      userId,
      email,
      expiresAt: expiresAt.toISOString(),
    });

    await emailVerificationsRepository.create({
      verificationId: idGenerator(),
      userId,
      codeHash,
      expiresAt,
      createdAt: now,
    });

    console.log("[EMAIL VERIFICATION] DB record created, now sending email", { userId, email });

    try {
      const emailResult = await emailService.sendVerificationEmail({ to: email, code });
      console.log("[EMAIL VERIFICATION] email sent successfully", { 
        userId, 
        email,
        emailId: emailResult.id,
      });
      return { sent: true, emailId: emailResult.id };
    } catch (emailError) {
      console.error("[EMAIL VERIFICATION] email send FAILED", {
        userId,
        email,
        error: emailError.message,
        stack: emailError.stack,
      });
      throw emailError;
    }
  }

  /**
   * Verify code and mark user as verified
   * Returns the user object for token issuance
   */
  async function verifyEmail(email, code) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await usersRepository.findByEmail(normalizedEmail);

    if (!user) {
      throw new AppError("Invalid code or email", 400);
    }

    if (user.emailVerified) {
      throw new AppError("Email already verified", 400);
    }

    const now = nowProvider();
    const activeRequest = await emailVerificationsRepository.findLatestActiveByUserId(
      user.userId,
      now
    );

    if (!activeRequest) {
      throw new AppError("No active verification code. Request a new one.", 400);
    }

    // Rate limit attempts
    if (activeRequest.attempts >= MAX_ATTEMPTS) {
      throw new AppError("Too many attempts. Request a new code.", 429);
    }

    const providedHash = hashCode(code);

    if (providedHash !== activeRequest.codeHash) {
      await emailVerificationsRepository.incrementAttempts(activeRequest.verificationId);
      throw new AppError("Invalid code", 400);
    }

    // Mark code as used
    await emailVerificationsRepository.markUsed(activeRequest.verificationId, now);

    // Mark user as verified
    await usersRepository.markEmailVerified(user.userId, now);

    // Return user for token issuance
    return { ...user, emailVerified: true };
  }

  /**
   * Resend verification code with rate limiting
   */
  async function resendVerificationCode(email) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await usersRepository.findByEmail(normalizedEmail);

    // Silent success to prevent user enumeration
    if (!user) return { sent: true };

    if (user.emailVerified) {
      throw new AppError("Email already verified", 400);
    }

    const now = nowProvider();

    // Rate limit: 1 code per minute
    const oneMinuteAgo = new Date(now.getTime() - RESEND_RATE_LIMIT_MINUTES * 60 * 1000);
    const recentCount = await emailVerificationsRepository.countRecentByUserId(user.userId, oneMinuteAgo);
    
    if (recentCount >= 1) {
      throw new AppError("Please wait before requesting another code.", 429);
    }

    // Rate limit: max 5 codes per 10 minutes
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);
    const totalRecent = await emailVerificationsRepository.countRecentByUserId(user.userId, tenMinutesAgo);
    
    if (totalRecent >= RESEND_RATE_LIMIT_COUNT) {
      throw new AppError("Too many requests. Try again later.", 429);
    }

    return sendVerificationCode(user.userId, user.email);
  }

  return {
    sendVerificationCode,
    verifyEmail,
    resendVerificationCode,
  };
}

module.exports = { createEmailVerificationService };
