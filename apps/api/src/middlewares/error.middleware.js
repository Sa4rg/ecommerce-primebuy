const { fail } = require('../utils/response');
const env = require('../config/env');

function errorMiddleware(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (env.NODE_ENV !== 'production') {
    console.error(err.stack);
  } else {
    console.error({
      message: err.message,
      statusCode,
      path: req.originalUrl,
      method: req.method,
    });
  }

  fail(res, message, statusCode);
}

module.exports = errorMiddleware;
