const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const requestLogger = require('./middlewares/request-logger.middleware');
const { pingDb } = require('./utils/dbHealth');
const { NODE_ENV, FRONTEND_ORIGIN } = require('./config/env');

const app = express();
const isProduction = NODE_ENV === 'production';

// Trust first proxy in production
if (isProduction) {
  app.set('trust proxy', 1);
}

// Disable X-Powered-By
app.disable('x-powered-by');

// Security headers
app.use(
  helmet(
    isProduction
      ? {
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              baseUri: ["'self'"],
              formAction: ["'self'"],
              frameAncestors: ["'self'"],
              objectSrc: ["'none'"],
              scriptSrc: ["'self'"],
              scriptSrcAttr: ["'none'"],
              styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
              imgSrc: ["'self'", 'data:', 'https:'],
              fontSrc: ["'self'", 'data:', 'https:'],
              connectSrc: ["'self'", 'https:'],
              upgradeInsecureRequests: [],
            },
          },
        }
      : {
          contentSecurityPolicy: false,
        }
  )
);

// Request logging
app.use(requestLogger);

// Rate limiter configuration (disabled in test environment)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: NODE_ENV === 'development' ? 1000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again later',
  skip: () => NODE_ENV === 'test',
});

// CORS configuration
const corsOrigin = isProduction
  ? FRONTEND_ORIGIN
  : ['http://localhost:5173', 'https://uniocular-tensibly-aura.ngrok-free.dev'];

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const getUptimeSeconds = () => Math.floor(process.uptime());

app.get('/health', (req, res) => {
  const meta = { uptimeSeconds: getUptimeSeconds() };
  if (isProduction) meta.env = 'production';
  res.json({ status: 'ok', ...meta });
});

app.get('/ready', async (req, res) => {
  const dbOk = await pingDb();
  const meta = { uptimeSeconds: getUptimeSeconds() };
  if (isProduction) meta.env = 'production';

  if (dbOk) {
    res.status(200).json({ status: 'ok', db: 'ok', ...meta });
  } else {
    res.status(503).json({ status: 'degraded', db: 'down', ...meta });
  }
});

// API routes
app.use('/api', limiter, require('./routes/index'));

app.use(require('./middlewares/error.middleware'));

module.exports = app;