const express = require("express");
const router = express.Router();
const ordersController = require("../controllers/orders.controller");
const { requireAuth, requireRole } = require('../middlewares/auth.middleware');
const { requireOrderOwnerOrAdmin } = require('../middlewares/orders-ownership.middleware');


router.post("/", requireAuth, ordersController.createOrder);
router.get("/:orderId", requireAuth, requireOrderOwnerOrAdmin(), ordersController.getOrder);
router.patch("/:orderId/process", requireAuth, requireRole("admin"), ordersController.processOrder);
router.patch("/:orderId/complete", requireAuth, requireRole("admin"), ordersController.completeOrder);
router.patch("/:orderId/cancel", requireAuth, requireOrderOwnerOrAdmin(), ordersController.cancelOrder);
router.patch("/:orderId/shipping", requireAuth, requireRole("admin"), ordersController.setShipping);
router.patch("/:orderId/shipping/dispatch", requireAuth, requireRole("admin"), ordersController.dispatchShipping);
router.patch("/:orderId/shipping/deliver", requireAuth, requireRole("admin"), ordersController.deliverShipping);

module.exports = router;
