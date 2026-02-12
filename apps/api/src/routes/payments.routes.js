const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/payments.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");
const { requirePaymentOwnerOrAdmin } = require("../middlewares/payments-ownership.middleware");

// Owner (customer) routes
router.post("/", requireAuth, paymentsController.createPayment);
router.get("/:paymentId", requireAuth, requirePaymentOwnerOrAdmin(), paymentsController.getPayment);
router.patch("/:paymentId/submit", requireAuth, requirePaymentOwnerOrAdmin(), paymentsController.submitPayment);

// Admin only
router.get("/", requireAuth, requireRole("admin"), paymentsController.listPayments);
router.patch("/:paymentId/confirm", requireAuth, requireRole("admin"), paymentsController.confirmPayment);
router.patch("/:paymentId/reject", requireAuth, requireRole("admin"), paymentsController.rejectPayment);

module.exports = router;