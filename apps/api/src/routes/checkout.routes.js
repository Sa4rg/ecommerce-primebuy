const express = require("express");
const router = express.Router();
const checkoutController = require("../controllers/checkout.controller");
const { requireAuth } = require("../middlewares/auth.middleware");

router.post("/", requireAuth, checkoutController.createCheckout);

module.exports = router;
