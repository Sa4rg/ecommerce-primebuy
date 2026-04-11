/**
 * Voiceflow Controller
 * 
 * HTTP layer for Voiceflow chatbot integration.
 * Translates HTTP requests to service calls and formats responses.
 * 
 * Business logic is in voiceflow.service.js
 */

const { services } = require('../composition/root');
const voiceflowService = services.voiceflowService;

/**
 * GET /api/voiceflow/products/search?q=laptop
 * Search products by name
 */
async function searchProducts(req, res, next) {
  try {
    const { q } = req.query;
    const result = await voiceflowService.searchProducts(q);

    const statusCode = result.success ? 200 : 400;
    return res.status(statusCode).json(result);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/voiceflow/products/:id
 * Get product details by ID
 */
async function getProduct(req, res, next) {
  try {
    const { id } = req.params;
    const result = await voiceflowService.getProduct(id);

    return res.status(200).json(result);
  } catch (error) {
    // Handle NotFoundError specifically
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        found: false,
        customerMessage: 'No encontré ese producto. ¿Podrías verificar el ID?',
        errorCode: 'PRODUCT_NOT_FOUND',
      });
    }
    return next(error);
  }
}

/**
 * POST /api/voiceflow/orders/lookup
 * Lookup order by orderId + email validation
 */
async function lookupOrder(req, res, next) {
  try {
    const { orderId, email } = req.body;
    const result = await voiceflowService.lookupOrder(orderId, email);

    const statusCode = result.success ? 200 : 403;
    return res.status(statusCode).json(result);
  } catch (error) {
    // Handle NotFoundError specifically
    if (error.statusCode === 404) {
      return res.status(404).json({
        success: false,
        found: false,
        customerMessage: 'No encontré esa orden. Por favor verifica el número de pedido.',
        errorCode: 'ORDER_NOT_FOUND',
      });
    }
    return next(error);
  }
}

/**
 * POST /api/voiceflow/orders/lookup-by-verification
 * Lookup user orders by email + phone_last4 verification
 */
async function lookupOrderByVerification(req, res, next) {
  try {
    const { email, phone_last4 } = req.body;
    const result = await voiceflowService.lookupOrdersByVerification(email, phone_last4);

    const statusCode = result.success ? 200 : 403;
    return res.status(statusCode).json(result);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  searchProducts,
  getProduct,
  lookupOrder,
  lookupOrderByVerification,
};
