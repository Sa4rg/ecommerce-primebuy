const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkout.controller");
const { requireAuth } = require("../middlewares/auth.middleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  checkoutIdParamSchema,
  createCheckoutSchema,
  updateCustomerSchema,
  updateShippingSchema,
  cancelCheckoutSchema,
} = require("../schemas/checkout.schemas");

router.post("/", requireAuth, validate({ body: createCheckoutSchema }), checkoutController.createCheckout);
router.get("/:checkoutId", requireAuth, validate({ params: checkoutIdParamSchema }), checkoutController.getCheckoutById);
router.patch("/:checkoutId/shipping", requireAuth, validate({ params: checkoutIdParamSchema, body: updateShippingSchema }), checkoutController.updateShipping);
router.patch("/:checkoutId/customer", requireAuth, validate({ params: checkoutIdParamSchema, body: updateCustomerSchema }), checkoutController.updateCustomer);
router.patch("/:checkoutId/cancel", requireAuth, validate({ params: checkoutIdParamSchema}), checkoutController.cancelCheckout);


module.exports = router;
