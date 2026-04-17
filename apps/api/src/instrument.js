/**
 * Sentry Instrumentation
 * 
 * CRITICAL: This file MUST be imported BEFORE any other modules
 * (especially Express) to ensure proper instrumentation.
 * 
 * See: https://docs.sentry.io/platforms/javascript/guides/express/
 */

// Load environment variables FIRST
require('./config/env');

const Sentry = require("@sentry/node");
const { nodeProfilingIntegration } = require("@sentry/profiling-node");

// Only initialize in production or if explicitly enabled
if (process.env.NODE_ENV === "production" || process.env.SENTRY_ENABLED) {
  
  if (!process.env.SENTRY_DSN) {
    console.warn("[Sentry] SENTRY_DSN not configured, skipping initialization");
  } else {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      
      // Performance monitoring
      tracesSampleRate: process.env.SENTRY_TRACES_SAMPLE_RATE 
        ? parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE) 
        : 0.1, // 10% of requests in production
      
      // Profiling
      profilesSampleRate: process.env.SENTRY_PROFILES_SAMPLE_RATE
        ? parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE)
        : 0.1, // 10% of transactions

      integrations: [
        nodeProfilingIntegration(),
      ],

      environment: process.env.NODE_ENV || "production",
      
      // Release tracking (optional but recommended)
      release: process.env.RENDER_GIT_COMMIT || undefined,

      // Only send default PII data when explicitly enabled
      // In production, this should be controlled via environment variable to ensure GDPR compliance
      sendDefaultPii: process.env.SENTRY_SEND_DEFAULT_PII === "true",
    });

    console.log("[Sentry] Initialized successfully");
    console.log(`[Sentry] Environment: ${process.env.NODE_ENV}`);
    console.log(`[Sentry] Traces sample rate: ${Sentry.getClient()?.getOptions().tracesSampleRate}`);
  }
  
} else {
  console.log("[Sentry] Not initialized (not in production)");
}

module.exports = Sentry;
