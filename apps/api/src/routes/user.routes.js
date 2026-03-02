// apps/api/src/routes/user.routes.js
const express = require('express');
const { requireAuth } = require('../middlewares/auth.middleware');
const userController = require('../controllers/user.controller');

const router = express.Router();

// All routes require authentication
router.use(requireAuth);

// GET /api/me - Get current authenticated user
router.get('/', userController.getMe);

// GET /api/me/payments - Get current user's payments
router.get('/payments', userController.getMyPayments);

// GET /api/me/orders - Get current user's orders
router.get('/orders', userController.getMyOrders);

// ✅ GET /api/me/last-shipping-address - Get user's last shipping address (if any)
router.get('/last-shipping-address', userController.getMyLastShippingAddress);

module.exports = router;