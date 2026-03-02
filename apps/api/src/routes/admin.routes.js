/**
 * Admin FX Routes
 *
 * Admin-only endpoints for managing FX rates.
 */

const express = require('express');
const router = express.Router();
const fxController = require('../controllers/fx.controller');
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');

// POST /api/admin/fx/usd-ves - Set USD->VES rate (admin only)
router.post('/fx/usd-ves', requireAuth, requireRole('admin'), fxController.setUsdVesRate);

// PUT also supported for convenience
router.put('/fx/usd-ves', requireAuth, requireRole('admin'), fxController.setUsdVesRate);

module.exports = router;
