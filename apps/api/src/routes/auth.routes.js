// auth.routes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');
const {
  loginRateLimiter,
  registerRateLimiter,
  passwordResetRateLimiter,
} = require('../middlewares/rateLimiter');

const { validate } = require('../middlewares/validate.middleware');
const {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
} = require('../schemas/auth.schemas');

router.post('/register', registerRateLimiter, validate({ body: registerSchema }), authController.register);
router.post('/verify-email', validate({ body: verifyEmailSchema }), authController.verifyEmail);
router.post('/resend-verification', validate({ body: resendVerificationSchema }), authController.resendVerification);
router.post('/login', loginRateLimiter, validate({ body: loginSchema }), authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/logout-all', requireAuth, authController.logoutAll);

router.post('/password-reset/request', passwordResetRateLimiter, validate({ body: passwordResetRequestSchema }), authController.passwordResetRequest);
router.post('/password-reset/confirm', validate({ body: passwordResetConfirmSchema }), authController.passwordResetConfirm);


router.get('/oauth/google/start', authController.googleStart);
router.get('/oauth/google/callback', authController.googleCallback);

module.exports = router;
