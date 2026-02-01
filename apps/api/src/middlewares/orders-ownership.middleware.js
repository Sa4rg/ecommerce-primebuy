const { AppError } = require('../utils/errors');
const { services } = require('../composition/root');
const ordersService = services.ordersService;

function requireOrderOwnerOrAdmin() {
  return async (req, res, next) => {
    try {
      const { orderId } = req.params;

      if (req.user?.role === 'admin') return next();

      if (!req.user?.email) throw new AppError('Unauthorized', 401);

      const order = await ordersService.getOrderById(orderId);

      if (order.customer?.email !== req.user.email) {
        throw new AppError('Forbidden', 403);
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { requireOrderOwnerOrAdmin };
