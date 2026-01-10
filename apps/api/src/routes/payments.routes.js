const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/payments.controller");

router.post("/", paymentsController.createPayment);
router.patch("/:paymentId/submit", paymentsController.submitPayment);

module.exports = router;
