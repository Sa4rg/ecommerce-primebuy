const logger = require("../utils/logger");
const { NODE_ENV } = require("../config/env");

function requestLogger(req, res, next) {
  const startTime = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - startTime;

    const logData = {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
    };

    if (NODE_ENV === "production") {
      logData.ip = req.ip;
    }

    if (res.statusCode >= 500) {
      logger.error(logData, "request_error");
    } else if (res.statusCode >= 400) {
      logger.warn(logData, "request_client_error");
    } else {
      logger.info(logData, "request_completed");
    }
  });

  next();
}

module.exports = requestLogger;