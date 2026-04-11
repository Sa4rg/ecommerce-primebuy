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

const lookupOrderByVerificationBodySchema = z.object({
  email: z.string()
    .trim()
    .min(1, { message: 'email is required' })
    .email({ message: 'email must be a valid email address' }),
  phone_last4: z.string()
    .trim()
    .min(1, { message: 'phone_last4 is required' })
    .length(4, { message: 'phone_last4 must be exactly 4 digits' })
    .regex(/^\d{4}$/, { message: 'phone_last4 must contain only numeric digits' }),
});

const productSearchQuerySchema = z.object({
  q: z.string().min(1, { message: 'Search query (q) is required' }),
});

const productIdParamSchema = z.object({
  id: z.string().min(1, { message: 'Product ID is required' }),
});

module.exports = {
  lookupOrderBodySchema,
  lookupOrderByVerificationBodySchema,
  productSearchQuerySchema,
  productIdParamSchema,
};
