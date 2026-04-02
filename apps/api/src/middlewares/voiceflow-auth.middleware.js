/**
 * Voiceflow Authentication Middleware
 * 
 * Validates X-Voiceflow-API-Key header against VOICEFLOW_API_KEY env variable.
 * Used to restrict Voiceflow-specific endpoints to authorized chatbot requests only.
 */

const { VOICEFLOW_API_KEY } = require('../config/env');

function requireVoiceflowAuth(req, res, next) {
  const apiKey = req.headers['x-voiceflow-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'Missing X-Voiceflow-API-Key header',
      errorCode: 'MISSING_API_KEY',
    });
  }

  if (apiKey !== VOICEFLOW_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Invalid API key',
      errorCode: 'INVALID_API_KEY',
    });
  }

  next();
}

module.exports = { requireVoiceflowAuth };
