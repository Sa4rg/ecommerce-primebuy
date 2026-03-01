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

/**
 * ✅ GET /api/me/last-shipping-address
 * Returns last shipping address snapshot for the authenticated user, or null.
 */
async function getMyLastShippingAddress(req, res, next) {
  try {
    const { userId } = req.user;
    const address = await ordersService.getLastShippingAddressByUserId(userId);
    success(res, address, 'Last shipping address retrieved successfully');
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyPayments,
  getMyOrders,
  getMyLastShippingAddress,
};
