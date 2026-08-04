/**
 * Sentry Server Configuration — Agent Tracing + Google GenAI
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/agent-tracing/
 * @see https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/integrations/google-genai/
 */

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV || 'development',

  // ── Tracing ────────────────────────────────────────────────────────────
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // ── Logs ───────────────────────────────────────────────────────────────
  enableLogs: true,

  // ── Privacy — scrub sensitive fields from server events ────────────────
  beforeSend(event) {
    if (event.request?.headers) {
      const scrubbed = new Set(['authorization', 'cookie', 'x-internal-secret'])
      for (const key of Object.keys(event.request.headers)) {
        if (scrubbed.has(key.toLowerCase())) {
          event.request.headers[key] = '[redacted]'
        }
      }
    }
    // Scrub API keys from AI spans
    if (event.spans) {
      for (const span of event.spans) {
        if (span.data && typeof span.data === 'object') {
          for (const key of Object.keys(span.data)) {
            if (key.toLowerCase().includes('api_key') || key.toLowerCase().includes('apikey')) {
              span.data[key] = '[REDACTED]'
            }
          }
        }
      }
    }
    return event
  },
})
