const { z } = require('zod');

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email();

const passwordSchema = z
  .string()
  .min(1);

const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().trim().max(100).optional().nullable(),
});

const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

const verifyEmailSchema = z.object({
  email: emailSchema,
  code: z.string().min(1),
});

const resendVerificationSchema = z.object({
  email: emailSchema,
});

const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

const passwordResetConfirmSchema = z.object({
  email: emailSchema,
  code: z.string().min(1),
  newPassword: z.string().min(8),
});

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
};