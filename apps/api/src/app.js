const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const requestLogger = require('./middlewares/request-logger.middleware');
const { pingDb } = require('./utils/dbHealth');
const { NODE_ENV, FRONTEND_ORIGIN } = require('./config/env');


const app = express();

// Disable X-Powered-By
app.disable('x-powered-by');

// Basic security headers
app.use(helmet());

// Request logging
app.use(requestLogger);

// Rate limiter configuration (disabled in test environment)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: NODE_ENV === 'development' ? 1000 : 100, // Higher limit in dev (StrictMode doubles requests)
  standardHeaders: true, // Return rate limit info in RateLimit-* headers
  legacyHeaders: false, // Disable X-RateLimit-* headers
  message: 'Too many requests from this IP, please try again later',
  skip: () => NODE_ENV === 'test', // Disable rate limiting in tests
});

// Trust proxy in production (for X-Forwarded-* headers)
//if (NODE_ENV === 'production') {
//  app.set('trust proxy', 1);
//}

// CORS configuration based on environment
const cookieParser = require("cookie-parser");

// CORS configuration based on environment
const corsOrigin =
  NODE_ENV === "production" ? FRONTEND_ORIGIN : "http://localhost:5173";

// ✅ IMPORTANTE: credentials: true para que el browser envíe cookies
app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


const getUptimeSeconds = () => Math.floor(process.uptime());

app.get('/health', (req, res) => {
  const meta = { uptimeSeconds: getUptimeSeconds() };
  if (NODE_ENV === 'production') meta.env = 'production';
  res.json({ status: "ok", ...meta });
});


app.get('/ready', async (req, res) => {
  const dbOk = await pingDb();
  const meta = { uptimeSeconds: getUptimeSeconds() };
  if (NODE_ENV === 'production') meta.env = 'production';
  if (dbOk) {
    res.status(200).json({ status: "ok", db: "ok", ...meta });
  } else {
    res.status(503).json({ status: "degraded", db: "down", ...meta });
  }
});

// Apply rate limiting only to API routes
app.use('/api', limiter, require('./routes/index'));

app.use(require('./middlewares/error.middleware'));

module.exports = app;