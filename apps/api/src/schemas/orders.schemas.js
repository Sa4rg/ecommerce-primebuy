const { z } = require("zod");

const orderIdParamSchema = z.object({
  orderId: z.string().trim().min(1),
});

const createOrderSchema = z.object({
  paymentId: z.string().trim().min(1),
});

const cancelOrderSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

const shippingMethodSchema = z.enum([
  "pickup",
  "local_delivery",
  "national_shipping",
]);

const shippingAddressSchema = z.object({
  recipientName: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(1).max(40),
  state: z.string().trim().min(1).max(120),
  city: z.string().trim().min(1).max(120),
  line1: z.string().trim().min(1).max(200),
  reference: z.string().trim().max(240).nullable().optional(),
});

const setShippingSchema = z
  .object({
    method: shippingMethodSchema,
    address: shippingAddressSchema.nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.method === "pickup") {
      return;
    }

    if (!value.address) {
      ctx.addIssue({
        code: "custom",
        path: ["address"],
        message: "Address is required for shipping method",
      });
    }
  });

const carrierSchema = z.object({
  name: z.string().trim().min(1).max(120),
  trackingNumber: z.string().trim().min(1).max(120),
});

const dispatchShippingSchema = z.object({
  carrier: carrierSchema.optional(),
});

module.exports = {
  orderIdParamSchema,
  createOrderSchema,
  cancelOrderSchema,
  setShippingSchema,
  dispatchShippingSchema,
};