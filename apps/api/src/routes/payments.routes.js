const express = require("express");
const router = express.Router();
const paymentsController = require("../controllers/payments.controller");
const { requireAuth, requireRole } = require("../middlewares/auth.middleware");
const { requirePaymentOwnerOrAdmin } = require("../middlewares/payments-ownership.middleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  paymentIdParamSchema,
  createPaymentSchema,
  submitPaymentSchema,
  confirmPaymentSchema,
  rejectPaymentSchema,
  listPaymentsQuerySchema,
} = require("../schemas/payments.schemas");

// Owner (customer) routes
router.post("/", requireAuth, validate({ body: createPaymentSchema }), paymentsController.createPayment);
router.get("/:paymentId", requireAuth, requirePaymentOwnerOrAdmin(), validate({ params: paymentIdParamSchema }), paymentsController.getPayment);
router.patch(
  "/:paymentId/submit",
  requireAuth,
  validate(
    {
      params: paymentIdParamSchema,
      body: submitPaymentSchema,
    },
    { message: "Invalid payment proof" }
  ),
  requirePaymentOwnerOrAdmin(),
  paymentsController.submitPayment
);

// Admin only
router.get("/", requireAuth, requireRole("admin"), validate({ query: listPaymentsQuerySchema }), paymentsController.listPayments);
router.patch(
  "/:paymentId/confirm",
  requireAuth,
  requireRole("admin"),
  validate(
    {
      params: paymentIdParamSchema,
      body: confirmPaymentSchema,
    },
    { message: "Invalid payment review" }
  ),
  paymentsController.confirmPayment
);

router.patch(
  "/:paymentId/reject",
  requireAuth,
  requireRole("admin"),
  validate(
    {
      params: paymentIdParamSchema,
      body: rejectPaymentSchema,
    },
    { message: "Invalid payment review" }
  ),
  paymentsController.rejectPayment
);

module.exports = router;