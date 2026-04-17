// CRITICAL: Import instrument.js FIRST, before anything else
// This ensures Sentry can properly instrument Express and other modules
require('./instrument');

const env = require('./config/env');
const app = require('./app');
const db = require('./db/knex');

const PORT = env.PORT;

const server = app.listen(PORT, () => {
  const envPrefix = env.NODE_ENV === 'production' ? '[PROD]' : '[DEV]';
  const message = env.NODE_ENV === 'production'
    ? `${envPrefix} Server running on port ${PORT}`
    : `${envPrefix} Server running on http://localhost:${PORT}`;
  
  console.log(message);
});

// Graceful shutdown handler

let isShuttingDown = false;

function shutdown(signal) {

  if (isShuttingDown) {
    console.log(`Shutdown already in progress, ignoring ${signal}`);
    return;
  }

  isShuttingDown = true;
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(() => {
    console.log('HTTP server closed');
    
    db.destroy()
      .then(() => {
        console.log('Database connections closed');
        process.exit(0);
      })
      .catch((err) => {
        console.error('Error closing database connections:', err);
        process.exit(1);
      });
  });
}

// Listen for termination signals
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));