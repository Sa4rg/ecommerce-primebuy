const { AppError } = require("../utils/errors");
const { services } = require("../composition/root");
const paymentsService = services.paymentsService;

function requirePaymentOwnerOrAdmin() {
  return async (req, res, next) => {
    try {
      const { paymentId } = req.params;

      if (req.user?.role === "admin") return next();

      if (!req.user?.userId) {
        throw new AppError("Unauthorized", 401);
      }

      const payment = await paymentsService.getPaymentById(paymentId);

      if (payment.userId !== req.user.userId) {
        throw new AppError("Forbidden", 403);
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { requirePaymentOwnerOrAdmin };
