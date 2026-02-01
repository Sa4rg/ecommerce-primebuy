const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/payments.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");

router.post("/", paymentsController.createPayment);
router.patch("/:paymentId/submit", paymentsController.submitPayment);

// Admin only
router.patch("/:paymentId/confirm", requireAuth, requireRole("admin"), paymentsController.confirmPayment);
router.patch("/:paymentId/reject", requireAuth, requireRole("admin"), paymentsController.rejectPayment);

module.exports = router;