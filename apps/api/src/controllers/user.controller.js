const { services } = require('../composition/root');
const { success } = require('../utils/response');

const { paymentsService, ordersService } = services;

/**
 * GET /api/me/payments
 * Returns all payments for the authenticated user
 */
async function getMyPayments(req, res, next) {
  try {
    const { userId } = req.user;
    const payments = await paymentsService.getPaymentsByUserId(userId);
    success(res, payments, 'Payments retrieved successfully');
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/me/orders
 * Returns all orders for the authenticated user
 */
async function getMyOrders(req, res, next) {
  try {
    const { userId } = req.user;
    const orders = await ordersService.getOrdersByUserId(userId);
    success(res, orders, 'Orders retrieved successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyPayments,
  getMyOrders,
};
