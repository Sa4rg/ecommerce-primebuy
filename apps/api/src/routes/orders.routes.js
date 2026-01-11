const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/orders.controller");

router.post("/", ordersController.createOrder);
router.get("/:orderId", ordersController.getOrder);
router.patch("/:orderId/process", ordersController.processOrder);
router.patch("/:orderId/complete", ordersController.completeOrder);
router.patch("/:orderId/cancel", ordersController.cancelOrder);

module.exports = router;
