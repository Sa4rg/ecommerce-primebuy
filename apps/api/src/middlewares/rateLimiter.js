const { rateLimit, ipKeyGenerator } = require("express-rate-limit");

/**
 * Rate limiter for login endpoint
 * - Prevents brute force attacks
 * - Limits by email + IP combination
 * - 5 attempts per 15 minutes
 */
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: "Too many login attempts. Please try again in 15 minutes.",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  
  // Rate limit by email + IP combination
  // Uses ipKeyGenerator to properly handle IPv6 addresses
  keyGenerator: (req) => {
    const email = req.body?.email || "unknown";
    const normalizedIp = ipKeyGenerator(req);
    return `login:${email}:${normalizedIp}`;
  },
  
  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many login attempts from this account. Please try again in 15 minutes.",
    });
  },
  
  // Skip rate limiting in test environment
  skip: (req) => process.env.NODE_ENV === "test",
});

/**
 * Rate limiter for registration endpoint
 * - Prevents spam registrations
 * - Limits by IP
 * - 3 registrations per hour
 */
const registerRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per window
  message: {
    success: false,
    message: "Too many accounts created from this IP. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  // Uses ipKeyGenerator to properly handle IPv6 addresses
  keyGenerator: (req) => {
    const normalizedIp = ipKeyGenerator(req);
    return `register:${normalizedIp}`;
  },
  
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many registration attempts. Please try again in 1 hour.",
    });
  },
  
  skip: (req) => process.env.NODE_ENV === "test",
});

/**
 * Rate limiter for password reset endpoint
 * - Prevents password reset spam
 * - Limits by email
 * - 3 attempts per hour
 */
const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per window
  message: {
    success: false,
    message: "Too many password reset requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  keyGenerator: (req) => {
    const email = req.body?.email || "unknown";
    return `password-reset:${email}`;
  },
  
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many password reset attempts for this email. Please try again in 1 hour.",
    });
  },
  
  skip: (req) => process.env.NODE_ENV === "test",
});

module.exports = {
  loginRateLimiter,
  registerRateLimiter,
  passwordResetRateLimiter,
};
