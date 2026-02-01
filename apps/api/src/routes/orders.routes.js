const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/orders.controller");
const { requireAuth } = require('../middlewares/auth.middleware');

router.post("/", requireAuth, ordersController.createOrder);
router.get("/:orderId", ordersController.getOrder);
router.patch("/:orderId/process", ordersController.processOrder);
router.patch("/:orderId/complete", ordersController.completeOrder);
router.patch("/:orderId/cancel", ordersController.cancelOrder);
router.patch("/:orderId/shipping", ordersController.setShipping);
router.patch("/:orderId/shipping/dispatch", ordersController.dispatchShipping);
router.patch("/:orderId/shipping/deliver", ordersController.deliverShipping);

module.exports = router;
