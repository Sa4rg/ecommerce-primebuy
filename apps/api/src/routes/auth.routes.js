// auth.routes.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middlewares/auth.middleware');

router.post('/register', authController.register);
router.post('/verify-email', authController.verifyEmail);
router.post('/resend-verification', authController.resendVerification);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/logout-all', requireAuth, authController.logoutAll);

router.post('/password-reset/request', authController.passwordResetRequest);
router.post('/password-reset/confirm', authController.passwordResetConfirm);


router.get('/oauth/google/start', authController.googleStart);
router.get('/oauth/google/callback', authController.googleCallback);

module.exports = router;
