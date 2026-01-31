const { NODE_ENV } = require('../config/env');

/**
 * Request Logger Middleware
 * 
 * Logs HTTP requests with timing information.
 * Uses console.log for successful requests (<500) and console.error for server errors (>=500).
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    const logParts = [
      method,
      originalUrl,
      statusCode,
      `${durationMs}ms`,
    ];

    // Include IP in production
    if (NODE_ENV === 'production') {
      logParts.push(`ip=${req.ip}`);
    }

    const logMessage = logParts.join(' ');

    // Log errors with console.error, everything else with console.log
    if (statusCode >= 500) {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  });

  next();
}

module.exports = requestLogger;
