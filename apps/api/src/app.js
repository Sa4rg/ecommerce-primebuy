const express = require('express');
const path = require('path');
const cors = require('cors');
const { NODE_ENV, FRONTEND_ORIGIN } = require('./config/env');

const app = express();

// Trust proxy in production (for X-Forwarded-* headers)
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// CORS configuration based on environment
const corsOrigin = NODE_ENV === 'production' 
  ? FRONTEND_ORIGIN 
  : 'http://localhost:5173';

app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: "ok" });
});

app.use('/api', require('./routes/index'));

app.use(require('./middlewares/error.middleware'));

module.exports = app;