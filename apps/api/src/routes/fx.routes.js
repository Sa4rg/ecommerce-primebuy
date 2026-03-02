/**
 * FX Routes
 *
 * Public endpoints for FX rates.
 */

const express = require('express');
const router = express.Router();
const fxController = require('../controllers/fx.controller');

// GET /api/fx/usd-ves - Get current USD->VES rate (public)
router.get('/usd-ves', fxController.getUsdVesRate);

module.exports = router;
