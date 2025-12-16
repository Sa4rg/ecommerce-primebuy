const { fail } = require('../utils/response');

function errorMiddleware(err, req, res, next) {
  console.error(err.stack);
  fail(res, err.message || 'Internal Server Error', 500);
}

module.exports = errorMiddleware;