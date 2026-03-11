// apps/api/src/schemas/checkout.schemas.js
const { z } = require('zod');

const checkoutIdParamSchema = z.object({
  checkoutId: z.string().trim().min(1),
});

const createCheckoutSchema = z.object({
  cartId: z.string().trim().min(1),
});

const updateCustomerSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    email: z.string().trim().toLowerCase().email().optional(),
    phone: z.string().trim().min(1).max(40).optional(),
  })
  .refine(
    (value) => Object.keys(value).length > 0,
    { message: 'At least one customer field is required' }
);

const shippingMethodSchema = z.enum([
  'pickup',
  'delivery',
  'local_delivery',
  'national_shipping',
]);

const shippingAddressSchema = z.object({
  recipientName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(40),
  state: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120),
  line1: z.string().trim().min(1).max(200),
  reference: z.string().trim().max(240).nullable().optional(),
});

const updateShippingSchema = z
  .object({
    method: shippingMethodSchema,
    address: shippingAddressSchema.nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.method === 'pickup') {
      return;
    }

    if (!value.address) {
      ctx.addIssue({
        code: 'custom',
        path: ['address'],
        message: 'Address is required for shipping method',
      });
    }
  });

const cancelCheckoutSchema = z.object({}).strict();

module.exports = {
  checkoutIdParamSchema,
  createCheckoutSchema,
  updateCustomerSchema,
  updateShippingSchema,
  cancelCheckoutSchema,
};