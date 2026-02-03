const { AppError } = require('../utils/errors');
const { services } = require('../composition/root');
const cartService = services.cartService;

function requireCartOwnerOrAdmin() {
  return async (req, res, next) => {
    try {
      if (req.user.role === 'admin') return next();

      const { cartId } = req.params;
      const cart = await cartService.getCart(cartId);

      if (cart.userId !== req.user.userId) {
        throw new AppError('Forbidden', 403);
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requireCartOwnerOrAdmin };
