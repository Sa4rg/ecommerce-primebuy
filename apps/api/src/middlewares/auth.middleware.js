const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errors');
const { JWT_SECRET } = require('../config/env');

function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // 1) Header must exist
    if (!authHeader) {
      throw new AppError('Unauthorized', 401);
    }

    // 2) Must follow "Bearer <token>"
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new AppError('Unauthorized', 401);
    }

    // 3) Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 4) Attach user context to request
    req.user = {
      userId: decoded.sub,
      role: decoded.role,
    };

    // 5) Continue
    next();
  } catch (err) {
    // JWT errors or custom AppError → 401
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new AppError('Unauthorized', 401));
    }

    next(err);
  }
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    // requireAuth debe haber seteado req.user
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return next();
  };
}

module.exports = { requireAuth, requireRole };

