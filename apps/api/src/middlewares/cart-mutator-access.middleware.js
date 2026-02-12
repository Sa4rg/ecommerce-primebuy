const jwt = require("jsonwebtoken");
const { AppError } = require("../utils/errors");
const { services } = require("../composition/root");

const cartService = services.cartService;

function tryParseAuthUser(req) {
  const header = req.headers.authorization;
  if (!header || typeof header !== "string") return null;

  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return {
      userId: decoded.sub,
      role: decoded.role || "customer",
    };
  } catch {
    return null;
  }
}

function requireCartMutatorAccess() {
  return async (req, res, next) => {
    try {
      const { cartId } = req.params;
      const cart = await cartService.getCart(cartId);

      // 1) If claimed => must be authenticated owner (or admin)
      if (cart.userId) {
        const user = tryParseAuthUser(req) ?? req.user;

        if (!user?.userId) {
          throw new AppError("Unauthorized", 401);
        }

        if (user.role === "admin") return next();

        if (cart.userId !== user.userId) {
          throw new AppError("Forbidden", 403);
        }

        // attach for downstream consistency
        req.user = user;
        return next();
      }

      // 2) If anonymous => must have X-Cart-Secret
      const secret = req.headers["x-cart-secret"];
      if (!secret || typeof secret !== "string") {
        throw new AppError("Forbidden", 403);
      }

      if (secret !== cart.cartSecret) {
        throw new AppError("Forbidden", 403);
      }

      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = { requireCartMutatorAccess };
