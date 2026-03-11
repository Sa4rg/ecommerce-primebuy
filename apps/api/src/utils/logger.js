const pino = require("pino");
const { NODE_ENV } = require("../config/env");

const logger = pino({
  level: NODE_ENV === "production" ? "info" : "debug",
  transport:
    NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
          },
        }
      : undefined,
});

module.exports = logger;