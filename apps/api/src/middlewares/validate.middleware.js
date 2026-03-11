const { ZodError } = require('zod');
const { AppError } = require('../utils/errors');
const { fail } = require("../utils/response");

function validate(schemas, options = {}) {
  const { message = "Invalid request data" } = options;

  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }

      next();
    } catch (err) {
      return fail(res, message, 400);
    }
  };
}

module.exports = { validate };