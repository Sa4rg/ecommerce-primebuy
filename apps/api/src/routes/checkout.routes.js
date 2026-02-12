const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkout.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

router.post("/", requireAuth, checkoutController.createCheckout);
router.get("/:checkoutId", requireAuth, checkoutController.getCheckoutById);
router.patch("/:checkoutId/shipping", requireAuth, checkoutController.updateShipping);
router.patch("/:checkoutId/customer", requireAuth, checkoutController.updateCustomer);
router.patch("/:checkoutId/cancel", requireAuth, checkoutController.cancelCheckout);


module.exports = router;
