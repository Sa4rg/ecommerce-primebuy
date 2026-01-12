const { success } = require("../utils/response");
const { services } = require("../composition/root");
const ordersService = services.ordersService;

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

async function processOrder(req, res, next) {
  try {
    const { orderId } = req.params;

    const order = await ordersService.processOrder(orderId);

    res.status(200);
    success(res, order, "Order processed successfully");
  } catch (error) {
    return next(error);
  }
}

async function completeOrder(req, res, next) {
  try {
    const { orderId } = req.params;

    const order = await ordersService.completeOrder(orderId);

    res.status(200);
    success(res, order, "Order completed successfully");
  } catch (error) {
    return next(error);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;

    const order = await ordersService.cancelOrder(orderId, reason);

    res.status(200);
    success(res, order, "Order cancelled successfully");
  } catch (error) {
    return next(error);
  }
}

async function setShipping(req, res, next) {
  try {
    const { orderId } = req.params;
    const { method, address } = req.body;

    const order = await ordersService.setShippingDetails(orderId, { method, address });

    res.status(200);
    success(res, order, "Shipping updated successfully");
  } catch (error) {
    return next(error);
  }
}

async function dispatchShipping(req, res, next) {
  try {
    const { orderId } = req.params;
    const carrier = req.body?.carrier ?? null;

    const order = await ordersService.markDispatched(orderId, carrier);

    res.status(200);
    success(res, order, "Shipping dispatched successfully");
  } catch (error) {
    return next(error);
  }
}

async function deliverShipping(req, res, next) {
  try {
    const { orderId } = req.params;

    const order = await ordersService.markDelivered(orderId);

    res.status(200);
    success(res, order, "Shipping delivered successfully");
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  createOrder,
  getOrder,
  processOrder,
  completeOrder,
  cancelOrder,
  setShipping,
  dispatchShipping,
  deliverShipping,
};
