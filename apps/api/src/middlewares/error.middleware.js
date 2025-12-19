const { fail } = require('../utils/response');

function errorMiddleware(err, req, res, next) {
  console.error(err.stack);
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  fail(res, message, statusCode);
}

module.exports = errorMiddleware;