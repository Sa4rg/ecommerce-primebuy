/**
 * Voiceflow Schemas
 * 
 * Validation schemas for Voiceflow-specific endpoints
 */

const { z } = require('zod');

const lookupOrderBodySchema = z.object({
  orderId: z.string().uuid({ message: 'orderId must be a valid UUID' }),
  email: z.string().email({ message: 'email must be a valid email address' }),
});

const productSearchQuerySchema = z.object({
  q: z.string().min(1, { message: 'Search query (q) is required' }),
});

const productIdParamSchema = z.object({
  id: z.string().min(1, { message: 'Product ID is required' }),
});

module.exports = {
  lookupOrderBodySchema,
  productSearchQuerySchema,
  productIdParamSchema,
};
