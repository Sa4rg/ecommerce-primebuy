/**
 * Voiceflow Routes
 * 
 * API endpoints exclusively for Voiceflow chatbot integration.
 * All routes are protected by X-Voiceflow-API-Key authentication.
 */

const express = require('express');
const router = express.Router();

const voiceflowController = require('../controllers/voiceflow.controller');
const { requireVoiceflowAuth } = require('../middlewares/voiceflow-auth.middleware');
const { validate } = require('../middlewares/validate.middleware');

const {
  lookupOrderBodySchema,
  productSearchQuerySchema,
  productIdParamSchema,
} = require('../schemas/voiceflow.schemas');

// Apply Voiceflow authentication to all routes
router.use(requireVoiceflowAuth);

// Product endpoints
router.get(
  '/products/search',
  validate({ query: productSearchQuerySchema }),
  voiceflowController.searchProducts
);

router.get(
  '/products/:id',
  validate({ params: productIdParamSchema }),
  voiceflowController.getProduct
);

// Order endpoint
router.post(
  '/orders/lookup',
  validate({ body: lookupOrderBodySchema }),
  voiceflowController.lookupOrder
);

module.exports = router;
