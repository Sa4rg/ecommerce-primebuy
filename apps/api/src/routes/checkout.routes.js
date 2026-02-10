const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkout.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

router.post("/", requireAuth, checkoutController.createCheckout);
router.get("/:checkoutId", requireAuth, checkoutController.getCheckoutById);

module.exports = router;
