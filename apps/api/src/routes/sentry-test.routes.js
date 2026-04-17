/**
 * Sentry Test Routes
 * 
 * Endpoints for testing Sentry error tracking.
 * Should only be accessible in development/staging.
 */

const express = require('express');
const router = express.Router();
const Sentry = require('../instrument');

/**
 * Test endpoint - Throws an unhandled error
 * GET /api/sentry-test/error
 */
router.get('/error', (req, res) => {
  throw new Error('🧪 Sentry test error - This is intentional!');
});

/**
 * Test endpoint - Captures exception manually
 * GET /api/sentry-test/capture-exception
 */
router.get('/capture-exception', (req, res) => {
  try {
    // Simulate some context
    const userData = { userId: 'test-user-123', email: 'test@example.com' };
    
    // Create and capture error
    const error = new Error('🧪 Manually captured exception test');
    Sentry.captureException(error, {
      user: userData,
      tags: { test: true, endpoint: 'capture-exception' },
      extra: { timestamp: new Date().toISOString() }
    });

    res.json({ 
      success: true, 
      message: 'Exception captured and sent to Sentry' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Test endpoint - Captures message
 * GET /api/sentry-test/capture-message
 */
router.get('/capture-message', (req, res) => {
  Sentry.captureMessage('🧪 Sentry test message - Manual message capture', 'warning');
  
  res.json({ 
    success: true, 
    message: 'Message sent to Sentry' 
  });
});

/**
 * Test endpoint - Async error
 * GET /api/sentry-test/async-error
 */
router.get('/async-error', async (req, res) => {
  // Simulate async operation that fails
  await new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error('🧪 Async operation failed - Sentry test'));
    }, 100);
  });
});

module.exports = router;
