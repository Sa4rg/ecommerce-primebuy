const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/errors');
const { JWT_SECRET } = require('../config/env');

function requireAuth(req, res, next) {
  try {
    // Try to get token from cookie first (httpOnly - secure)
    let token = req.cookies?.accessToken;

    // Fallback to Authorization header (for backward compatibility or mobile apps)
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader) {
        const [scheme, headerToken] = authHeader.split(' ');
        if (scheme === 'Bearer' && headerToken) {
          token = headerToken;
        }
      }
    }

    // Token must exist
    if (!token) {
      throw new AppError('Unauthorized', 401);
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Attach user context to request
    req.user = {
      userId: decoded.sub,
      role: decoded.role,
      email: decoded.email || null, 
    };

    // Continue
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

