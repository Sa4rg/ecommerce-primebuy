const { success } = require("../utils/response");
const ordersService = require("../services/orders.service");

async function createOrder(req, res, next) {
  try {
    const { paymentId } = req.body;

    const order = await ordersService.createOrderFromPayment(paymentId);

    res.status(201);
    success(res, order, "Order created successfully");
  } catch (error) {
    return next(error);
  }
}

async function getOrder(req, res, next) {
  try {
    const { orderId } = req.params;

    const order = await ordersService.getOrderById(orderId);

    res.status(200);
    success(res, order, "Order retrieved successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = { createOrder, getOrder };
