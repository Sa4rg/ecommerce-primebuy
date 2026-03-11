const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/orders.controller");
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { requireOrderOwnerOrAdmin } = require('../middlewares/orders-ownership.middleware');
const { validate } = require("../middlewares/validate.middleware");

const {
  orderIdParamSchema,
  createOrderSchema,
  cancelOrderSchema,
  setShippingSchema,
  dispatchShippingSchema,
} = require("../schemas/orders.schemas");


router.post("/", requireAuth, validate({ body: createOrderSchema }, { message: "Invalid order request" }), ordersController.createOrder);
router.get("/:orderId", requireAuth, requireOrderOwnerOrAdmin(), validate({ params: orderIdParamSchema }), ordersController.getOrder);
router.patch("/:orderId/process", requireAuth, requireRole("admin"), validate({ params: orderIdParamSchema }), ordersController.processOrder);
router.patch("/:orderId/complete", requireAuth, requireRole("admin"), validate({ params: orderIdParamSchema }), ordersController.completeOrder);
router.patch("/:orderId/cancel", requireAuth, requireOrderOwnerOrAdmin(), validate({ params: orderIdParamSchema, body: cancelOrderSchema },  { message: "Invalid cancellation reason" }), ordersController.cancelOrder);
router.patch("/:orderId/shipping", requireAuth, requireRole("admin"), validate({ params: orderIdParamSchema, body: setShippingSchema }, { message: "Invalid shipping details" }), ordersController.setShipping);
router.patch("/:orderId/shipping/dispatch", requireAuth, requireRole("admin"), validate({ params: orderIdParamSchema, body: dispatchShippingSchema }, { message: "Invalid dispatch data" }), ordersController.dispatchShipping);
router.patch("/:orderId/shipping/deliver", requireAuth, requireRole("admin"), validate({ params: orderIdParamSchema }), ordersController.deliverShipping);

module.exports = router;
