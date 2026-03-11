const { z } = require("zod");

const paymentIdParamSchema = z.object({
  paymentId: z.string().trim().min(1),
});

const createPaymentSchema = z.object({
  checkoutId: z.string().trim().min(1),
  method: z.string().trim().min(1),
});

const submitPaymentSchema = z.object({
  reference: z.string().trim().min(1).max(200),
});

const confirmPaymentSchema = z.object({
  note: z.string().trim().min(1).max(500).nullable().optional(),
});

const rejectPaymentSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

const listPaymentsQuerySchema = z.object({
  status: z.string().trim().min(1).optional(),
});

module.exports = {
  paymentIdParamSchema,
  createPaymentSchema,
  submitPaymentSchema,
  confirmPaymentSchema,
  rejectPaymentSchema,
  listPaymentsQuerySchema,
};